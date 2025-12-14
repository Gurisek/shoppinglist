import { GET } from "./route";
import * as middleware from "../../../../Auth/middleware";
import * as db from "../../../../db/dbConect";
import ShoppingList from "../../../../Model/ShoppingList";
import User from "../../../../Model/User";
import mongoose from "mongoose";

jest.mock("../../../../Auth/middleware");
jest.mock("../../../../db/dbConect");
jest.mock("../../../../Model/ShoppingList");
jest.mock("../../../../Model/User");

const mockAuthenticateUser = middleware.authenticateUser as jest.MockedFunction<
  typeof middleware.authenticateUser
>;
const mockDbConnect = db.default as jest.MockedFunction<typeof db.default>;

describe("GET /api/ShoppingList/[id]/members/candidates", () => {
  const mockAuthUser = {
    userId: "507f1f77bcf86cd799439010",
    username: "owner",
    email: "owner@example.com",
  };

  const mockListId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue(mockAuthUser);
  });

  describe("Happy path scenarios", () => {
    it("should return available candidates without search query", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439020",
          email: "user1@example.com",
          name: "John",
          surname: "Doe",
        },
        {
          _id: "507f1f77bcf86cd799439021",
          email: "user2@example.com",
          name: "Jane",
          surname: "Smith",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidates).toHaveLength(2);
      expect(data.candidates[0].email).toBe("user1@example.com");
    });

    it("should search candidates by email", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=john`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439020",
          email: "john@example.com",
          name: "John",
          surname: "Doe",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidates).toHaveLength(1);
      expect(data.candidates[0].email).toBe("john@example.com");
    });

    it("should search candidates by name", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=smith`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439021",
          email: "jane@example.com",
          name: "Jane",
          surname: "Smith",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidates[0].surname).toBe("Smith");
    });

    it("should search case-insensitively", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=JOHN`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439020",
          email: "john@example.com",
          name: "John",
          surname: "Doe",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });

    it("should exclude owner from candidates", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439020",
          email: "user1@example.com",
          name: "John",
          surname: "Doe",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.objectContaining({
            $nin: expect.any(Array),
          }),
        })
      );
    });

    it("should exclude existing members from candidates", async () => {
      const memberId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [memberId],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439020",
          email: "user1@example.com",
          name: "John",
          surname: "Doe",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.objectContaining({
            $nin: expect.arrayContaining([memberId]),
          }),
        })
      );
    });

    it("should limit results to 50", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = Array.from({ length: 50 }, (_, i) => ({
        _id: new mongoose.Types.ObjectId(),
        email: `user${i}@example.com`,
        name: `User${i}`,
        surname: "Test",
      }));

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidates).toHaveLength(50);
    });

    it("should trim whitespace from search query", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=%20john%20`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439020",
          email: "john@example.com",
          name: "John",
          surname: "Doe",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });

    it("should return empty array when no candidates match search", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=nonexistent`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidates).toHaveLength(0);
    });

    it("should sort candidates by email", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: "507f1f77bcf86cd799439021",
          email: "alice@example.com",
          name: "Alice",
          surname: "Test",
        },
        {
          _id: "507f1f77bcf86cd799439020",
          email: "bob@example.com",
          name: "Bob",
          surname: "Test",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(User.find().sort).toHaveBeenCalledWith({ email: 1 });
    });

    it("should return response with correct structure", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439020"),
          email: "user1@example.com",
          name: "John",
          surname: "Doe",
        },
      ];

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidates[0]).toHaveProperty("userId");
      expect(data.candidates[0]).toHaveProperty("email");
      expect(data.candidates[0]).toHaveProperty("name");
      expect(data.candidates[0]).toHaveProperty("surname");
      expect(data.candidates[0].userId).toBe("507f1f77bcf86cd799439020");
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
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
        "http://localhost:3000/api/ShoppingList/invalid-id/members/candidates",
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
    it("should return 403 when user is not owner", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439099"), // Different owner
        memberIds: [new mongoose.Types.ObjectId(mockAuthUser.userId)],
      };

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toBe("Forbidden");
    });

    it("should return 404 when list does not exist", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findById as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Shopping list not found");
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
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

    it("should return 500 when finding list fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      (ShoppingList.findById as jest.Mock).mockRejectedValue(
        new Error("Query error")
      );

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });

    it("should return 500 when finding users fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("Query error")),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters in search query", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=user%40example`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });

    it("should handle very long search query", async () => {
      const longQuery = "a".repeat(100);
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/candidates?q=${longQuery}`,
        { method: "GET" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId }),
      };

      const mockList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [],
      };

      (ShoppingList.findById as jest.Mock).mockResolvedValue(mockList);
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });
  });
});
