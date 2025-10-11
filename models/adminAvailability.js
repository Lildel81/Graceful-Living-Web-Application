/**
 * ADMIN AVAILABILITY MODEL
 * 
 * This file defines the database schemas and validation for managing admin availability
 * and blocked dates in the GracefuLiving coaching platform. It handles weekly availability
 * settings, time slot management, and date blocking functionality.
 * 
 * Key Features:
 * - Weekly availability management (Sunday-Saturday)
 * - Time slot configuration (30-minute intervals)
 * - Date blocking for holidays/vacations
 * - Input validation using Joi
 * - CSRF token support for security
 * 
 * Models:
 * - AdminAvailability: Weekly availability settings per day
 * - BlockedDate: Specific dates when admin is unavailable
 * - TimeSlot: Individual time slots within a day
 */

// Import required dependencies
const mongoose = require('mongoose');  // MongoDB object modeling tool
const Joi = require('joi');           // Schema validation library

/**
 * TIME SLOT SCHEMA
 * 
 * Defines the structure for individual time slots within a day.
 * Each time slot represents a 30-minute appointment window.
 * 
 * Example: { start: "9:00 AM", end: "9:30 AM" }
 */
const timeSlotSchema = new mongoose.Schema({
    start: {
        type: String,           // Start time (e.g., "9:00 AM")
        required: true          // Must be provided
    },
    end: {
        type: String,           // End time (e.g., "9:30 AM")
        required: true          // Must be provided
    }
});

/**
 * ADMIN AVAILABILITY SCHEMA
 * 
 * Defines the weekly availability settings for the admin/coach.
 * Each document represents one day of the week with its available time slots.
 * 
 * Day of Week Mapping:
 * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday,
 * 4 = Thursday, 5 = Friday, 6 = Saturday
 */
const availabilitySchema = new mongoose.Schema({
    dayOfWeek: {
        type: Number,
        required: true,        // Must be provided
        min: 0,               // Minimum value (Sunday)
        max: 6                // Maximum value (Saturday)
    },
    timeSlots: [timeSlotSchema],  // Array of available time slots for this day
    isActive: {
        type: Boolean,
        default: true         // Day is active by default (accepting appointments)
    },
    createdAt: {
        type: Date,
        default: Date.now     // Automatically set when record is created
    }
});

/**
 * BLOCKED DATE SCHEMA
 * 
 * Defines specific dates when the admin is unavailable for appointments.
 * Used for holidays, vacations, personal time, etc.
 * These dates will be disabled on the public booking calendar.
 */
const blockedDateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true        // Must be provided
    },
    reason: {
        type: String,
        maxlength: 200        // Optional reason for blocking (max 200 characters)
    },
    createdAt: {
        type: Date,
        default: Date.now     // Automatically set when record is created
    }
});

// Create MongoDB models from the schemas
const AdminAvailability = mongoose.model('AdminAvailability', availabilitySchema);
const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema);

/**
 * AVAILABILITY VALIDATION FUNCTION
 * 
 * Validates admin availability data using Joi schema validation.
 * Ensures data integrity before saving weekly availability settings.
 * 
 * @param {Object} availability - The availability data to validate
 * @returns {Object} - Validation result with error details if invalid
 */
const validateAvailability = (availability) => {
    // Define validation schema using Joi
    const schema = Joi.object({
        _csrf: Joi.string().optional(),                    // CSRF token for security (optional)
        dayOfWeek: Joi.number().min(0).max(6).required(),  // Day of week validation (0-6)
        timeSlots: Joi.array().items(                      // Time slots array validation
            Joi.object({
                start: Joi.string().required(),            // Start time validation
                end: Joi.string().required()               // End time validation
            })
        ).required(),                                       // Time slots array is required
        isActive: Joi.boolean().optional()                 // Active status (optional)
    });

    // Return validation result
    return schema.validate(availability);
};

/**
 * BLOCKED DATE VALIDATION FUNCTION
 * 
 * Validates blocked date data using Joi schema validation.
 * Ensures data integrity before saving blocked dates.
 * 
 * @param {Object} blockedDate - The blocked date data to validate
 * @returns {Object} - Validation result with error details if invalid
 */
const validateBlockedDate = (blockedDate) => {
    // Define validation schema using Joi
    const schema = Joi.object({
        _csrf: Joi.string().optional(),                    // CSRF token for security (optional)
        date: Joi.date().required(),                       // Date validation (required)
        reason: Joi.string().max(200).allow('').optional() // Reason validation (optional, max 200 chars)
    });

    // Return validation result
    return schema.validate(blockedDate);
};

// Export all models and validation functions for use in other files
module.exports.AdminAvailability = AdminAvailability;        // Export AdminAvailability model
module.exports.BlockedDate = BlockedDate;                    // Export BlockedDate model
module.exports.validateAvailability = validateAvailability;  // Export availability validation
module.exports.validateBlockedDate = validateBlockedDate;    // Export blocked date validation

