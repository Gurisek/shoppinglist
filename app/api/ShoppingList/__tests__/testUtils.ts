import { Types } from "mongoose";

// Mock JWT token
export const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWE1YzM5ZjEyMzQ1NmI3ODljZGVmMDEiLCJpYXQiOjE3MDU0MjU2MDB9.mock";

// Mock User IDs
export const MOCK_USER_ID = new Types.ObjectId("65a5c39f123456b789cdef01");
export const MOCK_OTHER_USER_ID = new Types.ObjectId(
  "65a5c39f123456b789cdef02"
);

// Mock ShoppingList ID
export const MOCK_LIST_ID = new Types.ObjectId("65a5c39f123456b789cdef03");
export const MOCK_INVALID_ID = "invalid-id";

// Mock shopping list data
export const MOCK_SHOPPING_LIST = {
  _id: MOCK_LIST_ID,
  title: "Grocery Shopping",
  ownerId: MOCK_USER_ID,
  memberIds: [],
  items: [
    { name: "Milk", quantity: 2, purchased: false },
    { name: "Bread", quantity: 1, purchased: true },
  ],
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_SHOPPING_LIST_WITH_MEMBERS = {
  ...MOCK_SHOPPING_LIST,
  memberIds: [MOCK_OTHER_USER_ID],
};

// Helper to create headers with auth token
export function createAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MOCK_TOKEN}`,
  };
}

// Helper to create request body for creating a shopping list
export function createListRequestBody(overrides = {}) {
  return {
    title: "Test Shopping List",
    items: [
      { name: "Apple", quantity: 5, purchased: false },
      { name: "Banana", quantity: 3, purchased: false },
    ],
    ...overrides,
  };
}

// Helper to create request body for updating a shopping list
export function updateListRequestBody(overrides = {}) {
  return {
    title: "Updated Shopping List",
    status: "completed",
    ...overrides,
  };
}
