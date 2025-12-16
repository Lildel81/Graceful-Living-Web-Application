/**
 * Unit tests for CRUD operations in carouselController.js
 * - Test individual functions for creating, reading, updating, and deleting carousel items.
 */

const path = require('path');
// const fs = require('fs');
const { diskStorage, memoryStorage } = require('multer');

// ================ Mocking setup ==================
// Mocking replaces real dependencies with fake versions for isolated testing.

// Mock the file system module to avoid actual file operations
jest.mock('fs');

// Mock the path module if needed (not strictly necessary here)
jest.mock('path');

// Mock multer for file uploads
jest.mock('multer', () => ({
    diskStorage: jest.fn(),
    memoryStorage: jest.fn(),
}));

// Mock request module for simulating HTTP requests
const request = require('supertest');
// Mock Express for creating test servers
const express = require('express');
const { create } = require('../../models/resourcesImage');
const { createSecureContext } = require('tls');
const csurf = require('csurf');

// ================ Test suite for carousel controller operations ==================
describe('Carousel Controller CRUD Operations', () => {
    // -------------- Test variables ----------------
    // These variables are shared across tests in this suite
    let app, controller, CarouselSlide, fs;
    let mockSlides = [];
    let mockFind;

    // -------------- Factory pattern in testing ----------------
    // A factory function creates test data with sensible defaults
    const createTestSlide = (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439011',    // Valid MongoDB objectId format
        title: 'Test Slide',
        description: 'Test description',
        buttonText: 'Learn More',
        buttonUrl: 'https:/example.com',
        imageUrl: '/var/data/test.jpg',
        createdAt: new Date('2025-10-24'),
        ...overrides                        // Spread operator allows overriding any default value
    });

    // --------------- Test application setup --------------------
    // This creates a minimal Express app for testing
    // This sets up middleware to simulate a real app environment
    const makeApp = (opts = {})  => {
        const app = express();

        // Parse URL-encoded form data
        app.use(express.urlencoded({ extended: true}));

        // Parse JSON request bodies
        app.use(express.json());

        // ------- Session mocking ----------
        // Real apps use express-session, but in tests we mock it
        // This simulates a logged-in admin user for testing protected routes
        app.use((req, res, next) => {
            req.session = {
                user: { isAdmin: true},
                ...opts.session         // Allow customization per test
            };
            next();
        });

        // ------------- Mock render and redirect ---------------
        // Controllers normally use res.render() and res.redirect()
        // In test, we convert these to JSON responses for easy assertions
        app.use((req, res, next) => {
            // Save reference to original status method
            const origStatus = res.status.bind(res);
            // Override status to track the status code
            res.status = (code) => (res.__status = code, origStatus(code));
            // Override render to return JSON instead of html
            res.render = (view, data = {}) => {
                const code = res.__status || 200;
                return res.status(code).json({view, ...data});
            };
            // Override redirect to return JSON instead of redirecting
            res.redirect = (url) => {
                return res.status(302).json({redirect: url});
            };

            next();
        });

        return app;
    };

    // ===================== Before each test setup ==========================
    // Set up a clean, consistent state for every test
    beforeEach(() => {
        // Reset all mock function calls and instances
        // Prevent tests affecting each other
        jest.clearAllMocks();

        // Clear Node.js module cache to ensure fresh module import
        // Mock module can get cached
        jest.resetModules();

        // Mock the file system operation
        fs = require('fs');

        // Ensure fs.promises exists
        if (!fs.promises){
            fs.promises = {
                unlink: jest.fn().mockResolvedValue()  // Create mock function that resolve successfully
            };
        }
        // fs.promises exists but not unlink => add it
        else if (!fs.promises.unlink){
            fs.promises.unlink = jest.fn().mockResolvedValue();
        }

        // Mock fs.existsSync() - to check if directories exist
        if(!fs.existsSync){
            fs.existsSync = jest.fn();
        }
        // Simulate directories always exist
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);

        // Mock fs.mkdirSync() - to create directories
        if(!fs.mkdirSync){
            fs.mkdirSync = jest.fn();
        }
        // Let it do nothing to prevent real directory created during test
        jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

        // Reload modules to ensure clean state
        // Prevent cached module state from previous tests
        // ******** This happens after setting up fs.promises ********
        controller = require(path.join('..', '..', 'controllers', 'carouselController'));
        CarouselSlide = require(path.join('..', '..', 'models', 'carouselSlide'));

        // Mongoose method mocking
        mockFind = {
            sort: jest.fn().mockResolvedValue(mockSlides)
        };

        // Mock each Mongoose method with default behavior

        // Mock CarouselSlide.find() - use to get all slides (getCarouselManagement)
        jest.spyOn(CarouselSlide, 'find').mockReturnValue(mockFind);    

        // Mock CarouselSlide.findById() - used to get a single slide by ID
        jest.spyOn(CarouselSlide, 'findById').mockResolvedValue(null);                          // Simulate "slide not found"

        // Mock CarouselSlide.create() - used to create new slide (createSlide)
        jest.spyOn(CarouselSlide, 'create').mockResolvedValue(createTestSlide());               // Simulate "successful creation"

        // Mock CarouselSlide.findByIdAndUpdate() - used to update existing slide (editSlide)
        jest.spyOn(CarouselSlide, 'findByIdAndUpdate').mockResolvedValue(createTestSlide());    // Simulate "successful update"

        // Mock CarouselSlide.findByIdAndDelete() - used to delete slide (deleteSlide)
        jest.spyOn(CarouselSlide, 'findByIdAndDelete').mockResolvedValue(createTestSlide());    // Simulate "successful deletion"

        // Create a fresh Express app for each test
        app = makeApp();
    });

    // ==================== After each test cleanup =============================

    afterEach(() => {
        // Reset all jest.spyOn() back to original implementation so mock dont leak bwtn tests
        jest.restoreAllMocks();
    });

    // ========================== CREATE operation tests ========================
    // Test Create, Read, Update, and Delete

    describe('CREATE Operations - createSlide', () => {
        test('should create slide with uploaded image successfully', async() => {
            // Set up test data - Arrange
            const slideData = {
                title: 'New Slide',
                description: 'New Description',
                buttonText: 'Click Here',
                buttonUrl: 'https://example.com',
                imageOption: 'upload'               // User chose to upload a file
            };

            // Mocking multer file object
            // When multer processes a file upload, it creates a file object
            const mockFile = {
                filename: 'test-image.jpg',         // Name saved on server
                originalname: 'test.jpg',           // Original filename from user
                mimetype: 'image/jpeg',             // File type
                size: 1024                          // File size in bytes
            };

            // Mock request object
            // Controllers receive req and res objects
            // Create minimal mock req
            const mockReq = {
                csrfToken: () => 'dummyCsrf',
                body: slideData,    // From data
                file: mockFile      // Uploaded file from multer
            };

            // Execute the function being tested - Act
            // Call the actual controller function with our mock data
            await controller.createSlide(mockReq, { redirect: jest.fn()});

            // Verify the results - Assert
            expect(CarouselSlide.create).toHaveBeenCalledWith({
                title: 'New Slide',
                description: 'New Description',
                buttonText: 'Click Here',
                buttonUrl: 'https://example.com',
                imageUrl: '/var/data/test-image.jpg'  // Controller should format the path correctly
            });
        });

        test('should use default fallback image when no image provided', async () => {
            // Arrange
            const slideData = {
                title: 'New Slide',
                description: 'New Description',
                buttonText: 'Click Here',
                buttonUrl: 'https://example.com',
                imageOption: 'url'
                // No image provided
            };
            const mockReq = {
                csrfToken: () => 'dummyCsrf',
                body: slideData,
                file: null
            };

            // Act
            await controller.createSlide(mockReq, { redirect: jest.fn()});

            // Assert
            expect(CarouselSlide.create).toHaveBeenCalledWith({
                title: 'New Slide',
                description: 'New Description',
                buttonText: 'Click Here',
                buttonUrl: 'https://example.com',
                imageUrl: 'images/default-fallback.jpg'
            });
        });

        // Test error scenarios
        test('should handle create operation errors', async() => {
            // Set up error condition - Arrange

            // Make the function throw an error - simulate database failures
            CarouselSlide.create.mockRejectedValue(new Error('Database error'));

            const slideData = {
                title: 'New Slide',
                description: 'New Description',
                buttonText: 'Click Here',
                buttonUrl: 'https://example.com',
                imageOption: 'url',
                imageUrl: 'https://external.com/image.jpg'
            };

            const mockReq = {
                csrfToken: () => 'dummyCsrf',
                body: slideData,
                file: null
            };

            const mockRes = {
                redirect: jest.fn()
            };

            // Test error handling - Act and Assert
            // test async function throw an error
            await expect(controller.createSlide(mockReq, mockRes)).rejects.toThrow('Database error');
        });
    });
    // ======================== READ operation tests ===================================
    describe('READ operations', () => {
        describe('getCarouselManagement', () => {
            test('should render carousel management with slides', async() => {
                // Arrange
                const mockSlides = [
                    createTestSlide({ _id: '1', title: 'Slide 1'}),
                    createTestSlide({ _id: '2', title: 'Slide 2'})
                ];

                mockFind.sort.mockResolvedValue(mockSlides);

                const mockReq = {csrfToken: () => 'dummyCsrf'};
                const mockRes = { render: jest.fn()};

                // Act
                await controller.getCarouselManagement(mockReq, mockRes);

                // Assert
                expect(CarouselSlide.find).toHaveBeenCalled();
                expect(mockRes.render).toHaveBeenCalledWith('carouselmanagement', {
                    csrfToken: 'dummyCsrf',
                    slides: mockSlides,
                    layout: false
                });
            });

            test('should handle empty slides array', async () => {
                // Arrange
                mockFind.sort.mockResolvedValue([]);

                const mockReq = {csrfToken: () => 'dummyCsrf'};
                const mockRes = { render: jest.fn()};

                // Act
                await controller.getCarouselManagement(mockReq, mockRes);

                // Assert
                expect(mockRes.render).toHaveBeenCalledWith('carouselmanagement', {
                    csrfToken: 'dummyCsrf',
                    slides: [],
                    layout: false
                });
            });

            test('should handle database errors', async () => {
                // Arrange
                mockFind.sort.mockRejectedValue(new Error('Database error'));

                const mockReq = {};
                const mockRes = { render: jest.fn()};

                // Act and Assert
                await expect(controller.getCarouselManagement(mockReq, mockRes)).rejects.toThrow('Database error');
            });
        });

        describe('getEditSlideView', () => {
            test('should render edit from with slide data', async () => {
                // Arrange
                const mockSlide = createTestSlide();
                CarouselSlide.findById.mockResolvedValue(mockSlide);

                const mockReq = { 
                    csrfToken: () => 'dummyCsrf',
                    params: { id: '507f1f77bcf86cd799439011'}
                };
                const mockRes = { render: jest.fn()};

                // Act
                await controller.getEditSlideView(mockReq, mockRes);

                // Assert
                expect(CarouselSlide.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(mockRes.render).toHaveBeenCalledWith('editslide', {
                    csrfToken: 'dummyCsrf',
                    slide: mockSlide,
                    layout: false
                });
            });
            test('should handle slide not found', async() => {
                // Arrange
                CarouselSlide.findById.mockResolvedValue(null);

                const mockReq = { 
                    csrfToken: () => 'dummyCsrf',
                    params: {id: 'nonexistent'}
                };
                const mockRes = { 
                    render: jest.fn()
                };

                // Act
                await controller.getEditSlideView(mockReq, mockRes);

                // Assert
                expect(mockRes.render).toHaveBeenCalledWith('editslide', {
                    csrfToken: 'dummyCsrf',
                    slide: null,
                    layout: false
                });
            });

        });
    });
    // ====================== UPDATE operation tests ===============================
    describe('UPDATE operations - editSlide', () => {
        test('should update slide keeping current image', async () => {
            // Arrange
            const existingSlide = createTestSlide({
                imageUrl: '/var/data/existing.jpg'
            });

            const updateData = {
                title: 'Updated Title',
                description: 'Updated Description',
                buttonText: 'Updated Button',
                buttonUrl: 'https://updated.com',
                imageOption: 'keep'
            };

            CarouselSlide.findById.mockResolvedValue(existingSlide);

            const mockReq = {
                params: {id: '507f1f77bcf86cd799439011'},
                body: updateData,
                file: null
            };

            const mockRes = {redirect: jest.fn()};

            // Act
            await controller.editSlide(mockReq, mockRes);

            // Assert
            expect(CarouselSlide.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
                title: 'Updated Title',
                description: 'Updated Description',
                buttonText: 'Updated Button',
                buttonUrl: 'https://updated.com',
                imageUrl: '/var/data/existing.jpg'            // Should keep existing image
            });
        });

        test('should update slide with new uploaded image', async() => {
            // Arrange
            const existingSlide = createTestSlide({
                imageUrl: '/var/data/old-image.jpg'
            });

            const updateData = {
                title: 'Updated Title',
                description: 'Updated Description',
                buttonText: 'Updated Button',
                buttonUrl: 'https://updated.com',
                imageOption: 'upload'
            };

            const mockFile = {
                filename: 'new-image.jpg'
            };

            CarouselSlide.findById.mockResolvedValue(existingSlide);

            const mockReq = {
                params: { id: '507f1f77bcf86cd799439011'},
                body: updateData,
                file: mockFile
            };

            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.editSlide(mockReq, mockRes);

            // Assert
            expect(fs.promises.unlink).toHaveBeenCalled();      // Should delete the old file
            expect(CarouselSlide.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011',
                expect.objectContaining({
                    imageUrl: '/var/data/new-image.jpg'
                })
            );
        });

        test('should update slide with new image Url', async() => {
            // Arrange
            const existingSlide = createTestSlide({
                imageUrl: '/var/data/old-image.jpg'
            });

            const updateData = {
                title: 'Updated Title',
                description: 'Updated Description',
                buttonText: 'Updated Button',
                buttonUrl: 'https://updated.com',
                imageOption: 'url',
                imageUrl: 'https://new-external.com/image.jpg'
            };

            CarouselSlide.findById.mockResolvedValue(existingSlide);

            const mockReq = {
                params: { id: '507f1f77bcf86cd799439011' },
                body: updateData,
                file: null
            };

            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.editSlide(mockReq, mockRes);

            // Assert
            expect(fs.promises.unlink).toHaveBeenCalled();          // Should delete old image
            expect(CarouselSlide.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011',
                expect.objectContaining({
                    imageUrl: 'https://new-external.com/image.jpg'
                })
             );
        });

        test('should handle file cleanup errors', async() => {
            // Arrange
            const existingSlide = createTestSlide({
                imageUrl: '/var/data/old-image.jpg'
            });

            const updateData = {
                title: 'Updated Title',
                description: 'Updated Description',
                buttonText: 'Updated Button',
                buttonUrl: 'https://updated.com',
                imageOption: 'url',
                imageUrl: 'https://new-external.com/image.jpg'
            };

            CarouselSlide.findById.mockResolvedValue(existingSlide);
            fs.promises.unlink.mockRejectedValue(new Error('File not found'));

            const mockReq = {
                params: { id: '507f1f77bcf86cd799439011' },
                body: updateData,
                file: null
            };

            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.editSlide(mockReq, mockRes);

            // Assert - should continue even if file deletion fails
            expect(CarouselSlide.findByIdAndUpdate).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/adminportal/carouselmanagement');
        });

        test('should handle slide not found during update', async() => {
            // Arrange
            CarouselSlide.findById.mockResolvedValue(null);

            const mockReq = {
                params: {id: 'nonexistent'},
                body: { title: 'Updated Title'},
                file: null
            };

            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.editSlide(mockReq, mockRes);

            // Assert
            expect(CarouselSlide.findByIdAndUpdate).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/adminportal/carouselmanagement');
        });
    });
       
    // ====================== DELETE operation tests ================================
    describe('DELETE operations - deleteSlide', () => {
        test('should delete slide and remove uploaded file', async () => {
            // Arrange
            const slideToDelete = createTestSlide({
                imageUrl: '/var/data/to-delete.jpg'
            });

            CarouselSlide.findById.mockResolvedValue(slideToDelete);

            const mockReq = { params: { id: '507f1f77bcf86cd799439011' }};
            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.deleteSlide(mockReq, mockRes);

            // Assert
            expect(CarouselSlide.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(fs.promises.unlink).toHaveBeenCalled();
            expect(CarouselSlide.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockRes.redirect).toHaveBeenCalledWith('/adminportal/carouselmanagement');
        });

        test('should delete slide with external URL - no file deletion', async() => {
            // Arrange
            const slideToDelete = createTestSlide({
                imageUrl: 'https://external.com/image.jpg'
            });

            CarouselSlide.findById.mockResolvedValue(slideToDelete);

            const mockReq = { params: { id: '507f1f77bcf86cd799439011'}};
            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.deleteSlide(mockReq, mockRes);

            // Assert
            expect(CarouselSlide.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(fs.promises.unlink).not.toHaveBeenCalled();          // Should not delete external url
            expect(mockRes.redirect).toHaveBeenCalledWith('/adminportal/carouselmanagement');
        });

        test('should handle file deletion errors', async() => {
            // Arrange
            const slideToDelete = createTestSlide({
                imageUrl: '/var/data/to-delete.jpg'
            });

            CarouselSlide.findById.mockResolvedValue(slideToDelete);
            fs.promises.unlink.mockRejectedValue(new Error('File not found'));

            const mockReq = { params: { id: '507f1f77bcf86cd799439011'}};
            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.deleteSlide(mockReq, mockRes);

            // Assert
            expect(CarouselSlide.findByIdAndDelete).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/adminportal/carouselmanagement');
        });

        test('should handle slide not found during deletion', async() => {
            // Arrange
            CarouselSlide.findById.mockResolvedValue(null);

            const mockReq = { params: { id: 'nonexistent'}};
            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.deleteSlide(mockReq, mockRes);

            // Assertion
            expect(CarouselSlide.findByIdAndDelete).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/adminportal/carouselmanagement');
        });

        test('should not delete default fallback image', async() => {
            // Arrange
            const slideToDelete = createTestSlide({
                imageUrl: 'images/default-fallback.jpg'
            });

            CarouselSlide.findById.mockResolvedValue(slideToDelete);

            const mockReq = { params: { id: '507f1f77bcf86cd799439011'}};
            const mockRes = { redirect: jest.fn()};

            // Act
            await controller.deleteSlide(mockReq, mockRes);

            // Assert
            expect(fs.promises.unlink).not.toHaveBeenCalled();      // Should not delete default image
            expect(CarouselSlide.findByIdAndDelete).toHaveBeenCalled();
        });
    });


});