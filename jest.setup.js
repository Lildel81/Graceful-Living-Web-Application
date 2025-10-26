/**
 * Jest setup file
 * This file is used to configure or set up the testing framework before each test.
 * This file is executed before running the test suites.
 * 
 * When it runs:
 * - before all test suites
 * - once per test run
 * - before beforeEach/afterEach hooks
 */
// =================================
// Environment variables setup
// =================================
// These environment variable ensure tests run in the correct environment
process.env.NODE_ENV = 'test';

// SESSION_SECRET for testing
// Sessions need a secret key to work, even in tests
process.env.SESSION_SECRET = 'test-secret';

// =================================
// Console output control
// =================================
// During tests, we can keep all original console outputs
// Or we can supress them to keep the test output clean
global.console = {
    ...console, // Keep original console methods

    // If we want to suppress console output during tests, uncomment the lines below
    // log: jest.fn(),      // Suppress console.log
    // debug: jest.fn(),    // Suppress console.debug
    // info: jest.fn(),     // Suppress console.info
    // warn: jest.fn(),     // Suppress console.warn
    // error: jest.fn(),    // Suppress console.error
};

// =================================
// Global test utilities
// =================================

// These utilities are available in all test files without needing to import them
global.testUtils = {
    // Mock request object: creates a mock request for testing purposes
    createMockRequest: (overrides = {}) => ({
        body:{},        // Form data (req.body)
        params:{},      // URL parameters (req.params.id)
        query:{},       // Query string parameters (req.query.search)
        file: null,     // Single file upload (from multer)
        files: null,    // Multiple file uploads (from multer)
        session: {},    // Session data (req.session.user)
        ...overrides,   // Override default properties
    }),

    // Mock response object: creates a mock response for testing purposes
    createMockResponse: () => {
        const res = {};
        // Mock methods for chaining
        res.status = jest.fn().mockReturnValue(res);    // res.status(200)
        res.json = jest.fn().mockReturnValue(res);      // res.json({data})
        res.render = jest.fn().mockReturnValue(res);    // res.render('view', data)
        res.redirect = jest.fn().mockReturnValue(res);  // res.redirect('/path')
        res.send = jest.fn().mockReturnValue(res);      // res.send('text')

        return res;
    },

    // Mock next function: creates a mock next function for middleware testing
    createMockNext: () => jest.fn(),

    // Test data generator: generates sample data for tests
    // - Generate test slides: creates a mock carousel slide object with sensible defaults
    generateTestSlide: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Slide',
        description: 'This is a test slide description.',
        buttonText: 'Test Button',
        buttonUrl: 'https://test.com',
        imageUrl: '/images/uploads/test-slide.jpg',
        createAt: new Date('2025-10-23'),
        ...overrides // Override any fields as needed
    })

};

//==================================
// Test timeout configuration
//==================================
// Set a default timeout for tests (in milliseconds)
// This can be adjusted based on the expected duration of tests
jest.setTimeout(10000); // 10 seconds



