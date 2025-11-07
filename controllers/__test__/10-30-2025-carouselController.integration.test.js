/**
 * Integration tests for carousel controller with real database operations
 * This is because we want to see the real implementation
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { title } = require('process');

const CarouselSlide = require(path.join('..', '..', 'models', 'carouselSlide'));
const controller = require(path.join('..', '..', 'controllers', 'carouselController'));

// Main integration Test Suite
describe('Carousel controller integration tests', () => {
    // ================== Test State Variable =====================

    // Track created data for cleanup
    let testSlideId;

    // Use a separate test upload directory to avoid affecting real uploads
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'images', 'uploads', 'test');

    // =================== Before all tests setup =================
    beforeAll (async () => {
        // Real file system operations
        // To test the real behavior of file operations
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    });

    // =================== After all tests cleanup ================
    afterAll (async() => {
        // Directory cleanup
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
            fs.rmdirSync(uploadDir);
        }
    });

    // ==================== After each test cleanup ==================
    // Per-test clearnup: remove test data from the real database
    afterEach (async () => {
        if (testSlideId) {
            try {
                await CarouselSlide.findByIdAndDelete(testSlideId);
                testSlideId = null;
            }
            catch (error){
                // No need to handle eror 
            }
        }
    });

    // ==================== End-to-end CRUD tests ====================
    // This test suite verifies complete workflows from start to finish
    // It tests the full lifecycle of data through the web app
    describe ('End-to-end CRUD operations', () => {

        test('should create, read, update, and delete a slide with database', async () => {
            // Arrange
            // ================ Database availability check ============
            if (!mongoose.connection.readyState){
                return; // Skip test if no database connection
            }

            // ================ CREATE - add new slide to database =====
            const createReq = {
                body: {
                    title: 'Integration Test Slide',
                    description: 'Testing end-to-end functionality',
                    buttonText: 'Test Button',
                    buttonUrl: 'https://test.com',
                    imageOption: 'url',
                    imageUrl: 'https://example.com/test.jpg'
                },
                file: null
            };

            // Mock the response for easy assertion
            const createRes = {
                redirect: jest.fn()
            };

            // Act
            await controller.createSlide(createReq, createRes);

            // Assert
            expect(createRes.redirect).toHaveBeenCallWith('/adminportal/carouselmanagement');

            // ================== Verify CREATE- check data was actually saved ==============

            // Arrange - Act
            const createdSlide = await CarouselSlide.findOne({ title: 'Integration Test Slide' });

            // Assert
            expect(createdSlide).toBeDefined();
            expect(createdSlide.description).toBe('Tesing end-to-end functionality');

            // Save the ID for use in sebsequent operations
            testSlideId = createdSlide._id;

            // ================== READ - retrieve slide from database ==================
            const readReq = {
                params: { id: testSlideId.toString()}
            };

            const readRes = {
                render: jest.fn()
            };

            await controller.getEditSlideView(readReq, readRes);

            expect(readRes.render).toHaveBeenCallWith('editslide', expect.objectContaining({
                slide: expect.objectContaining ({
                    title: 'Integration Test Slide'
                })
            }));

            // ==================== Update - modify existing slide ===================
            const updateReq = {
                params: { id: testSlideId.toString() },
                body: {
                    title: 'Updated Integration Test Slide',
                    description: 'Updated description',
                    buttonText: 'Updated Button',
                    buttonUrl: 'https://updated.com',
                    imageOption: 'keep'
                },
                file: null
            };

            const updateRes = {
                redirect: jest.fn()
            };

            await controller.editSlide(updateReq, updateRes);
            expect(updateRes.redirect).toHaveBeenCallWith('/adminportal/carouselmanagement');

            // ======================= Verify UPDATE - check changes persisted ==========
            const updatedSlide = await CarouselSlide.findById(testSlideId);
            expect(updatedSlide.title).toBe('Updated Integration Test Slide');
            expect(updatedSlide.description).toBe('Updated description');

            // ======================= DELETE - remove slide from database ===============
            const deleteReq = {
                params: { id: testSlideId.toString() }
            };

            const deleteRes = {
                redirect: jest.fn()
            };

            await controller.deleteSlide(deleteReq, deleteRes);
            expect(deleteRes.redirect).toHaveBeenCallWith('/adminportal/caroudelmanagement');

            // =================== Verify DELETE - confirm data is deleted ===============
            const deletedSlide = await CarouselSlide.findById(testSlideId);
            expect(deleteSlide).toBeNull();

            // Clear the ID so afterEach does not try to delete it again
            testSlideId = null;
        });
    });

});