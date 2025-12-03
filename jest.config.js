module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx", "json"],
  moduleNameMapper: {
    "^modules/(.*)$": "<rootDir>/modules/$1",
    "^src/(.*)$": "<rootDir>/src/$1"
  },
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  }
};
