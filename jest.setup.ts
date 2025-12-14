import "@testing-library/jest-dom";

// Set environment variables for testing
process.env.MONGODB_URI = "mongodb://test:test@localhost:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

// Mock mongoose to avoid ESM issues
jest.mock("mongoose", () => {
  class MockObjectId {
    value: string;
    constructor(val: any) {
      this.value = typeof val === "string" ? val : String(val);
    }
    toString() {
      return this.value;
    }
    toJSON() {
      return this.value;
    }
  }

  // Create the constructor function and add static methods
  const mockObjectId = MockObjectId as any;

  // Check if it's a valid MongoDB ObjectId format
  mockObjectId.isValid = jest.fn((id: any) => {
    const idStr = typeof id === "string" ? id : String(id);
    // Valid MongoDB ObjectIds are 24-character hex strings
    return /^[0-9a-f]{24}$/i.test(idStr);
  });

  const mockSchema = jest.fn();
  mockSchema.Types = {
    ObjectId: mockObjectId,
  };

  return {
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
    },
    Schema: mockSchema,
    Types: {
      ObjectId: mockObjectId,
    },
    models: {},
    Document: class {},
    model: jest.fn(),
  };
});

// Mock the database models with all necessary methods
const createMockModel = () => {
  const mockFn = jest.fn();
  mockFn.find = jest.fn();
  mockFn.findOne = jest.fn();
  mockFn.findOneAndUpdate = jest.fn();
  mockFn.findOneAndDelete = jest.fn();
  mockFn.create = jest.fn();
  mockFn.save = jest.fn();

  // When called as constructor, return object with save method
  mockFn.mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: data._id || "mock-id",
    }),
  }));

  return mockFn;
};

jest.mock("./app/api/Model/ShoppingList", () => ({
  __esModule: true,
  default: createMockModel(),
}));

const createUserMockModel = () => {
  const mockFn = jest.fn();
  mockFn.findById = jest.fn();
  mockFn.findByIdAndUpdate = jest.fn();
  mockFn.findByIdAndDelete = jest.fn();
  mockFn.findOne = jest.fn();
  mockFn.create = jest.fn();
  mockFn.updateMany = jest.fn();
  return mockFn;
};

jest.mock("./app/api/Model/User", () => ({
  __esModule: true,
  default: createUserMockModel(),
}));
