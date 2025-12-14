import { GET, POST } from "./route";
import * as middleware from "../Auth/middleware";
import * as db from "../db/dbConect";
import ShoppingList from "../Model/ShoppingList";
import User from "../Model/User";
import mongoose from "mongoose";

jest.mock("../Auth/middleware");
jest.mock("../db/dbConect");
jest.mock("../Model/ShoppingList");
jest.mock("../Model/User");

const mockAuthenticateUser = middleware.authenticateUser as jest.MockedFunction<
  typeof middleware.authenticateUser
>;
const mockDbConnect = db.default as jest.MockedFunction<typeof db.default>;

describe("GET /api/ShoppingList", () => {
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
  });

  describe("Happy path scenarios", () => {
    it("should return all lists where user is owner", async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthUser);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      const mockLists = [
        {
          _id: mockListId,
          title: "Grocery Store",
          ownerId: { _id: mockAuthUser.userId, email: mockAuthUser.email },
          memberIds: [],
          items: [],
          status: "active",
          createdAt: new Date(),
        },
      ];

      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLists),
        }),
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingLists).toHaveLength(1);
      expect(data.shoppingLists[0].title).toBe("Grocery Store");
    });

    it("should return lists where user is member", async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthUser);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      const mockLists = [
        {
          _id: mockListId,
          title: "Family Shopping",
          ownerId: { _id: mockOwnerId, email: "owner@example.com" },
          memberIds: [{ _id: mockAuthUser.userId }],
          items: [],
          status: "active",
          createdAt: new Date(),
        },
      ];

      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLists),
        }),
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingLists).toHaveLength(1);
    });

    it("should return multiple lists sorted by creation date", async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthUser);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      const mockLists = [
        {
          _id: mockListId,
          title: "Recent List",
          ownerId: { _id: mockAuthUser.userId, email: mockAuthUser.email },
          memberIds: [],
          items: [],
          status: "active",
          createdAt: new Date("2025-12-14"),
        },
        {
          _id: "507f1f77bcf86cd799439013",
          title: "Old List",
          ownerId: { _id: mockAuthUser.userId, email: mockAuthUser.email },
          memberIds: [],
          items: [],
          status: "active",
          createdAt: new Date("2025-12-01"),
        },
      ];

      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockLists),
        }),
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingLists).toHaveLength(2);
    });

    it("should return empty array when user has no lists", async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthUser);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.shoppingLists).toHaveLength(0);
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      const response = await GET(mockRequest);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthUser);
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Server error");
    });

    it("should return 500 when query fails", async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthUser);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "GET",
        }
      );

      (ShoppingList.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Query error")),
        }),
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
    });
  });
});

describe("POST /api/ShoppingList", () => {
  const mockAuthUser = {
    userId: "507f1f77bcf86cd799439011",
    username: "testuser",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue(mockAuthUser);
  });

  describe("Happy path scenarios", () => {
    it("should create a new shopping list with title only", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "Grocery Shopping" }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "Grocery Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.shoppingList.title).toBe("Grocery Shopping");
      expect(data.shoppingList.memberIds).toEqual([]);
    });

    it("should create a list with items", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Grocery Shopping",
            items: [
              { name: "Milk", quantity: 2, purchased: false },
              { name: "Bread", quantity: 1, purchased: false },
            ],
          }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "Grocery Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [
          { name: "Milk", quantity: 2, purchased: false },
          { name: "Bread", quantity: 1, purchased: false },
        ],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.shoppingList.items).toHaveLength(2);
    });

    it("should trim title whitespace", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "  Grocery Shopping  " }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "Grocery Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
    });

    it("should filter out invalid items and set defaults", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Shopping",
            items: [
              { name: "Milk", quantity: 2 },
              { name: "", quantity: 1 }, // Invalid - empty name
              { name: "Bread" }, // No quantity - should default to 1
              { name: "Eggs", quantity: 0 }, // Invalid quantity - should default to 1
              { name: "Butter", quantity: 3.7 }, // Should floor to 3
            ],
          }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [
          { name: "Milk", quantity: 2, purchased: false },
          { name: "Bread", quantity: 1, purchased: false },
          { name: "Eggs", quantity: 1, purchased: false },
          { name: "Butter", quantity: 3, purchased: false },
        ],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.shoppingList.items.length).toBeLessThanOrEqual(4);
    });

    it("should add list to user ownedLists", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "New List" }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "New List",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockAuthUser.userId,
        expect.any(Object)
      );
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "New List" }),
        }
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });
  });

  describe("Validation error scenarios", () => {
    it("should return 400 when title is missing", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ items: [] }),
        }
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Title is required");
    });

    it("should return 400 when title is empty string", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "   " }),
        }
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Title is required");
    });

    it("should return 400 when title is not a string", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: 123 }),
        }
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Title is required");
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "New List" }),
        }
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Server error");
    });

    it("should return 500 when save fails", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "New List" }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "New List",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
        save: jest.fn().mockRejectedValue(new Error("Save failed")),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });

    it("should return 500 when updating user fails", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({ title: "New List" }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "New List",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle items with undefined properties", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Shopping",
            items: [{ name: "Milk" }, { name: "Bread", quantity: undefined }],
          }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [
          { name: "Milk", quantity: 1, purchased: false },
          { name: "Bread", quantity: 1, purchased: false },
        ],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
    });

    it("should handle non-array items gracefully", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Shopping",
            items: "not an array",
          }),
        }
      );

      const mockNewList = {
        _id: "507f1f77bcf86cd799439012",
        title: "Shopping",
        ownerId: mockAuthUser.userId,
        memberIds: [],
        items: [],
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      (ShoppingList as unknown as jest.Mock).mockImplementation(
        () => mockNewList
      );
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
    });
  });
});
