module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'svelte'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s'],
  moduleNameMapper: {
    '^\$lib/(.*)$': '<rootDir>/src/lib/$1',
    '^\$lib$': '<rootDir>/src/lib',
    '^\$app/(.*)$': '<rootDir>/.svelte-kit/dev/runtime/app/$1',
  },
}; 