/**
 * ================================================
 * ADMIN AVAILABILITY INITIALIZATION SCRIPT
 * ================================================
 * 
 * This is a SETUP SCRIPT that initializes default weekly availability
 * for the GracefuLiving appointment booking system.
 * 
 * Purpose:
 * - Quickly set up a standard business hours schedule
 * - Provides a starting point that admin can customize later
 * - Overwrites any existing availability settings
 * 
 * Default Schedule:
 * - Monday-Friday: 9:00 AM - 12:00 PM, 1:00 PM - 5:00 PM
 * - Saturday: 10:00 AM - 2:00 PM  
 * - Sunday: Closed
 * 
 * When to Use:
 * - Initial setup of the appointment system
 * - Resetting to default schedule
 * - After database cleanup
 * 
 * Usage:
 * 1. Ensure MONGO_URI is set in .env file
 * 2. Run: node scripts/init-appointment-availability.js
 * 3. Wait for success message
 * 4. Customize availability in admin dashboard if needed
 * 
 * ⚠️ WARNING:
 * - This DELETES all existing availability settings
 * - Use with caution on production databases
 * 
 * After Running:
 * - Booking calendar will show available dates
 * - Admin can customize in dashboard at /adminportal/appointments
 */

/* ==========================================
   IMPORT DEPENDENCIES
   ========================================== */
require('dotenv').config();                        // Load environment variables
const mongoose = require('mongoose');              // MongoDB connection
const { AdminAvailability } = require('../models/adminAvailability'); // Availability model

/* ==========================================
   DATABASE CONNECTION
   ========================================== */
/**
 * Connect to MongoDB database.
 * 
 * Process:
 * 1. Read MONGO_URI from .env file
 * 2. Connect to MongoDB
 * 3. If successful: log confirmation
 * 4. If failed: log error and exit
 * 
 * Fallback: Uses local MongoDB if MONGO_URI not set
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/graceful-living';
    await mongoose.connect(mongoURI);
    // console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);  // Exit with error code
  }
};

/* ==========================================
   DEFAULT AVAILABILITY SCHEDULE
   ========================================== */
/**
 * Predefined weekly availability schedule.
 * 
 * Structure:
 * - dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
 * - timeSlots: Array of time ranges (not 30-min slots yet)
 * - isActive: Whether this day accepts appointments
 * 
 * Schedule:
 * - Monday-Friday: Standard business hours with lunch break
 * - Saturday: Half day (morning only)
 * - Sunday: Closed
 * 
 * Note: Time slots are ranges (e.g., "9:00 AM - 12:00 PM")
 * The system will break these into 30-minute appointment slots:
 * - 9:00-9:30, 9:30-10:00, 10:00-10:30, etc.
 */
const defaultAvailability = [
  /* Monday - Full business day */
  {
    dayOfWeek: 1,
    timeSlots: [
      { start: '9:00 AM', end: '12:00 PM' },   // Morning: 9:00-12:00 (6 slots)
      { start: '1:00 PM', end: '5:00 PM' }     // Afternoon: 1:00-5:00 (8 slots)
    ],
    isActive: true
  },
  /* Tuesday - Full business day */
  {
    dayOfWeek: 2,
    timeSlots: [
      { start: '9:00 AM', end: '12:00 PM' },   // Morning: 9:00-12:00
      { start: '1:00 PM', end: '5:00 PM' }     // Afternoon: 1:00-5:00
    ],
    isActive: true
  },
  /* Wednesday - Full business day */
  {
    dayOfWeek: 3,
    timeSlots: [
      { start: '9:00 AM', end: '12:00 PM' },   // Morning: 9:00-12:00
      { start: '1:00 PM', end: '5:00 PM' }     // Afternoon: 1:00-5:00
    ],
    isActive: true
  },
  /* Thursday - Full business day */
  {
    dayOfWeek: 4,
    timeSlots: [
      { start: '9:00 AM', end: '12:00 PM' },   // Morning: 9:00-12:00
      { start: '1:00 PM', end: '5:00 PM' }     // Afternoon: 1:00-5:00
    ],
    isActive: true
  },
  /* Friday - Full business day */
  {
    dayOfWeek: 5,
    timeSlots: [
      { start: '9:00 AM', end: '12:00 PM' },   // Morning: 9:00-12:00
      { start: '1:00 PM', end: '5:00 PM' }     // Afternoon: 1:00-5:00
    ],
    isActive: true
  },
  /* Saturday - Half day (morning only) */
  {
    dayOfWeek: 6,
    timeSlots: [
      { start: '10:00 AM', end: '2:00 PM' }    // Morning: 10:00-2:00 (8 slots)
    ],
    isActive: true
  },
  /* Sunday - Closed */
  {
    dayOfWeek: 0,
    timeSlots: [],                             // No time slots
    isActive: false                            // Not accepting appointments
  }
];

/* ==========================================
   INITIALIZE AVAILABILITY FUNCTION
   ========================================== */
/**
 * Initialize or reset admin availability to default schedule.
 * 
 * Process:
 * 1. Delete all existing availability records (DESTRUCTIVE!)
 * 2. Create new availability for each day of the week
 * 3. Log each day's schedule for confirmation
 * 4. Display success message with next steps
 * 5. Close database connection
 * 
 * ⚠️ WARNING: This deletes ALL existing availability!
 * 
 * Output:
 * - Creates 7 AdminAvailability documents (one per day)
 * - Enables booking calendar
 * - Sets up time slot generation
 */
const initializeAvailability = async () => {
  try {
    // console.log('\n🔧 Initializing default availability...\n');

    /* STEP 1: Clear existing availability */
    /*
       Delete all existing availability records.
       This ensures a clean slate for the default schedule.
    */
    await AdminAvailability.deleteMany({});
    // console.log('✅ Cleared existing availability');

    /* STEP 2: Insert default availability */
    /*
       Create availability record for each day of the week.
       Logs each day's schedule for admin confirmation.
    */
    for (const avail of defaultAvailability) {
      // Create availability document in database
      await AdminAvailability.create(avail);
      
      // Get day name for logging
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[avail.dayOfWeek];
      
      // Log the schedule for this day
      if (avail.isActive) {
        // Format time slots for display
        const slots = avail.timeSlots.map(s => `${s.start} - ${s.end}`).join(', ');
        // console.log(`✅ ${dayName}: ${slots}`);
      } else {
        // console.log(`✅ ${dayName}: Closed`);
      }
    }

    /* STEP 3: Display success message and next steps */
    // console.log('\n✅ Default availability initialized successfully!');
    // console.log('\n📝 You can now:');
    // console.log('   1. Start your server: npm start');
    // console.log('   2. Visit: http://localhost:8080/booking');
    // console.log('   3. Or customize availability at: http://localhost:8080/adminportal/appointments\n');
  } catch (error) {
    // Handle initialization errors
    console.error('❌ Error initializing availability:', error.message);
  } finally {
    // Always close database connection
    await mongoose.connection.close();
    // console.log('✅ Database connection closed');
  }
};

/* ==========================================
   SCRIPT EXECUTION
   ========================================== */
/**
 * Main execution function.
 * 
 * Process:
 * 1. Connect to MongoDB
 * 2. Initialize availability
 * 3. Exit when complete
 * 
 * This is the entry point when script is run.
 */
const run = async () => {
  await connectDB();              // Connect to database
  await initializeAvailability(); // Initialize availability
  // Script exits after completion
};

// Execute the script
run();

