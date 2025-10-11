/**
 * ================================================
 * GOOGLE CALENDAR INTEGRATION TEST SCRIPT
 * ================================================
 * 
 * This is a TESTING SCRIPT that verifies Google Calendar API integration
 * for the GracefuLiving appointment booking system.
 * 
 * Purpose:
 * - Verify Google Calendar credentials are valid
 * - Test OAuth2 authentication
 * - Test event creation in Google Calendar
 * - Confirm refresh token is working
 * - Debug calendar sync issues
 * 
 * When to Use:
 * - After setting up Google Calendar credentials
 * - After running get-google-token.js
 * - When appointments aren't appearing in Google Calendar
 * - When refresh token expires (invalid_grant error)
 * - To verify calendar integration is working
 * 
 * Usage:
 * 1. Ensure all Google credentials are in .env file:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_REDIRECT_URI
 *    - GOOGLE_REFRESH_TOKEN
 * 2. Run: node scripts/test-google-calendar.js
 * 3. Wait for success/error message
 * 4. Check your Google Calendar for test event
 * 5. Delete test event if desired
 * 
 * What It Tests:
 * - OAuth2 initialization
 * - Refresh token validity
 * - Calendar API access
 * - Event creation capability
 * - Timezone handling
 * 
 * Expected Output:
 * ✅ Initialization successful
 * ✅ Event created with ID
 * ✅ Test appointment appears in Google Calendar
 * 
 * Common Errors:
 * - "invalid_grant": Refresh token expired, run get-google-token.js again
 * - "Failed to initialize": Missing or invalid credentials in .env
 * - "null/undefined": API connection issue or permissions problem
 */

/* ==========================================
   IMPORT DEPENDENCIES
   ========================================== */
const googleCalendarService = require('../services/googleCalendar'); // Calendar service
require('dotenv').config();                                          // Load .env variables

/* ==========================================
   TEST GOOGLE CALENDAR FUNCTION
   ========================================== */
/**
 * Test Google Calendar API integration.
 * 
 * Process:
 * 1. Initialize Google Calendar service with credentials
 * 2. Check if initialization was successful
 * 3. If failed: display troubleshooting instructions
 * 4. If successful: create a test event
 * 5. Display results
 * 
 * Test Event:
 * - Client: "Test Client"
 * - Date: Tomorrow
 * - Time: 2:00 PM - 2:30 PM
 * - Duration: 30 minutes
 */
async function testGoogleCalendar() {
    console.log('🧪 Testing Google Calendar Integration...');
    
    /* STEP 1: Initialize Google Calendar Service */
    /*
       Attempts to initialize the Google Calendar API client.
       Reads credentials from .env file.
       Returns true if successful, false if any credentials are missing.
    */
    const initialized = googleCalendarService.initialize();
    console.log('Initialization result:', initialized);
    
    /* STEP 2: Handle Initialization Failure */
    if (!initialized) {
        console.log('❌ Google Calendar service failed to initialize');
        console.log('Check your .env file for:');
        console.log('- GOOGLE_CLIENT_ID');
        console.log('- GOOGLE_CLIENT_SECRET'); 
        console.log('- GOOGLE_REDIRECT_URI');
        console.log('- GOOGLE_REFRESH_TOKEN');
        console.log('\n💡 Tip: Run "node get-google-token.js" to get a new refresh token');
        return;  // Exit early, cannot proceed without initialization
    }
    
    /* STEP 3: Create Test Appointment Data */
    /*
       Build a test appointment object with sample data.
       Date is set to tomorrow to ensure it's in the future.
    */
    console.log('📅 Testing event creation...');
    
    const testAppointment = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        clientPhone: '(555) 123-4567',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        appointmentTime: '2:00 PM - 2:30 PM',                         // 30-minute slot
        notes: 'Test appointment for Google Calendar sync'
    };
    
    /* STEP 4: Attempt to Create Google Calendar Event */
    try {
        // Call the createEvent method from googleCalendarService
        const eventId = await googleCalendarService.createEvent(testAppointment);
        
        /* SUCCESS - Event Created */
        if (eventId) {
            console.log('✅ Successfully created Google Calendar event!');
            console.log('Event ID:', eventId);
            console.log('📱 Check your Google Calendar for the test appointment');
            console.log('🗑️  You can delete this test event from your calendar');
        } else {
            /* PARTIAL FAILURE - No Event ID Returned */
            console.log('⚠️ Event creation returned null/undefined');
            console.log('Possible causes:');
            console.log('- Calendar API permissions issue');
            console.log('- Invalid refresh token');
            console.log('- Network connectivity problem');
        }
    } catch (error) {
        /* ERROR - Event Creation Failed */
        console.error('❌ Error creating Google Calendar event:', error.message);
        console.error('Full error:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if refresh token is valid (run get-google-token.js)');
        console.log('2. Verify Calendar API is enabled in Google Cloud Console');
        console.log('3. Check internet connection');
        console.log('4. Verify .env file has all required credentials');
    }
}

/* ==========================================
   SCRIPT EXECUTION
   ========================================== */
// Execute the test function
// .catch() handles any unhandled promise rejections
testGoogleCalendar().catch(console.error);
