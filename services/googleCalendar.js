/**
 * GOOGLE CALENDAR SERVICE
 * 
 * This file provides Google Calendar API integration for the GracefuLiving coaching platform.
 * It handles automatic synchronization of appointments between the application and the
 * admin's Google Calendar, ensuring seamless appointment management.
 * 
 * Key Features:
 * - OAuth2 authentication with Google Calendar API
 * - Automatic event creation for new appointments
 * - Event updates when appointments are modified
 * - Event deletion when appointments are cancelled
 * - Email notifications to clients
 * - Timezone handling (Pacific Time)
 * - 30-minute appointment duration management
 * 
 * Prerequisites:
 * - Google Cloud Console project with Calendar API enabled
 * - OAuth2 credentials (Client ID, Client Secret, Redirect URI)
 * - Refresh token for automatic authentication
 * - Environment variables configured in .env file
 */

// Import Google APIs client library
const { google } = require('googleapis');

/**
 * GOOGLE CALENDAR SERVICE CLASS
 * 
 * Encapsulates all Google Calendar API operations in a single service class.
 * Uses singleton pattern to ensure consistent authentication and initialization.
 */
class GoogleCalendarService {
    /**
     * CONSTRUCTOR
     * 
     * Initializes the service with default values.
     * The calendar API client and initialization status are set here.
     */
    constructor() {
        this.calendar = null;        // Google Calendar API client instance
        this.initialized = false;    // Tracks whether the service is ready to use
    }

    /**
     * INITIALIZE GOOGLE CALENDAR API
     * 
     * Sets up OAuth2 authentication and initializes the Google Calendar API client.
     * This method must be called before any calendar operations can be performed.
     * 
     * Required Environment Variables:
     * - GOOGLE_CLIENT_ID: OAuth2 client ID from Google Cloud Console
     * - GOOGLE_CLIENT_SECRET: OAuth2 client secret from Google Cloud Console  
     * - GOOGLE_REDIRECT_URI: Authorized redirect URI for OAuth flow
     * - GOOGLE_REFRESH_TOKEN: Refresh token for automatic authentication
     * 
     * @returns {boolean} - True if initialization successful, false otherwise
     */
    initialize() {
        try {
            // Load OAuth2 credentials from environment variables
            const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
            const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
            const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
            const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

            // Validate that all required credentials are present
            if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN) {
                console.warn('Google Calendar credentials not configured. Calendar sync will be disabled.');
                return false;
            }

            // Create OAuth2 client with credentials
            const oauth2Client = new google.auth.OAuth2(
                CLIENT_ID,
                CLIENT_SECRET,
                REDIRECT_URI
            );

            // Set the refresh token for automatic authentication
            oauth2Client.setCredentials({
                refresh_token: REFRESH_TOKEN
            });

            // Initialize the Calendar API client with authentication
            this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            this.initialized = true;
            console.log('Google Calendar API initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Calendar API:', error.message);
            return false;
        }
    }

    /**
     * CREATE GOOGLE CALENDAR EVENT
     * 
     * Creates a new event in the admin's Google Calendar when an appointment is booked.
     * The event includes client details, appointment time, and automatic reminders.
     * 
     * @param {Object} appointmentData - Appointment information from the database
     * @param {string} appointmentData.clientName - Client's full name
     * @param {string} appointmentData.clientEmail - Client's email address
     * @param {string} appointmentData.clientPhone - Client's phone number
     * @param {Date} appointmentData.appointmentDate - Appointment date
     * @param {string} appointmentData.appointmentTime - Time slot (e.g., "2:00 PM - 2:30 PM")
     * @param {string} appointmentData.notes - Optional appointment notes
     * @returns {Promise<string|null>} - Google Calendar event ID if successful, null otherwise
     */
    async createEvent(appointmentData) {
        // Check if service is initialized before proceeding
        if (!this.initialized) {
            console.warn('Google Calendar not initialized. Skipping event creation.');
            return null;
        }

        try {
            // Extract appointment data from the input object
            const { clientName, clientEmail, clientPhone, appointmentDate, appointmentTime, notes } = appointmentData;

            // Parse appointment time to get start and end times
            const [startTime] = appointmentTime.split(' - ');
            const startDateTime = this.createDateTime(appointmentDate, startTime);
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // Add 30 minutes

            // Create the Google Calendar event object
            const event = {
                summary: `Appointment with ${clientName}`,                    // Event title
                description: `Client: ${clientName}\nEmail: ${clientEmail}\nPhone: ${clientPhone}\n${notes ? `Notes: ${notes}` : ''}`, // Event description
                start: {
                    dateTime: startDateTime.toISOString(),                     // Start time in ISO format
                    timeZone: 'America/Los_Angeles',                          // Pacific timezone
                },
                end: {
                    dateTime: endDateTime.toISOString(),                       // End time in ISO format
                    timeZone: 'America/Los_Angeles',                          // Pacific timezone
                },
                attendees: [
                    { email: clientEmail }                                     // Add client as attendee
                ],
                reminders: {                                                   // Custom reminder settings
                    useDefault: false,                                         // Don't use Google's default reminders
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },                // Email reminder 1 day before
                        { method: 'popup', minutes: 30 }                      // Popup reminder 30 minutes before
                    ]
                }
            };

            // Insert the event into Google Calendar
            const response = await this.calendar.events.insert({
                calendarId: 'primary',                                         // Use primary calendar
                resource: event,                                               // Event data
                sendUpdates: 'all'                                             // Send email notifications to all attendees
            });

            console.log('Google Calendar event created:', response.data.id);
            return response.data.id;
        } catch (error) {
            console.error('Error creating Google Calendar event:', error.message);
            return null;
        }
    }

    /**
     * UPDATE GOOGLE CALENDAR EVENT
     * 
     * Updates an existing Google Calendar event when appointment details change.
     * This includes rescheduling, updating client info, or changing appointment status.
     * 
     * @param {string} eventId - Google Calendar event ID to update
     * @param {Object} appointmentData - Updated appointment information
     * @returns {Promise<boolean>} - True if update successful, false otherwise
     */
    async updateEvent(eventId, appointmentData) {
        // Validate inputs before proceeding
        if (!this.initialized || !eventId) {
            console.warn('Google Calendar not initialized or no event ID. Skipping event update.');
            return false;
        }

        try {
            // Extract appointment data from the input object
            const { clientName, clientEmail, clientPhone, appointmentDate, appointmentTime, notes, status } = appointmentData;

            // Parse appointment time to get start and end times
            const [startTime] = appointmentTime.split(' - ');
            const startDateTime = this.createDateTime(appointmentDate, startTime);
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

            // Create the updated event object
            const event = {
                summary: `Appointment with ${clientName}${status === 'cancelled' ? ' (CANCELLED)' : ''}`, // Update title with status
                description: `Client: ${clientName}\nEmail: ${clientEmail}\nPhone: ${clientPhone}\n${notes ? `Notes: ${notes}` : ''}\nStatus: ${status}`, // Update description
                start: {
                    dateTime: startDateTime.toISOString(),                     // Updated start time
                    timeZone: 'America/Los_Angeles',                          // Pacific timezone
                },
                end: {
                    dateTime: endDateTime.toISOString(),                       // Updated end time
                    timeZone: 'America/Los_Angeles',                          // Pacific timezone
                },
                attendees: [
                    { email: clientEmail }                                     // Updated attendee info
                ]
            };

            // Update the event in Google Calendar
            await this.calendar.events.update({
                calendarId: 'primary',                                         // Use primary calendar
                eventId: eventId,                                              // Event ID to update
                resource: event,                                               // Updated event data
                sendUpdates: 'all'                                             // Notify all attendees of changes
            });

            console.log('Google Calendar event updated:', eventId);
            return true;
        } catch (error) {
            console.error('Error updating Google Calendar event:', error.message);
            return false;
        }
    }

    /**
     * DELETE GOOGLE CALENDAR EVENT
     * 
     * Removes an event from Google Calendar when an appointment is cancelled.
     * Sends cancellation notifications to all attendees.
     * 
     * @param {string} eventId - Google Calendar event ID to delete
     * @returns {Promise<boolean>} - True if deletion successful, false otherwise
     */
    async deleteEvent(eventId) {
        // Validate inputs before proceeding
        if (!this.initialized || !eventId) {
            console.warn('Google Calendar not initialized or no event ID. Skipping event deletion.');
            return false;
        }

        try {
            // Delete the event from Google Calendar
            await this.calendar.events.delete({
                calendarId: 'primary',                                         // Use primary calendar
                eventId: eventId,                                              // Event ID to delete
                sendUpdates: 'all'                                             // Notify all attendees of cancellation
            });

            console.log('Google Calendar event deleted:', eventId);
            return true;
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error.message);
            return false;
        }
    }

    /**
     * CREATE DATE TIME OBJECT HELPER
     * 
     * Converts date and time strings into a proper JavaScript Date object.
     * Handles 12-hour time format (AM/PM) conversion to 24-hour format.
     * Creates the date in Pacific timezone to prevent day shift when syncing to Google Calendar.
     * 
     * @param {string|Date} dateStr - Date string or Date object
     * @param {string} timeStr - Time string in format "H:MM AM/PM"
     * @returns {Date} - Combined Date object with correct date and time
     */
    createDateTime(dateStr, timeStr) {
        // Create date object in LOCAL timezone to prevent day shift
        let date;
        
        if (typeof dateStr === 'string') {
            // If dateStr is a string like "2025-10-13", parse it correctly in local timezone
            if (dateStr.includes('-')) {
                const [year, month, day] = dateStr.split('-').map(Number);
                date = new Date(year, month - 1, day); // Create date in local timezone
            } else {
                date = new Date(dateStr);
            }
        } else {
            // If it's already a Date object
            date = new Date(dateStr);
        }
        
        // Parse time string to extract time and AM/PM period
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        // Convert 12-hour format to 24-hour format
        if (period === 'PM' && hours !== 12) {
            hours += 12;        // Add 12 for PM times (except 12 PM)
        } else if (period === 'AM' && hours === 12) {
            hours = 0;          // 12 AM becomes 00:00 (midnight)
        }

        // Set the time on the date object (in local timezone)
        date.setHours(hours, minutes, 0, 0);
        return date;
    }
}

// Create singleton instance for use throughout the application
const googleCalendarService = new GoogleCalendarService();

// Export the singleton instance
module.exports = googleCalendarService;

