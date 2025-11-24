/**
 * ================================================
 * BOOKING PAGE - CLIENT-SIDE LOGIC
 * ================================================
 * 
 * This file handles all client-side interactions for the Calendly-style
 * appointment booking interface for GracefuLiving coaching platform.
 * 
 * Key Features:
 * - Fetch available time slots from server
 * - Generate interactive calendar
 * - Handle date and time selection
 * - Multi-step form navigation (Date → Time → Details → Confirmation)
 * - Form validation and submission
 * - Timezone handling (Pacific Time)
 * - CSRF protection
 * 
 * Step Flow:
 * 1. Load available slots from API
 * 2. Display interactive calendar (Step 1)
 * 3. User selects date → Show time slots (Step 2)
 * 4. User selects time → Show contact form (Step 3)
 * 5. User submits form → Book appointment
 * 6. Show confirmation (Step 4)
 * 
 * API Endpoints:
 * - GET /appointments/available-slots - Fetch available dates/times
 * - POST /appointments/book - Create new appointment
 */

/* ==========================================
   GLOBAL STATE VARIABLES
   ========================================== */
// Store all available time slots from server
let availableSlots = [];

// Currently selected date (YYYY-MM-DD format)
let selectedDate = null;

// Currently selected time slot (e.g., "2:00 PM - 2:30 PM")
let selectedTime = null;

// Formatted time for display (e.g., "2:00 PM")
let selectedTimeFormatted = null;

// Current step number (1-4)
let currentStep = 1;

// Calendar view state (current month and year)
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

/* ==========================================
   INITIALIZATION
   ========================================== */
/**
 * Initialize booking system when page loads.
 * 
 * Process:
 * 1. Wait for DOM to be fully loaded
 * 2. Setup all event listeners
 * 3. Load available slots from server
 * 4. Initialize calendar header
 */
document.addEventListener('DOMContentLoaded', function() {
    // console.log('DOM loaded, initializing booking system...');
    setupEventListeners();
    loadAvailableSlots();
    updateCalendarHeader();
});

/* ==========================================
   LOAD AVAILABLE SLOTS FROM SERVER
   ========================================== */
/**
 * Fetch available appointment slots from the server.
 * 
 * This is called on page load to get all available dates and times
 * for the next 60 days based on admin's availability settings.
 * 
 * Process:
 * 1. Show loading spinner
 * 2. Fetch data from API endpoint
 * 3. If successful: store slots, generate calendar, hide loading
 * 4. If failed: show error message
 * 
 * API: GET /appointments/available-slots
 * Response: { success: true, slots: [{ date, time, dateFormatted }, ...] }
 */
async function loadAvailableSlots() {
    const loadingMessage = document.getElementById('loadingSlots');
    const errorMessage = document.getElementById('errorMessage');
    const calendarContainer = document.getElementById('calendarContainer');

    try {
        // Fetch available slots from server
        const response = await fetch('/appointments/available-slots');
        const data = await response.json();

        if (data.success && data.slots.length > 0) {
            // Store slots in global variable
            availableSlots = data.slots;
            // console.log('Loaded available slots:', availableSlots.length);
            
            // Generate calendar with available dates
            generateCalendar();
            
            // Hide loading, show calendar
            loadingMessage.style.display = 'none';
            calendarContainer.style.display = 'block';
        } else {
            // No slots available
            loadingMessage.style.display = 'none';
            errorMessage.textContent = 'No available time slots at the moment. Please check back later.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        // Network or server error
        console.error('Error loading slots:', error);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
    }
}

/* ==========================================
   EVENT LISTENERS SETUP
   ========================================== */
/**
 * Setup all event listeners for the booking interface.
 * 
 * Listeners:
 * - Step navigation (Next, Back buttons)
 * - Calendar navigation (Previous/Next month)
 * - Form submission
 * - Book another appointment
 * 
 * Called once during initialization.
 */
function setupEventListeners() {
    /* STEP NAVIGATION - Continue Buttons */
    
    // Step 1 → Step 2: Continue to time selection after date is selected
    document.getElementById('continueBtn').addEventListener('click', function() {
        if (selectedDate) {
            showStep(2);                   // Show time selection step
            loadTimeSlots();               // Load time slots for selected date
        }
    });

    // Step 2 → Step 3: Continue to details form after time is selected
    document.getElementById('continueToDetailsBtn').addEventListener('click', function() {
        if (selectedTime) {
            showStep(3);                   // Show details form step
            updateDetailsSummary();        // Update summary with date & time
        }
    });

    /* STEP NAVIGATION - Back Buttons */
    
    // Step 2 → Step 1: Go back to date selection
    document.getElementById('backToDateBtn').addEventListener('click', function() {
        showStep(1);
    });

    // Step 3 → Step 2: Go back to time selection
    document.getElementById('backToTimeBtn').addEventListener('click', function() {
        showStep(2);
    });

    /* STEP NAVIGATION - Back Links */
    
    // "← Change Date" link in Step 2
    document.getElementById('backToDate').addEventListener('click', function(e) {
        e.preventDefault();                // Prevent default link behavior
        showStep(1);                       // Go back to date selection
    });

    // "← Change Time" link in Step 3
    document.getElementById('backToTime').addEventListener('click', function(e) {
        e.preventDefault();                // Prevent default link behavior
        showStep(2);                       // Go back to time selection
    });

    /* CALENDAR NAVIGATION */
    
    // Previous month button
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;             // December
            currentYear--;                 // Previous year
        }
        updateCalendarHeader();            // Update month/year display
        generateCalendar();                // Regenerate calendar
    });

    // Next month button
    document.getElementById('nextMonth').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;              // January
            currentYear++;                 // Next year
        }
        updateCalendarHeader();            // Update month/year display
        generateCalendar();                // Regenerate calendar
    });

    /* FORM SUBMISSION */
    
    // Handle booking form submission
    document.getElementById('bookingForm').addEventListener('submit', handleFormSubmission);

    /* CONFIRMATION ACTIONS */
    
    // "Schedule another meeting" button on confirmation page
    document.getElementById('bookAnotherBtn').addEventListener('click', function() {
        resetBooking();                    // Reset form and go back to Step 1
    });
}

/* ==========================================
   CALENDAR HEADER UPDATE
   ========================================== */
/**
 * Update the calendar header with current month and year.
 * Called when user navigates between months.
 * 
 * Example: "October 2025"
 */
function updateCalendarHeader() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

/* ==========================================
   CALENDAR GENERATION
   ========================================== */
/**
 * Generate interactive calendar for the current month.
 * 
 * Process:
 * 1. Extract available dates from loaded slots
 * 2. Calculate first day of month
 * 3. Generate 42 date cells (6 weeks for full month view)
 * 4. Mark dates as: disabled, available, or selected
 * 5. Add click listeners to available dates
 * 
 * Date States:
 * - Disabled: Past dates, blocked dates, or no availability
 * - Available: Future dates with open time slots
 * - Selected: Currently selected date (highlighted)
 * 
 * Timezone: Uses local timezone to prevent day shift issues
 */
function generateCalendar() {
    const calendarDates = document.getElementById('calendarDates');
    const today = new Date();
    today.setHours(0, 0, 0, 0);        // Reset to midnight for accurate comparison

    // Extract unique available dates from all time slots
    const availableDates = [...new Set(availableSlots.map(slot => slot.date))];
    // console.log('Available dates:', availableDates);
    
    // Calculate calendar start date (first day of month)
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    let html = '';
    
    // Generate 42 date cells (6 weeks = full month view)
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Get date info for this cell
        const dateStr = date.toISOString().split('T')[0];  // YYYY-MM-DD format
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isPast = date < today;
        const isAvailable = availableDates.includes(dateStr);
        
        // Determine CSS classes for this date cell
        let classes = 'date-cell';
        
        if (!isCurrentMonth) {
            classes += ' disabled';    // Gray out dates from other months
        } else if (isPast) {
            classes += ' disabled';    // Gray out past dates
        } else if (!isAvailable) {
            classes += ' disabled';    // Gray out dates with no availability
        } else {
            classes += ' available';   // Highlight available dates
        }
        
        if (selectedDate === dateStr) {
            classes += ' selected';    // Highlight selected date
        }
        
        // Debug log for available dates
        // if (isAvailable && isCurrentMonth && !isPast) {
        //     console.log('Available date found:', dateStr, 'Day:', date.getDate());
        // }
        
        // Create date cell HTML
        html += `<div class="${classes}" data-date="${dateStr}">${date.getDate()}</div>`;
    }
    
    // Insert all date cells into calendar
    calendarDates.innerHTML = html;
    // console.log('Calendar generated with', html.split('date-cell').length - 1, 'date cells');
    
    // Add click listeners to all date cells
    document.querySelectorAll('.date-cell').forEach(cell => {
        cell.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            selectDate(date);          // Handle date selection
        });
    });
}

/* ==========================================
   DATE SELECTION
   ========================================== */
/**
 * Handle date selection when user clicks a calendar date.
 * 
 * Process:
 * 1. Check if date is available (not disabled)
 * 2. Store selected date
 * 3. Update visual selection (highlight selected date)
 * 4. Enable "Next" button
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 */
function selectDate(date) {
    // console.log('Attempting to select date:', date);
    
    const dateCell = document.querySelector(`[data-date="${date}"]`);
    // console.log('Found date cell:', dateCell);
    
    // Prevent selection of disabled dates
    if (dateCell.classList.contains('disabled')) {
        // console.log('Date is disabled, cannot select');
        return;                        // Exit function, do nothing
    }
    
    // Store selected date in global variable
    selectedDate = date;
    
    // Remove 'selected' class from all date cells
    document.querySelectorAll('.date-cell').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // Add 'selected' class to clicked date cell
    dateCell.classList.add('selected');
    
    // Enable "Next" button now that a date is selected
    document.getElementById('continueBtn').disabled = false;
    
    // console.log('Date selected successfully:', date);
}

/* ==========================================
   TIME SLOTS LOADING
   ========================================== */
/**
 * Load and display time slots for the selected date.
 * 
 * Process:
 * 1. Format selected date for display (e.g., "Mon, Oct 13")
 * 2. Filter time slots for the selected date
 * 3. Generate time slot buttons
 * 4. Add click listeners to time slots
 * 
 * Timezone: Parses date in local timezone to prevent day shift
 * 
 * Example Output:
 * - "9:00 AM", "9:30 AM", "10:00 AM", etc.
 */
function loadTimeSlots() {
    const timeSlots = document.getElementById('timeSlots');
    const selectedDateInfo = document.getElementById('selectedDateInfo');
    
    // Format selected date for display (parse in local timezone to prevent day shift)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // Local timezone
    const dateFormatted = dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    selectedDateInfo.textContent = dateFormatted;  // Display: "Mon, Oct 13"
    
    // Filter slots for the selected date
    const slots = availableSlots.filter(slot => slot.date === selectedDate);
    
    // console.log('Available slots for', selectedDate, ':', slots);
    
    // Generate time slot HTML
    let html = '';
    
    if (slots.length === 0) {
        // No slots available for this date
        html = '<div class="no-slots">No available time slots for this date</div>';
    } else {
        // Create time slot button for each available slot
        slots.forEach(slot => {
            // Extract start time from "2:00 PM - 2:30 PM" → "2:00 PM"
            const timeDisplay = slot.time.split(' - ')[0];
            
            const slotClass = 'time-slot';
            
            html += `
                <div class="${slotClass}" data-time="${slot.time}" data-time-display="${timeDisplay}">
                    ${timeDisplay}
                </div>
            `;
        });
    }
    
    // Insert time slot buttons into grid
    timeSlots.innerHTML = html;
    
    // Add click listeners to time slot buttons (skip disabled slots)
    document.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
        slot.addEventListener('click', function() {
            const time = this.getAttribute('data-time');      // Full time range
            const timeDisplay = this.getAttribute('data-time-display'); // Start time only
            selectTime(time, timeDisplay);
        });
    });
}

/* ==========================================
   TIME SELECTION
   ========================================== */
/**
 * Handle time slot selection when user clicks a time button.
 * 
 * Process:
 * 1. Store selected time (full range and display format)
 * 2. Update visual selection (highlight selected slot)
 * 3. Enable "Next" button
 * 
 * @param {string} time - Full time range (e.g., "2:00 PM - 2:30 PM")
 * @param {string} timeFormatted - Display time (e.g., "2:00 PM")
 */
function selectTime(time, timeFormatted) {
    // Store selected time in global variables
    selectedTime = time;
    selectedTimeFormatted = timeFormatted;
    
    // Remove 'selected' class from all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add 'selected' class to clicked time slot
    event.target.classList.add('selected');
    
    // Enable "Next" button now that a time is selected
    document.getElementById('continueToDetailsBtn').disabled = false;
}

/* ==========================================
   DETAILS SUMMARY UPDATE
   ========================================== */
/**
 * Update the appointment summary on the details form.
 * Shows selected date and time for user confirmation.
 * 
 * Timezone: Parses date in local timezone to prevent day shift
 * 
 * Example Output: "Mon, Oct 13 at 2:00 PM"
 */
function updateDetailsSummary() {
    const summaryText = document.getElementById('summaryText');
    
    // Parse date in local timezone to avoid day shift
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // Local timezone
    const dateFormatted = dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    
    // Display formatted date and time
    summaryText.textContent = `${dateFormatted} at ${selectedTimeFormatted}`;
}

/* ==========================================
   STEP NAVIGATION
   ========================================== */
/**
 * Show a specific step and hide all others.
 * 
 * Process:
 * 1. Hide all step containers
 * 2. Show the requested step
 * 3. Update progress indicator circles
 * 4. Update current step state
 * 
 * @param {number} stepNumber - Step number to show (1-4)
 */
function showStep(stepNumber) {
    // Hide all step containers
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the requested step
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // Update progress indicator visual states
    updateProgressIndicators(stepNumber);
    
    // Update current step tracker
    currentStep = stepNumber;
}

/* ==========================================
   PROGRESS INDICATOR UPDATE
   ========================================== */
/**
 * Update the visual progress indicator at the top.
 * 
 * Updates the numbered circles to show:
 * - Completed steps (teal filled circle)
 * - Current step (teal filled circle)
 * - Future steps (gray circle)
 * 
 * @param {number} activeStep - Current active step number (1-3)
 */
function updateProgressIndicators(activeStep) {
    // Loop through all 3 steps
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step-indicator-${i}`);
        const circle = stepElement.querySelector('.step-circle');
        
        // Reset classes
        circle.classList.remove('active', 'completed');
        
        // Set appropriate state
        if (i < activeStep) {
            circle.classList.add('completed');  // Past steps (teal)
        } else if (i === activeStep) {
            circle.classList.add('active');     // Current step (teal)
        }
        // else: future steps (gray - default)
        
        // Update step container classes as well
        stepElement.classList.remove('active', 'completed');
        if (i < activeStep) {
            stepElement.classList.add('completed');
        } else if (i === activeStep) {
            stepElement.classList.add('active');
        }
    }
}

/* ==========================================
   FORM SUBMISSION
   ========================================== */
/**
 * Handle booking form submission.
 * 
 * Process:
 * 1. Prevent default form submission
 * 2. Collect form data (name, email, phone, notes)
 * 3. Combine with selected date and time
 * 4. Send POST request to server
 * 5. If successful: show confirmation
 * 6. If failed: show error alert
 * 
 * API: POST /appointments/book
 * 
 * Request Body:
 * - _csrf: CSRF token for security
 * - appointmentDate: Selected date (YYYY-MM-DD)
 * - appointmentTime: Selected time range
 * - clientName, clientEmail, clientPhone: Contact info
 * - notes: Optional additional information
 * 
 * On Success:
 * - Appointment saved to database
 * - Google Calendar event created
 * - Email notification sent
 * - Confirmation screen shown
 */
async function handleFormSubmission(e) {
    e.preventDefault();                // Prevent default form submission
    
    // Collect form data
    const formData = new FormData(e.target);
    
    // Build appointment data object
    const appointmentData = {
        _csrf: formData.get('_csrf'),                  // CSRF token for security
        appointmentDate: selectedDate,                 // YYYY-MM-DD format
        appointmentTime: selectedTime,                 // "HH:MM AM/PM - HH:MM AM/PM"
        clientName: formData.get('clientName'),        // Client's full name
        clientEmail: formData.get('clientEmail'),      // Client's email
        clientPhone: formData.get('clientPhone'),      // Client's phone
        notes: formData.get('notes') || ''             // Optional notes
    };
    
    // console.log('Sending appointment data:', appointmentData);
    
    try {
        // Send POST request to book appointment
        const response = await fetch('/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData)
        });
        
        // console.log('Response status:', response.status);
        
        // Parse JSON response
        const result = await response.json();
        // console.log('Response data:', result);
        
        if (result.success) {
            // Appointment booked successfully
            showConfirmation(result.appointment);
        } else {
            // Server returned error
            alert('Error booking appointment: ' + result.message);
        }
    } catch (error) {
        // Network or parsing error
        console.error('Error booking appointment:', error);
        alert('Error booking appointment. Please try again.');
    }
}

/* ==========================================
   CONFIRMATION DISPLAY
   ========================================== */
/**
 * Show the confirmation screen with appointment details.
 * 
 * Process:
 * 1. Populate confirmation details (date, time, name)
 * 2. Show Step 4 (confirmation screen)
 * 
 * @param {Object} appointment - Appointment object from server
 */
function showConfirmation(appointment) {
    // Update confirmation details from server response
    document.getElementById('confirmDate').textContent = appointment.dateFormatted;
    document.getElementById('confirmTime').textContent = appointment.timeFormatted;
    document.getElementById('confirmName').textContent = appointment.clientName;
    
    // Show confirmation step
    showStep(4);
}

/* ==========================================
   BOOKING RESET
   ========================================== */
/**
 * Reset the entire booking process for a new appointment.
 * Called when user clicks "Schedule another meeting" button.
 * 
 * Process:
 * 1. Clear all selected values
 * 2. Reset form fields
 * 3. Remove visual selections
 * 4. Disable navigation buttons
 * 5. Return to Step 1
 * 6. Regenerate calendar
 */
function resetBooking() {
    // Clear selected values
    selectedDate = null;
    selectedTime = null;
    selectedTimeFormatted = null;
    
    // Reset form fields
    document.getElementById('bookingForm').reset();
    
    // Remove visual selections from calendar
    document.querySelectorAll('.date-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // Remove visual selections from time slots
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Disable navigation buttons (re-enabled when user makes selections)
    document.getElementById('continueBtn').disabled = true;
    document.getElementById('continueToDetailsBtn').disabled = true;
    
    // Go back to Step 1 (date selection)
    showStep(1);
    
    // Reload calendar to show current state
    generateCalendar();
}