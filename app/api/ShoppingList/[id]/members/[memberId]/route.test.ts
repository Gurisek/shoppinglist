import { DELETE } from "./route";
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

describe("DELETE /api/ShoppingList/[id]/members/[memberId]", () => {
  const mockAuthUser = {
    userId: "507f1f77bcf86cd799439010",
    username: "owner",
    email: "owner@example.com",
  };

  const mockListId = "507f1f77bcf86cd799439012";
  const mockMemberId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue(mockAuthUser);
  });

  describe("Happy path scenarios", () => {
    it("should successfully remove member from shopping list", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [
          new mongoose.Types.ObjectId(mockMemberId),
          new mongoose.Types.ObjectId("507f1f77bcf86cd799439099"),
        ],
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Member removed successfully");
    });

    it("should remove member from both ShoppingList and User", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [new mongoose.Types.ObjectId(mockMemberId)],
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      expect(ShoppingList.findByIdAndUpdate).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMemberId,
        expect.any(Object)
      );
    });

    it("should work when removing one of multiple members", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const memberIds = [
        new mongoose.Types.ObjectId(mockMemberId),
        new mongoose.Types.ObjectId("507f1f77bcf86cd799439099"),
        new mongoose.Types.ObjectId("507f1f77bcf86cd799439088"),
      ];

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds,
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Member removed successfully");
    });
  });

  describe("Authentication error scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthenticateUser.mockResolvedValue(null);

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
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
        `http://localhost:3000/api/ShoppingList/invalid-id/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: "invalid-id", memberId: mockMemberId }),
      };

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid ID");
    });

    it("should return 400 for invalid member ID", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/invalid-id`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: "invalid-id" }),
      };

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid ID");
    });

    it("should return 400 when both IDs are invalid", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/ShoppingList/invalid-id/members/invalid-id",
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: "invalid-id", memberId: "invalid-id" }),
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
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Shopping list not found or unauthorized");
    });

    it("should return 404 when list does not exist", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(404);
    });

    it("should return 400 when user is not a member", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [new mongoose.Types.ObjectId("507f1f77bcf86cd799439099")],
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("User is not a member of this list");
    });
  });

  describe("Server error scenarios", () => {
    it("should return 500 when database connection fails", async () => {
      mockDbConnect.mockRejectedValue(new Error("DB connection failed"));

      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Server error");
    });

    it("should return 500 when finding list fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      (ShoppingList.findOne as jest.Mock).mockRejectedValue(
        new Error("Query error")
      );

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });

    it("should return 500 when removing from ShoppingList fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [new mongoose.Types.ObjectId(mockMemberId)],
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });

    it("should return 500 when updating User fails", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [new mongoose.Types.ObjectId(mockMemberId)],
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Update failed")
      );

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(500);
    });
  });

  describe("Edge cases", () => {
    it("should correctly compare ObjectIds with equals()", async () => {
      const memberId = new mongoose.Types.ObjectId();
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${memberId.toString()}`,
        { method: "DELETE" }
      );

      const mockParams = {
        params: Promise.resolve({
          id: mockListId,
          memberId: memberId.toString(),
        }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds: [memberId],
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });

    it("should handle removal when many members exist", async () => {
      const mockRequest = new Request(
        `http://localhost:3000/api/ShoppingList/${mockListId}/members/${mockMemberId}`,
        { method: "DELETE" }
      );

      const memberIds = Array.from(
        { length: 10 },
        (_, i) => new mongoose.Types.ObjectId(`507f1f77bcf86cd7994390${i}`)
      );

      const mockParams = {
        params: Promise.resolve({ id: mockListId, memberId: mockMemberId }),
      };

      const mockShoppingList = {
        _id: mockListId,
        ownerId: new mongoose.Types.ObjectId(mockAuthUser.userId),
        memberIds,
      };

      (ShoppingList.findOne as jest.Mock).mockResolvedValue(mockShoppingList);
      (ShoppingList.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await DELETE(mockRequest, mockParams as any);

      expect(response.status).toBe(200);
    });
  });
});
