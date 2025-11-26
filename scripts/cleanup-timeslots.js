/**
 * ================================================
 * TIME SLOTS CLEANUP SCRIPT
 * ================================================
 * 
 * This is a REPAIR SCRIPT that fixes corrupted time slot data in the database.
 * 
 * Problem It Solves:
 * - Database had corrupted time slot data (all showing "10:00 AM - 2:00 PM")
 * - Duplicates were being loaded in the admin dashboard
 * - Time slots weren't properly formatted as 30-minute intervals
 * 
 * What It Does:
 * - Deletes ALL existing availability records (destructive!)
 * - Creates fresh availability for Monday and Tuesday
 * - Uses proper 30-minute time slot format
 * - Ensures data integrity
 * 
 * When to Use:
 * - When time slots are corrupted or showing incorrect times
 * - After database issues or migration
 * - When all slots show the same time
 * - When duplicates appear in admin dashboard
 * 
 * Usage:
 * 1. Ensure MONGO_URI is set in .env file
 * 2. Run: node scripts/cleanup-timeslots.js
 * 3. Wait for success message
 * 4. Verify in admin dashboard or MongoDB Compass
 * 5. Add more days as needed via admin dashboard
 * 
 * ⚠️ WARNING:
 * - This DELETES ALL existing availability records
 * - Only creates Monday and Tuesday (add other days in dashboard)
 * - Backup your database before running if needed
 * 
 * Example Output:
 * - Monday: 14 time slots (9:00 AM - 5:00 PM with lunch break)
 * - Tuesday: 14 time slots (9:00 AM - 5:00 PM with lunch break)
 */

/* ==========================================
   IMPORT DEPENDENCIES
   ========================================== */
const mongoose = require('mongoose');              // MongoDB connection
require('dotenv').config();                        // Load environment variables

// Import AdminAvailability model
const AdminAvailability = require('../models/adminAvailability').AdminAvailability;

/* ==========================================
   DATABASE CONNECTION
   ========================================== */
/**
 * Connect to MongoDB database.
 * 
 * Process:
 * 1. Read MONGO_URI from .env file
 * 2. Connect to MongoDB using Mongoose
 * 3. If successful: log confirmation
 * 4. If failed: log error and exit
 * 
 * Required: MONGO_URI must be set in .env file
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);  // Exit with error code
    }
}

/* ==========================================
   CLEANUP TIME SLOTS FUNCTION
   ========================================== */
/**
 * Clean up corrupted time slot data and restore proper format.
 * 
 * Process:
 * 1. Delete all existing availability records (DESTRUCTIVE!)
 * 2. Create proper 30-minute time slots array
 * 3. Create fresh Monday availability
 * 4. Create fresh Tuesday availability
 * 5. Log success messages
 * 
 * ⚠️ WARNING: This deletes ALL existing availability!
 * 
 * Time Slots Created:
 * - Morning: 9:00 AM - 12:00 PM (6 slots)
 * - Lunch Break: 12:00 PM - 1:00 PM (no slots)
 * - Afternoon: 1:00 PM - 5:00 PM (8 slots)
 * - Total: 14 slots per day
 * 
 * Why 30-Minute Slots:
 * - Each appointment is 30 minutes
 * - Matches booking system requirements
 * - Prevents "10:00 AM - 2:00 PM" corruption issue
 */
async function cleanupTimeSlots() {
    try {
        // console.log('🧹 Cleaning up corrupted time slots...');
        
        /* STEP 1: Delete corrupted data */
        /*
           Remove all existing availability records.
           This clears out any corrupted time slot data.
        */
        await AdminAvailability.deleteMany({});
        // console.log('🗑️  Deleted all existing availability records');
        
        /* STEP 2: Define proper 30-minute time slots */
        /*
           Create array of properly formatted 30-minute time slots.
           Each slot is exactly 30 minutes (e.g., 9:00-9:30, 9:30-10:00).
           
           Structure:
           - Morning: 9:00 AM - 12:00 PM (6 slots)
           - Lunch break: 12:00 PM - 1:00 PM (no slots)
           - Afternoon: 1:00 PM - 5:00 PM (8 slots)
           - Total: 14 slots
        */
        const properTimeSlots = [
            // Morning slots (6 slots: 9:00 AM - 12:00 PM)
            { start: '9:00 AM', end: '9:30 AM' },
            { start: '9:30 AM', end: '10:00 AM' },
            { start: '10:00 AM', end: '10:30 AM' },
            { start: '10:30 AM', end: '11:00 AM' },
            { start: '11:00 AM', end: '11:30 AM' },
            { start: '11:30 AM', end: '12:00 PM' },
            
            // Afternoon slots (8 slots: 1:00 PM - 5:00 PM)
            { start: '1:00 PM', end: '1:30 PM' },
            { start: '1:30 PM', end: '2:00 PM' },
            { start: '2:00 PM', end: '2:30 PM' },
            { start: '2:30 PM', end: '3:00 PM' },
            { start: '3:00 PM', end: '3:30 PM' },
            { start: '3:30 PM', end: '4:00 PM' },
            { start: '4:00 PM', end: '4:30 PM' },
            { start: '4:30 PM', end: '5:00 PM' }
        ];
        
        /* STEP 3: Create Monday availability */
        /*
           Create fresh availability record for Monday (dayOfWeek: 1).
           Uses the proper 30-minute time slots defined above.
        */
        const mondayAvailability = new AdminAvailability({
            dayOfWeek: 1,              // Monday
            timeSlots: properTimeSlots, // 14 proper 30-minute slots
            isActive: true             // Day is active for bookings
        });
        
        await mondayAvailability.save();
        // console.log('✅ Created Monday availability with proper 30-minute slots');
        
        /* STEP 4: Create Tuesday availability */
        /*
           Create fresh availability record for Tuesday (dayOfWeek: 2).
           Uses the same proper 30-minute time slots.
        */
        const tuesdayAvailability = new AdminAvailability({
            dayOfWeek: 2,              // Tuesday
            timeSlots: properTimeSlots, // 14 proper 30-minute slots
            isActive: true             // Day is active for bookings
        });
        
        await tuesdayAvailability.save();
        // console.log('✅ Created Tuesday availability with proper 30-minute slots');
        
        /* STEP 5: Display success messages */
        // console.log('🎉 Cleanup completed successfully!');
        // console.log('📊 Database now contains proper 30-minute time slots');
        // console.log('📝 Add other days (Wed-Sun) via admin dashboard if needed');
        
    } catch (error) {
        // Handle cleanup errors
        console.error('❌ Error during cleanup:', error);
    }
}

/* ==========================================
   MAIN EXECUTION FUNCTION
   ========================================== */
/**
 * Main function that orchestrates the cleanup process.
 * 
 * Process:
 * 1. Connect to MongoDB
 * 2. Run cleanup function
 * 3. Disconnect from MongoDB
 * 4. Exit script
 * 
 * Error Handling: Catches and logs any errors
 */
async function main() {
    await connectDB();              // Connect to database
    await cleanupTimeSlots();       // Run cleanup
    await mongoose.disconnect();    // Close connection
    // console.log('👋 Disconnected from MongoDB');
}

/* ==========================================
   SCRIPT EXECUTION
   ========================================== */
// Execute the main function
// .catch() handles any unhandled promise rejections
main().catch(console.error);
