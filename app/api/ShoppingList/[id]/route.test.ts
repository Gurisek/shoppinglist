import { GET, PATCH, DELETE } from "./route";
import * as middleware from "../../Auth/middleware";
import * as db from "../../db/dbConect";
import ShoppingList from "../../Model/ShoppingList";
import User from "../../Model/User";
import mongoose from "mongoose";

jest.mock("../../Auth/middleware");
jest.mock("../../db/dbConect");
jest.mock("../../Model/ShoppingList");
jest.mock("../../Model/User");

const mockAuthenticateUser = middleware.authenticateUser as jest.MockedFunction<
  typeof middleware.authenticateUser
>;
const mockDbConnect = db.default as jest.MockedFunction<typeof db.default>;

describe("GET /api/ShoppingList/[id]", () => {
  const mockAuthUser = {
    userId: "507f1f77bcf86cd799439011",
    username: "testuser",
    email: "test@example.com",
  };

  const mockListId = "507f1f77bcf86cd799439012";
  const mockOwnerId = "507f1f77bcf86cd799439010";

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue(mockAuthUser);
  });

  describe("Happy path scenarios", () => {
    it("should return shopping list for owner", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        title: "Grocery Store",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [{ name: "Milk", quantity: 2, purchased: false }],
        status: "active",
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingList.title).toBe("Grocery Store");
      expect(data.shoppingList.items).toHaveLength(1);
    });

    it("should return shopping list for member", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        title: "Family Shopping",
        ownerId: mockOwnerId,
        memberIds: [mockAuthUser.userId],
        items: [],
        status: "active",
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingList.title).toBe("Family Shopping");
    });

    it("should return list with items", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [
          { name: "Milk", quantity: 2, purchased: true },
          { name: "Bread", quantity: 1, purchased: false },
          { name: "Eggs", quantity: 12, purchased: false },
        ],
        status: "active",
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingList.items).toHaveLength(3);
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });
  });

  describe("Validation error scenarios", () => {
    it("should return 400 for invalid list ID", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList/invalid-id",
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: "invalid-id" }),
      };

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid ID");
    });
  });

  describe("Authorization error scenarios", () => {
    it("should return 404 when user is not owner or member", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Shopping list not found");
    });

    it("should return 404 when list does not exist", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Server error");
    });

    it("should return 500 when query fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOne as jest.Mock).mockRejectedValue(
        new Error("Query error")
      );

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });
  });
});

describe("PATCH /api/ShoppingList/[id]", () => {
  const mockAuthUser = {
    userId: "507f1f77bcf86cd799439011",
    username: "testuser",
    email: "test@example.com",
  };

  const mockListId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue(mockAuthUser);
  });

  describe("Happy path scenarios", () => {
    it("should update list title", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "Updated Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockUpdatedList = {
        _id: mockListId,
        title: "Updated Title",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedList
      );

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingList.title).toBe("Updated Title");
    });

    it("should update list status", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "completed" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockUpdatedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "completed",
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedList
      );

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingList.status).toBe("completed");
    });

    it("should update both title and status", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title", status: "archived" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockUpdatedList = {
        _id: mockListId,
        title: "New Title",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "archived",
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedList
      );

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingList.title).toBe("New Title");
      expect(data.shoppingList.status).toBe("archived");
    });

    it("should trim title whitespace", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "  New Title  " }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockUpdatedList = {
        _id: mockListId,
        title: "New Title",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedList
      );

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });
  });

  describe("Validation error scenarios", () => {
    it("should return 400 for invalid list ID", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList/invalid-id",
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: "invalid-id" }),
      };

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid ID");
    });

    it("should return 400 when title is empty string", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "   " }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Title is required");
    });

    it("should return 400 for invalid status", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "invalid-status" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid status");
    });

    it("should return 400 when no valid fields provided", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ invalidField: "value" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("No valid fields to update");
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["active", "completed", "archived"];

      for (const status of validStatuses) {
        const mockRequest = new Request(
          `http://localhost:3000/api/ShoppingList/${mockListId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          }
        );

        const mockParams = {
          params: Promise.resolve({ id: mockListId }),
        };

        const mockUpdatedList = {
          _id: mockListId,
          title: "Shopping",
          ownerId: mockAuthUser.userId,
          memberIds: [],
          items: [],
          status,
        };

        (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(
          mockUpdatedList
        );

        const response = await PATCH(mockRequest, mockParams as any);

        expect(response.status).toBe(200);
      }
    });
  });

  describe("Authorization error scenarios", () => {
    it("should return 404 when user is not owner", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Shopping list not found or unauthorized");
    });

    it("should return 404 when list does not exist", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Server error");
    });

    it("should return 500 when update fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Title" }),
        }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOneAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await PATCH(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });
  });
});

describe("DELETE /api/ShoppingList/[id]", () => {
  const mockAuthUser = {
    userId: "507f1f77bcf86cd799439011",
    username: "testuser",
    email: "test@example.com",
  };

  const mockListId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue(mockAuthUser);
  });

  describe("Happy path scenarios", () => {
    it("should delete shopping list", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockDeletedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Shopping list deleted");
    });

    it("should remove list from owner ownedLists", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockDeletedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: ["507f1f77bcf86cd799439088"],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        { new: true }
      );
    });

    it("should remove list from all members memberOf", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockDeletedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: ["507f1f77bcf86cd799439088", "507f1f77bcf86cd799439089"],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(User.updateMany).toHaveBeenCalled();
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });
  });

  describe("Validation error scenarios", () => {
    it("should return 400 for invalid list ID", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList/invalid-id",
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: "invalid-id" }),
      };

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid ID");
    });
  });

  describe("Authorization error scenarios", () => {
    it("should return 404 when user is not owner", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Shopping list not found");
    });

    it("should return 404 when list does not exist", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Server error");
    });

    it("should return 500 when deletion fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockRejectedValue(
        new Error("Delete failed")
      );

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });

    it("should return 500 when updating owner fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockDeletedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedList
      );
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });

    it("should return 500 when updating members fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockDeletedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: ["507f1f77bcf86cd799439088"],
        items: [],
        status: "active",
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.updateMany as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle list with multiple members", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const memberIds = [
        "507f1f77bcf86cd799439088",
        "507f1f77bcf86cd799439089",
        "507f1f77bcf86cd799439090",
      ];

      const mockDeletedList = {
        _id: mockListId,
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds,
        items: [
          { name: "Item1", quantity: 1, purchased: true },
          { name: "Item2", quantity: 5, purchased: false },
        ],
        status: "active",
      };

      (ShoppingList.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 3 });

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(User.updateMany).toHaveBeenCalled();
    });
  });
});
