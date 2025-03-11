module.exports = {
  rootDir: '../',
  testEnvironment: 'node',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chai|sinon)/)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  verbose: true,
  moduleFileExtensions: ['js', 'jsx', 'json', 'node']
};