import mongoose from "mongoose";
import { NextRequest } from "next/server";
import * as route from "../route";
import * as detailRoute from "../[id]/route";
import * as dbModule from "../../db/dbConect";
import * as authModule from "../../Auth/middleware";
import ShoppingList from "../../Model/ShoppingList";
import User from "../../Model/User";
import {
  MOCK_TOKEN,
  MOCK_USER_ID,
  MOCK_LIST_ID,
  MOCK_INVALID_ID,
  MOCK_SHOPPING_LIST,
  MOCK_SHOPPING_LIST_WITH_MEMBERS,
  createAuthHeaders,
  createListRequestBody,
  updateListRequestBody,
  MOCK_OTHER_USER_ID,
} from "./testUtils";

// Mock modules
jest.mock("../../db/dbConect");
jest.mock("../../Auth/middleware");
jest.mock("../../Model/ShoppingList");
jest.mock("../../Model/User");

describe("ShoppingList API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbModule.default as jest.Mock).mockResolvedValue(undefined);
  });

  describe("GET /api/ShoppingList - Get all shopping lists", () => {
    it("should return all shopping lists for authenticated user (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest
            .fn()
            .mockResolvedValue([
              MOCK_SHOPPING_LIST,
              MOCK_SHOPPING_LIST_WITH_MEMBERS,
            ]),
        }),
      });

      // Act
      const response = await route.GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.shoppingLists).toHaveLength(2);
      expect(data.shoppingLists[0]._id.toString()).toBe(
        MOCK_LIST_ID.toString()
      );
      expect(authModule.authenticateUser).toHaveBeenCalled();
      expect(ShoppingList.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({
              ownerId: expect.any(mongoose.Types.ObjectId),
            }),
          ]),
        })
      );
    });

    it("should return 401 if user is not authenticated (ALTERNATIVE)", async () => {
      // Arrange
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await route.GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
      expect(ShoppingList.find).not.toHaveBeenCalled();
    });

    it("should return empty array when user has no lists (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      // Act
      const response = await route.GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.shoppingLists).toEqual([]);
    });

    it("should return 500 on server error (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.find as jest.Mock).mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      const response = await route.GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("Server error");
    });
  });

  describe("POST /api/ShoppingList - Create shopping list", () => {
    it("should create a new shopping list (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const requestBody = createListRequestBody();
      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const mockSavedList = {
        ...MOCK_SHOPPING_LIST,
        title: requestBody.title,
        items: requestBody.items,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (ShoppingList as any).mockImplementation(() => mockSavedList);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.shoppingList).toBeDefined();
      expect(data.shoppingList.title).toBe(requestBody.title);
      expect(mockSavedList.save).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated (ALTERNATIVE)", async () => {
      // Arrange
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(null);
      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify(createListRequestBody()),
      });

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 400 if title is missing (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      });

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Title is required");
    });

    it("should return 400 if title is empty string (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify({ title: "   " }),
      });

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Title is required");
    });

    it("should return 400 if title is not a string (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify({ title: 123 }),
      });

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Title is required");
    });

    it("should create shopping list with valid items (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const requestBody = createListRequestBody({
        items: [
          { name: "Item 1", quantity: 5 },
          { name: "Item 2", purchased: true },
        ],
      });
      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const mockSavedList = {
        ...MOCK_SHOPPING_LIST,
        title: requestBody.title,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (ShoppingList as any).mockImplementation(() => mockSavedList);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.shoppingList).toBeDefined();
    });

    it("should handle server errors gracefully (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost/api/ShoppingList", {
        method: "POST",
        body: JSON.stringify(createListRequestBody()),
      });

      (ShoppingList as any).mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      const response = await route.POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("Server error");
    });
  });

  describe("GET /api/ShoppingList/[id] - Get single shopping list", () => {
    it("should return shopping list by id for owner (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOne as jest.Mock).mockResolvedValue(MOCK_SHOPPING_LIST);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.GET(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.shoppingList._id.toString()).toBe(MOCK_LIST_ID.toString());
      expect(data.shoppingList.title).toBe("Grocery Shopping");
    });

    it("should return shopping list by id for member (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_OTHER_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOne as jest.Mock).mockResolvedValue(
        MOCK_SHOPPING_LIST_WITH_MEMBERS
      );

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.GET(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.shoppingList._id.toString()).toBe(MOCK_LIST_ID.toString());
    });

    it("should return 401 if user is not authenticated (ALTERNATIVE)", async () => {
      // Arrange
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.GET(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 400 if id is invalid (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockParams = {
        params: Promise.resolve({ id: MOCK_INVALID_ID }),
      };

      // Act
      const response = await detailRoute.GET(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Invalid ID");
      expect(ShoppingList.findOne).not.toHaveBeenCalled();
    });

    it("should return 404 if list not found (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOne as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.GET(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe("Shopping list not found");
    });

    it("should return 500 on server error (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOne as jest.Mock).mockImplementation(() => {
        throw new Error("Database error");
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.GET(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("Server error");
    });
  });

  describe("PATCH /api/ShoppingList/[id] - Update shopping list", () => {
    it("should update shopping list title (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const updateBody = { title: "Updated Title" };
      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(updateBody),
      });

      const updatedList = { ...MOCK_SHOPPING_LIST, title: "Updated Title" };
      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedList
      );

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.shoppingList.title).toBe("Updated Title");
      expect(ShoppingList.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should update shopping list status (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const updateBody = { status: "completed" };
      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(updateBody),
      });

      const updatedList = { ...MOCK_SHOPPING_LIST, status: "completed" };
      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedList
      );

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.shoppingList.status).toBe("completed");
    });

    it("should return 401 if user is not authenticated (ALTERNATIVE)", async () => {
      // Arrange
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(null);

      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 400 if id is invalid (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_INVALID_ID }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Invalid ID");
    });

    it("should return 400 if title is empty (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "   " }),
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Title is required");
    });

    it("should return 400 if status is invalid (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "invalid" }),
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Invalid status");
    });

    it("should return 400 if no valid fields to update (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("No valid fields to update");
    });

    it("should return 404 if user is not owner (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_OTHER_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockRequest = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.PATCH(mockRequest, mockParams);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe("Shopping list not found or unauthorized");
    });
  });

  describe("DELETE /api/ShoppingList/[id] - Delete shopping list", () => {
    it("should delete shopping list (HAPPY DAY)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        MOCK_SHOPPING_LIST
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      (User.updateMany as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.DELETE(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Shopping list deleted");
      expect(ShoppingList.findOneAndDelete).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(User.updateMany).toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated (ALTERNATIVE)", async () => {
      // Arrange
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.DELETE(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
      expect(ShoppingList.findOneAndDelete).not.toHaveBeenCalled();
    });

    it("should return 400 if id is invalid (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );

      const mockParams = {
        params: Promise.resolve({ id: MOCK_INVALID_ID }),
      };

      // Act
      const response = await detailRoute.DELETE(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.message).toBe("Invalid ID");
      expect(ShoppingList.findOneAndDelete).not.toHaveBeenCalled();
    });

    it("should return 404 if list not found (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.DELETE(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe("Shopping list not found");
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 404 if user is not owner (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_OTHER_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.DELETE(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.message).toBe("Shopping list not found");
    });

    it("should handle server errors gracefully (ALTERNATIVE)", async () => {
      // Arrange
      const mockAuthUser = { userId: MOCK_USER_ID.toString() };
      (authModule.authenticateUser as jest.Mock).mockResolvedValue(
        mockAuthUser
      );
      (ShoppingList.findOneAndDelete as jest.Mock).mockImplementation(() => {
        throw new Error("Database error");
      });

      const mockParams = {
        params: Promise.resolve({ id: MOCK_LIST_ID.toString() }),
      };

      // Act
      const response = await detailRoute.DELETE(
        new Request("http://localhost"),
        mockParams
      );
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.message).toBe("Server error");
    });
  });
});
