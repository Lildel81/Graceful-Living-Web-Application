/**
 * Jest configuration file
 * 
 * This file configures how Jest behaves when running tests.
 * It can be seen as "settings" for test runner.
 */
module.exports = {
    // ================ Test environment =================
    // - node: for server-side code
    testEnvironment: 'node',

    // ================ Test file patterns =================
    // Tell Jest where to find test files
    testMatch: [
        '**/__tests__/**/*.test.js',    // Files in __test__ folders ending in .test.js
        '**/?(*.)+(spec|test).js'       // Any .spec.js or .test.js files
    ],

    // ================ Code coverage =================
    // Coverage measures how much of the code is tested
    // - Lines: % of lines executed by tests
    // - Functions: % of functions called by tests
    // - Branches: % of branches (if/else) executed by tests
    // - Statements: % of statements executed by tests
    collectCoverage: false, // Set to true to enable coverage collection
    coverageDirectory: 'coverage', // Output folder for coverage reports
    // Different formats for coverage reports:
    // - text: summary in console (terminal)
    // - lcov: for CI/CD tools and coverage viewers
    // - html: human-readable report in browser
    coverageReporters: ['text', 'lcov', 'html'], // Formats for coverage reports

    // ================ Coverage scope =================
    // Specify which files to include/exclude for coverage
    // Only include source files, exclude tests and config files
    collectCoverageFrom: [
        'controllers/carouselController.js',    // Include carousel controller
        'routes/carouselRoutes.js',             // Include carousel routes
        'models/carouselSlide.js',              // Include carousel slide model
        'public/js/carousel.js',                // Include carousel frontend script
        'public/js/editslide.js',               // Include edit slide frontend script

        '!**/node_modules/**',                  // Exclude dependencies
        '!**/__tests__/**',                     // Exclude test files
        '!**/jest.config.js',                   // Exclude this config file
        '!**/jest.setup.js',                    // Exclude setup files
        '!**/coverage/**'                       // Exclude coverage output
    ],

    // ================ Coverage thresholds =================
    // Should start with low thresholds and increase over time
    // - Starting: 60-70-70-70
    // - Step 2: 75-80-80-80
    // - Final: 85-90-90-90
    // If coverage is below these thresholds, tests will fail
    coverageThreshold: {
        global: {               // Apply to all files
            branches: 60,       // 60% of if/else paths must be tested
            functions: 70,      // 70% of functions must be called in tests
            lines: 70,          // 70% of lines must be executed by tests
            statements: 70      // 70% of statements must be executed by tests
        }
    },

    // ================ Setup files =================
    // Files to run before tests to set up environment
    // Useful for global variables or configurations, test utilities
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // ================ Module path =================
    // Where to look for modules when using import/require
    // '<rootDir>' is the root folder of the project
    modulePaths: ['<rootDir>'],

    // ================ Transform configuration =================
    // Jest can transform code before running tests
    // Useful for using modern JavaScript features not supported by Node.js
    transform: {},

    // ================ Mock management =================

    // ------------Mock cleanup------------
    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // ------------Mock restore------------
    // Automatically restore mock state and implementation between every test
    restoreMocks: true,

    // ================ Output configuration - Verbose output =================
    // Show individual test results with the test suite hierarchy
    // - Test names
    // - Pass/fail status
    // - Execution time
    // - Coverage summary
    verbose: true,

    // ================ Test timeouts =================
    // Default timeout for tests in milliseconds
    // Increase if tests involve long operations (e.g., network requests, file I/O)
    testTimeout: 10000, // 10 seconds

    // ====================== Global variables ===========================
    // Define global variables available in all test environments
    globals: {
        'process.env.NODE_ENV': 'test' // Set Node environment to 'test'
    }

};