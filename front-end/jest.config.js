const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/tests/e2e/',
        '/playwright-report/',
        '/test-results/',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
}

module.exports = createJestConfig(customJestConfig)
