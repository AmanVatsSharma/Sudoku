/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/legacy/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/*.d.ts'],
  modulePathIgnorePatterns: ['<rootDir>/legacy/'],
};
