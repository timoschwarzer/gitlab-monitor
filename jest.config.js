module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  'testMatch': [
    '<rootDir>/src/**/*.spec.js',
    '<rootDir>/src/**/*.spec.pact.js',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.pact.ts',
  ],
  'verbose': true,
}
