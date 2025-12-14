// jest.setup.js
import '@testing-library/jest-dom';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.NODE_ENV = 'test';
