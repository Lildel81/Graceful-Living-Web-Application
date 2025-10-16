/**
 * APPOINTMENT ROUTES
 * 
 * This file defines all HTTP routes (API endpoints) for the appointment booking system
 * in the GracefuLiving coaching platform. It connects URL paths to controller functions
 * and handles authentication/authorization for protected routes.
 * 
 * Route Categories:
 * 1. PUBLIC ROUTES - Available to all users (clients booking appointments)
 * 2. ADMIN ROUTES - Protected by authentication, only accessible to admin users
 * 
 * All routes are prefixed with /appointments in the main application
 * (e.g., /appointments/available-slots, /appointments/adminportal/appointments)
 */

// Import Express and create router instance
const express = require('express');
const router = express.Router();

// Import controller functions that handle the business logic
const {
    getAvailableSlots,        // Get available time slots for booking
    createAppointment,        // Create new appointment booking
    getAllAppointments,       // Get all appointments (admin only)
    updateAppointmentStatus,  // Update appointment status (admin only)
    deleteAppointment,        // Delete appointment (admin only)
    getAdminAvailability,     // Get weekly availability settings (admin only)
    setAdminAvailability,     // Update weekly availability (admin only)
    addBlockedDate,           // Block specific dates (admin only)
    removeBlockedDate,        // Unblock specific dates (admin only)
    getBlockedDates           // Get all blocked dates (admin only)
} = require('../controllers/appointmentController');

/**
 * ==========================================
 * AUTHENTICATION MIDDLEWARE
 * ==========================================
 */

/**
 * IS ADMIN MIDDLEWARE
 * 
 * Protects routes by checking if the user is authenticated as an admin.
 * This middleware runs before admin-only route handlers.
 * 
 * How it works:
 * 1. Checks if session exists
 * 2. Checks if session.isAdmin is true
 * 3. If authorized: calls next() to proceed to route handler
 * 4. If unauthorized: returns 403 Forbidden error
 * 
 * @param {Object} req - Express request object (contains session data)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAdmin = (req, res, next) => {
    console.log('isAdmin middleware - session:', req.session);
    console.log('isAdmin middleware - isAdmin:', req.session?.isAdmin);
    
    // Check if user has admin session
    if (req.session && req.session.isAdmin) {
        return next();  // User is admin, proceed to route handler
    }
    
    // User is not admin, deny access
    console.log('Admin access denied - redirecting to login');
    return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
    });
};

/**
 * ==========================================
 * PUBLIC ROUTES
 * ==========================================
 * 
 * These routes are accessible to anyone (no authentication required).
 * Used by clients to view available slots and book appointments.
 */

/**
 * GET /appointments/available-slots
 * 
 * Retrieves all available appointment time slots for the next 60 days.
 * Filters out:
 * - Past time slots
 * - Already booked slots
 * - Blocked dates
 * - Days when admin is not available
 * 
 * Response: { success: true, slots: [...] }
 */
router.get('/available-slots', getAvailableSlots);

/**
 * POST /appointments/book
 * 
 * Creates a new appointment booking.
 * Validates input, checks availability, saves to database,
 * and syncs with Google Calendar.
 * 
 * Request Body:
 * - clientName: string (required)
 * - clientEmail: string (required)
 * - clientPhone: string (required)
 * - appointmentDate: string (YYYY-MM-DD, required)
 * - appointmentTime: string (e.g., "2:00 PM - 2:30 PM", required)
 * - notes: string (optional)
 * - _csrf: string (CSRF token, required)
 * 
 * Response: { success: true, appointment: {...} }
 */
router.post('/book', createAppointment);

/**
 * ==========================================
 * ADMIN ROUTES - APPOINTMENT MANAGEMENT
 * ==========================================
 * 
 * These routes require admin authentication (isAdmin middleware).
 * Used by the admin dashboard to manage appointments.
 */

/**
 * GET /appointments/adminportal/appointments
 * 
 * Retrieves ALL appointments (past, upcoming, cancelled).
 * Used by admin dashboard to display appointment list.
 * 
 * Response: { success: true, appointments: [...] }
 */
router.get('/adminportal/appointments', isAdmin, getAllAppointments);

/**
 * PUT /appointments/adminportal/appointments/:id/status
 * 
 * Updates the status of an existing appointment.
 * Also syncs status change with Google Calendar.
 * 
 * URL Parameter:
 * - id: MongoDB ObjectId of the appointment
 * 
 * Request Body:
 * - status: string (pending|confirmed|cancelled|completed, required)
 * - _csrf: string (CSRF token, required)
 * 
 * Response: { success: true, appointment: {...} }
 */
router.put('/adminportal/appointments/:id/status', isAdmin, updateAppointmentStatus);

/**
 * DELETE /appointments/adminportal/appointments/:id
 * 
 * Permanently deletes an appointment from the database.
 * Also removes the event from Google Calendar.
 * 
 * URL Parameter:
 * - id: MongoDB ObjectId of the appointment
 * 
 * Request Body:
 * - _csrf: string (CSRF token, required)
 * 
 * Response: { success: true, message: "..." }
 */
router.delete('/adminportal/appointments/:id', isAdmin, deleteAppointment);

/**
 * ==========================================
 * ADMIN ROUTES - AVAILABILITY MANAGEMENT
 * ==========================================
 * 
 * These routes manage the admin's weekly availability schedule.
 * Used by admin dashboard to set which days and times are bookable.
 */

/**
 * GET /appointments/adminportal/availability
 * 
 * Retrieves the admin's weekly availability settings.
 * Returns availability for each day of the week (0=Sunday to 6=Saturday).
 * 
 * Response: { success: true, availabilities: [...] }
 */
router.get('/adminportal/availability', isAdmin, getAdminAvailability);

/**
 * POST /appointments/adminportal/availability
 * 
 * Creates or updates availability settings for a specific day of the week.
 * 
 * Request Body:
 * - dayOfWeek: number (0-6, where 0=Sunday, 6=Saturday, required)
 * - timeSlots: array of objects [{ start: "9:00 AM", end: "9:30 AM" }, ...]
 * - isActive: boolean (whether this day is active for bookings, optional)
 * - _csrf: string (CSRF token, required)
 * 
 * Response: { success: true, availability: {...} }
 */
router.post('/adminportal/availability', isAdmin, setAdminAvailability);

/**
 * ==========================================
 * ADMIN ROUTES - BLOCKED DATES MANAGEMENT
 * ==========================================
 * 
 * These routes manage specific dates when the admin is unavailable
 * (holidays, vacations, personal time, etc.).
 */

/**
 * GET /appointments/adminportal/blocked-dates
 * 
 * Retrieves all blocked dates.
 * Used by admin dashboard to display blocked dates list.
 * 
 * Response: { success: true, blockedDates: [...] }
 */
router.get('/adminportal/blocked-dates', isAdmin, getBlockedDates);

/**
 * POST /appointments/adminportal/blocked-dates
 * 
 * Blocks a specific date so clients cannot book appointments on that day.
 * 
 * Request Body:
 * - date: string (YYYY-MM-DD format, required)
 * - reason: string (optional reason for blocking)
 * - _csrf: string (CSRF token, required)
 * 
 * Response: { success: true, blockedDate: {...} }
 */
router.post('/adminportal/blocked-dates', isAdmin, addBlockedDate);

/**
 * DELETE /appointments/adminportal/blocked-dates/:id
 * 
 * Removes a blocked date, allowing clients to book on that day again.
 * 
 * URL Parameter:
 * - id: MongoDB ObjectId of the blocked date
 * 
 * Response: { success: true, message: "..." }
 */
router.delete('/adminportal/blocked-dates/:id', isAdmin, removeBlockedDate);

/**
 * ==========================================
 * MODULE EXPORTS
 * ==========================================
 * 
 * Export the router to be mounted in the main application (index.js).
 * All these routes will be prefixed with /appointments in the main app.
 */
module.exports = router;

