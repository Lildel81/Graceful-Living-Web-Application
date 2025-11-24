/**
 * ================================================
 * ADMIN DASHBOARD - CLIENT-SIDE LOGIC
 * ================================================
 *
 * This file handles all client-side interactions for the admin appointment
 * management dashboard for GracefuLiving coaching platform.
 *
 * Key Features:
 * - Tab navigation (4 tabs)
 * - Weekly availability management (select working days)
 * - Time slot configuration (add/remove 30-minute slots)
 * - Blocked dates management (holidays, vacations)
 * - View and manage all appointments
 * - Update appointment status
 * - Delete appointments permanently
 * - Real-time statistics display
 * - Upcoming appointments sidebar
 * - CSRF protection for all requests
 *
 * Tabs:
 * 1. Available Days - Weekly schedule configuration
 * 2. Time Slots - Manage 30-minute appointment slots
 * 3. Blocked Dates - Block specific dates
 * 4. All Appointments - View/manage all appointments with filters
 *
 * API Endpoints Used:
 * - GET/POST /appointments/adminportal/availability - Weekly availability
 * - GET/POST/DELETE /appointments/adminportal/blocked-dates - Blocked dates
 * - GET/PUT/DELETE /appointments/adminportal/appointments - Appointments
 *
 * State Management:
 * - availableDays: Array of active day numbers (0-6)
 * - timeSlots: Array of time slot objects {start, end}
 * - blockedDates: Array of blocked date objects
 * - appointments: Array of appointment objects
 */

/* ==========================================
   INITIALIZATION
   ========================================== */
/**
 * Initialize the admin dashboard when page loads.
 *
 * Process:
 * 1. Wait for DOM to be ready
 * 2. Initialize dashboard settings
 * 3. Setup all event listeners
 * 4. Load all data from server
 */
document.addEventListener("DOMContentLoaded", function () {
  // console.log("Admin Dashboard initialized");

  initializeDashboard();
  setupEventListeners();
  loadAllData();

  // Zoom integration init
  setupZoomIntegrationListeners();
  loadZoomIntegrationState();
});

/* ==========================================
   GLOBAL STATE VARIABLES
   ========================================== */
// Array of available day numbers (0=Sunday, 6=Saturday)
let availableDays = [];

// Array of time slot objects: [{ start: "9:00 AM", end: "9:30 AM" }, ...]
let timeSlots = [];

// Array of blocked date objects: [{ _id, date, reason }, ...]
let blockedDates = [];

// Array of appointment objects
let appointments = [];

// CSRF token for secure requests
let csrfToken = "";

/* ==========================================
   DASHBOARD INITIALIZATION
   ========================================== */
/**
 * Initialize dashboard settings and default data.
 *
 * Process:
 * 1. Load CSRF token from hidden input
 * 2. Setup tab switching functionality
 * 3. Set default time slots if none exist
 * 4. Load all data from server
 */
function initializeDashboard() {
  // Load CSRF token from hidden input (required for all POST/PUT/DELETE requests)
  csrfToken = document.getElementById("csrfToken").value;
  // console.log("CSRF Token loaded:", csrfToken);

  // Setup tab switching between 4 tabs
  setupTabSwitching();

  // Initialize with default time slots if none exist
  // Reduced to 10 slots to prevent "413 Payload Too Large" errors
  if (timeSlots.length === 0) {
    timeSlots = [
      { start: "9:00 AM", end: "9:30 AM" },
      { start: "9:30 AM", end: "10:00 AM" },
      { start: "10:00 AM", end: "10:30 AM" },
      { start: "10:30 AM", end: "11:00 AM" },
      { start: "11:00 AM", end: "11:30 AM" },
      { start: "1:00 PM", end: "1:30 PM" },
      { start: "1:30 PM", end: "2:00 PM" },
      { start: "2:00 PM", end: "2:30 PM" },
      { start: "3:00 PM", end: "3:30 PM" },
      { start: "3:30 PM", end: "4:00 PM" },
    ];
  }

  // Load all initial data from server
  loadAdminAvailability();
  loadTimeSlots();
  loadBlockedDates();
  loadAppointments();
}

/* ==========================================
   EVENT LISTENERS SETUP
   ========================================== */
/**
 * Setup all event listeners for dashboard interactions.
 *
 * Listeners:
 * - Save Changes button
 * - Day checkboxes (Available Days tab)
 * - Add Time Slot button
 * - Block Date button
 * - Enter key on time input
 *
 * Called once during initialization.
 */
function setupEventListeners() {
  // "Save Changes" button in header
  document
    .getElementById("saveChangesBtn")
    .addEventListener("click", saveAllChanges);

  // Day of week checkboxes (Sunday-Saturday)
  document
    .querySelectorAll('.day-option input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", updateAvailableDays);
    });

  // "+ Add" button in Time Slots tab
  document
    .getElementById("addTimeSlotBtn")
    .addEventListener("click", addTimeSlot);

  // "Block Date" button in Blocked Dates tab
  document.getElementById("blockDateBtn").addEventListener("click", blockDate);

  // Allow Enter key to add time slot
  document
    .getElementById("newTimeSlot")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        addTimeSlot();
      }
    });
}

function setupZoomIntegrationListeners() {
  const toggleBtn = document.getElementById("zoomToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleZoomIntegration);
  }
}

/* ==========================================
   TAB SWITCHING
   ========================================== */
/**
 * Setup tab switching functionality.
 *
 * Process:
 * 1. Get all tab buttons and content panels
 * 2. Add click listeners to tab buttons
 * 3. On click: hide all tabs, show selected tab
 * 4. Update active states
 *
 * Tabs: Available Days, Time Slots, Blocked Dates, All Appointments
 */
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Get target tab name from data attribute
      const targetTab = button.getAttribute("data-tab");

      // Remove 'active' class from all tabs and content panels
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add 'active' class to clicked tab and its content panel
      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");

      // console.log("Switched to tab:", targetTab);
    });
  });
}

/* ==========================================
   LOAD DATA FROM SERVER
   ========================================== */

/**
 * LOAD ADMIN AVAILABILITY
 *
 * Fetch weekly availability settings from server.
 * Updates checkboxes in Available Days tab.
 *
 * API: GET /appointments/adminportal/availability
 * Response: { success: true, availabilities: [...] }
 *
 * Process:
 * 1. Fetch availability data
 * 2. Extract active days
 * 3. Check corresponding checkboxes
 * 4. Update statistics
 */
async function loadAdminAvailability() {
  try {
    // console.log("Loading admin availability...");
    const response = await fetch("/appointments/adminportal/availability");
    const data = await response.json();
    // console.log("Availability response:", data);

    if (data.success) {
      availableDays = data.availabilities;
      updateAvailableDaysDisplay();
      updateStats();
    }
  } catch (error) {
    console.error("Error loading availability:", error);
  }
}

/* ==========================================
   AVAILABLE DAYS TAB - FUNCTIONS
   ========================================== */

/**
 * UPDATE AVAILABLE DAYS DISPLAY
 *
 * Update checkboxes based on loaded availability data.
 * Checks boxes for days that have active time slots.
 */
function updateAvailableDaysDisplay() {
  // Clear all checkboxes
  document
    .querySelectorAll('.day-option input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = false;
    });

  // Check the available days
  availableDays.forEach((day) => {
    if (day.isActive && day.timeSlots && day.timeSlots.length > 0) {
      const checkbox = document.querySelector(
        `input[data-day="${day.dayOfWeek}"]`
      );
      if (checkbox) {
        checkbox.checked = true;
      }
    }
  });
}

/**
 * UPDATE AVAILABLE DAYS ON CHECKBOX CHANGE
 *
 * Called when admin checks/unchecks a day checkbox.
 * Updates the availableDays array and recalculates stats.
 */
function updateAvailableDays() {
  // Get all checked day checkboxes and extract day numbers
  const checkedDays = Array.from(
    document.querySelectorAll('.day-option input[type="checkbox"]:checked')
  ).map((checkbox) => parseInt(checkbox.getAttribute("data-day")));

  // console.log("Selected days:", checkedDays);
  updateStats(); // Recalculate statistics
}

/* ==========================================
   TIME SLOTS TAB - FUNCTIONS
   ========================================== */

/**
 * LOAD TIME SLOTS FROM SERVER
 *
 * Fetch time slots from all available days.
 * Prevents duplicates using a Set.
 *
 * API: GET /appointments/adminportal/availability
 *
 * Process:
 * 1. Fetch availability data
 * 2. Extract time slots from all days
 * 3. Remove duplicates
 * 4. Update display
 * 5. Update statistics
 */
async function loadTimeSlots() {
  try {
    const response = await fetch("/appointments/adminportal/availability");
    const data = await response.json();

    if (data.success) {
      timeSlots = [];
      const seenSlots = new Set(); // Prevent duplicates

      data.availabilities.forEach((day) => {
        if (day.timeSlots) {
          day.timeSlots.forEach((slot) => {
            const slotKey = `${slot.start}-${slot.end}`;
            if (!seenSlots.has(slotKey)) {
              timeSlots.push(slot);
              seenSlots.add(slotKey);
            }
          });
        }
      });

      // console.log("Loaded unique time slots:", timeSlots.length);
      updateTimeSlotsDisplay();
      updateStats();
    }
  } catch (error) {
    console.error("Error loading time slots:", error);
  }
}

// Update time slots display
function updateTimeSlotsDisplay() {
  const container = document.getElementById("timeSlotsGrid");

  if (timeSlots.length === 0) {
    container.innerHTML = '<div class="loading">No time slots configured</div>';
    return;
  }

  const uniqueSlots = [
    ...new Set(timeSlots.map((slot) => `${slot.start} - ${slot.end}`)),
  ];

  container.innerHTML = uniqueSlots
    .map(
      (slot) => `
        <div class="time-slot-item">
            <span>${slot}</span>
            <button class="remove-btn" data-slot="${slot}">×</button>
        </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  container.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const slotString = this.getAttribute("data-slot");
      removeTimeSlot(slotString);
    });
  });
}

// Add time slot
async function addTimeSlot() {
  const timeInput = document.getElementById("newTimeSlot");
  const timeValue = timeInput.value;

  if (!timeValue) {
    alert("Please enter a time");
    return;
  }

  // Convert time to 12-hour format
  const time = convertTo12Hour(timeValue);
  const endTime = getEndTime(timeValue);

  // console.log("Adding time slot:", {
  //   input: timeValue,
  //   start: time,
  //   end: endTime,
  // });

  const newSlot = {
    start: time,
    end: endTime,
  };

  // Add to time slots array
  timeSlots.push(newSlot);
  updateTimeSlotsDisplay();
  updateStats();

  // Clear input
  timeInput.value = "";

  // console.log("Added time slot:", newSlot);
}

// Remove time slot
async function removeTimeSlot(slotString) {
  if (confirm("Are you sure you want to remove this time slot?")) {
    // Parse the slot string to get start and end times
    const [startTime, endTime] = slotString.split(" - ");

    // Remove from time slots array
    timeSlots = timeSlots.filter(
      (slot) => !(slot.start === startTime && slot.end === endTime)
    );

    updateTimeSlotsDisplay();
    updateStats();

    // console.log(
    //   "Removed time slot:",
    //   slotString,
    //   "Remaining slots:",
    //   timeSlots
    // );
  }
}

/* ==========================================
   BLOCKED DATES TAB - FUNCTIONS
   ========================================== */

/**
 * LOAD BLOCKED DATES FROM SERVER
 *
 * Fetch all blocked dates and display them in the list.
 *
 * API: GET /appointments/adminportal/blocked-dates
 * Response: { success: true, blockedDates: [...] }
 *
 * Process:
 * 1. Fetch blocked dates from server
 * 2. Store in global variable
 * 3. Update blocked dates list display
 * 4. Update statistics
 */
async function loadBlockedDates() {
  try {
    // console.log("Loading blocked dates...");
    const response = await fetch("/appointments/adminportal/blocked-dates");
    const data = await response.json();
    // console.log("Blocked dates response:", data);

    if (data.success) {
      blockedDates = data.blockedDates;
      // console.log("Blocked dates loaded:", blockedDates);
      updateBlockedDatesDisplay();
      updateStats();
    }
  } catch (error) {
    console.error("Error loading blocked dates:", error);
  }
}

// Update blocked dates display
function updateBlockedDatesDisplay() {
  const container = document.getElementById("blockedDatesList");

  if (blockedDates.length === 0) {
    container.innerHTML = '<div class="loading">No blocked dates</div>';
    return;
  }

  container.innerHTML = blockedDates
    .map((date) => {
      // Handle dates in Pacific timezone
      let dateObj;
      const dateValue = date.date;

      // console.log(
      //   "Processing date:",
      //   dateValue,
      //   "Type:",
      //   typeof dateValue,
      //   "ID:",
      //   date._id
      // );

      if (typeof dateValue === "string") {
        // If it's a string like "2025-10-17", parse it correctly
        if (dateValue.includes("T")) {
          dateObj = new Date(dateValue);
        } else {
          // For dates without time, parse as Pacific timezone
          const [year, month, day] = dateValue.split("-").map(Number);
          dateObj = new Date(year, month - 1, day);
        }
      } else {
        // If it's already a Date object, extract the date part and create new date in Pacific
        const year = dateValue.getFullYear();
        const month = dateValue.getMonth();
        const day = dateValue.getDate();
        dateObj = new Date(year, month, day);
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.error("Invalid date:", dateValue);
        return `
                <div class="blocked-date-item error">
                    <span>Invalid Date (${dateValue})</span>
                    <button class="remove-btn" onclick="removeBlockedDate('${date._id}')" data-date-id="${date._id}">Remove</button>
                </div>
            `;
      }

      // Format date in Pacific timezone
      const dateStr = dateObj.toLocaleDateString("en-US", {
        timeZone: "America/Los_Angeles",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // console.log("Displaying date as:", dateStr, "from original:", dateValue);

      return `
            <div class="blocked-date-item">
                <span>${dateStr}</span>
                <button class="remove-btn" onclick="removeBlockedDate('${date._id}')" data-date-id="${date._id}">Remove</button>
            </div>
        `;
    })
    .join("");

  // Remove any existing event listeners to prevent duplicates
  const existingListener = container.getAttribute("data-listener-added");
  if (!existingListener) {
    // Add event delegation for remove buttons
    container.addEventListener("click", function (e) {
      if (e.target.classList.contains("remove-btn")) {
        const dateId = e.target.getAttribute("data-date-id");
        // console.log("Remove button clicked via delegation, ID:", dateId);
        removeBlockedDate(dateId);
      }
    });
    container.setAttribute("data-listener-added", "true");
  }
}

/**
 * BLOCK A SPECIFIC DATE
 *
 * Block a date so clients cannot book appointments on that day.
 * Immediately saves to database (no "Save Changes" needed).
 *
 * API: POST /appointments/adminportal/blocked-dates
 *
 * Process:
 * 1. Get selected date from date picker
 * 2. Validate date is selected
 * 3. Send POST request with CSRF token
 * 4. Reload blocked dates list
 * 5. Update statistics
 * 6. Clear date input
 *
 * Timezone: Handles Pacific timezone to prevent day shifts
 */
async function blockDate() {
  const dateInput = document.getElementById("blockDate");
  const selectedDate = dateInput.value;

  if (!selectedDate) {
    alert("Please select a date to block");
    return;
  }

  try {
    // console.log("Blocking date:", selectedDate);
    // console.log("Selected date type:", typeof selectedDate);

    const response = await fetch("/appointments/adminportal/blocked-dates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _csrf: csrfToken,
        date: selectedDate,
        reason: "Admin blocked",
      }),
    });

    const data = await response.json();
    // console.log("Block date response:", data);
    // console.log("Stored date in DB:", data.blockedDate?.date);

    if (data.success) {
      // Reload blocked dates
      loadBlockedDates();
      dateInput.value = "";
      // console.log("Date blocked successfully");
    } else {
      alert("Error blocking date: " + data.message);
    }
  } catch (error) {
    console.error("Error blocking date:", error);
    alert("Error blocking date: " + error.message);
  }
}

// Remove blocked date
async function removeBlockedDate(dateId) {
  // console.log("Attempting to remove blocked date with ID:", dateId);

  if (confirm("Are you sure you want to unblock this date?")) {
    try {
      // console.log("Sending DELETE request for date ID:", dateId);

      const response = await fetch(
        `/appointments/adminportal/blocked-dates/${dateId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _csrf: csrfToken,
          }),
        }
      );

      // console.log("Delete response status:", response.status);

      const data = await response.json();
      // console.log("Delete response data:", data);

      if (data.success) {
        loadBlockedDates();
        // console.log("Blocked date removed successfully:", dateId);
      } else {
        alert("Error removing blocked date: " + data.message);
      }
    } catch (error) {
      console.error("Error removing blocked date:", error);
      alert("Error removing blocked date: " + error.message);
    }
  }
}

/* ==========================================
   UPCOMING APPOINTMENTS SIDEBAR - FUNCTIONS
   ========================================== */

/**
 * LOAD APPOINTMENTS FROM SERVER
 *
 * Fetch all appointments and display upcoming ones in sidebar.
 *
 * API: GET /appointments/adminportal/appointments
 * Response: { success: true, appointments: [...] }
 *
 * Process:
 * 1. Fetch all appointments from server
 * 2. Filter for future, non-cancelled appointments
 * 3. Update sidebar display (max 5 appointments)
 * 4. Update statistics
 */
async function loadAppointments() {
  try {
    const response = await fetch("/appointments/adminportal/appointments");
    const data = await response.json();

    if (data.success) {
      appointments = data.appointments.filter(
        (apt) =>
          new Date(apt.appointmentDate) >= new Date() &&
          apt.status !== "cancelled"
      );
      updateAppointmentsDisplay();
      updateStats();
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
  }
}

// Update appointments display
function updateAppointmentsDisplay() {
  const container = document.getElementById("appointmentsList");

  if (appointments.length === 0) {
    container.innerHTML = '<div class="loading">No upcoming appointments</div>';
    return;
  }

  // Sort appointments by date
  const sortedAppointments = appointments.sort(
    (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
  );

  container.innerHTML = sortedAppointments
    .slice(0, 5)
    .map((appointment) => {
      // Parse date in local timezone to prevent day shift
      const dateObj = parseAppointmentDate(appointment.appointmentDate);

      const dateStr = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return `
            <div class="appointment-item">
                <button class="remove-btn" onclick="cancelAppointment('${appointment._id}')">×</button>
                <div class="appointment-name">${appointment.clientName}</div>
                <div class="appointment-email">${appointment.clientEmail}</div>
                <div class="appointment-details">
                    <div class="appointment-detail">
                        <span class="icon">📅</span>
                        <span>${dateStr}</span>
                    </div>
                    <div class="appointment-detail">
                        <span class="icon">🕐</span>
                        <span>${appointment.appointmentTime}</span>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

/**
 * CANCEL APPOINTMENT
 *
 * Change appointment status to 'cancelled'.
 * Updates database and Google Calendar.
 *
 * API: PUT /appointments/adminportal/appointments/:id/status
 *
 * Process:
 * 1. Show confirmation dialog
 * 2. Send PUT request with status='cancelled'
 * 3. Reload appointments list
 * 4. Update sidebar and statistics
 */
async function cancelAppointment(appointmentId) {
  if (confirm("Are you sure you want to cancel this appointment?")) {
    try {
      const response = await fetch(
        `/appointments/adminportal/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _csrf: csrfToken,
            status: "cancelled",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        loadAppointments();
        // console.log("Appointment cancelled");
      } else {
        alert("Error cancelling appointment: " + data.message);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Error cancelling appointment");
    }
  }
}

/* ==========================================
   STATISTICS DISPLAY
   ========================================== */

/**
 * UPDATE QUICK STATS
 *
 * Calculate and update the statistics displayed in sidebar.
 *
 * Metrics:
 * - Available Days: Count of checked day checkboxes
 * - Time Slots: Total number of time slots
 * - Blocked Dates: Count of blocked dates
 * - Appointments: Count of upcoming appointments
 *
 * Updates: Real-time when data changes
 */
function updateStats() {
  const checkedDays = Array.from(
    document.querySelectorAll('.day-option input[type="checkbox"]:checked')
  ).length;
  const uniqueSlots = [
    ...new Set(timeSlots.map((slot) => `${slot.start} - ${slot.end}`)),
  ].length;

  document.getElementById("availableDaysCount").textContent = checkedDays;
  document.getElementById("timeSlotsCount").textContent = uniqueSlots;
  document.getElementById("blockedDatesCount").textContent =
    blockedDates.length;
  document.getElementById("appointmentsCount").textContent =
    appointments.length;
}

/* ==========================================
   SAVE CHANGES - MAIN ACTION
   ========================================== */

/**
 * SAVE ALL CHANGES TO DATABASE
 *
 * Saves weekly availability and time slot changes when "Save Changes" clicked.
 *
 * Process:
 * 1. Get all checked day checkboxes
 * 2. For each checked day:
 *    - Send POST request with time slots (max 10 per request)
 *    - Update database with availability settings
 * 3. Use Promise.all for parallel processing
 * 4. Reload data after all saves complete
 * 5. Show success/error message
 *
 * API: POST /appointments/adminportal/availability
 * Request Body: { dayOfWeek, timeSlots, isActive, _csrf }
 *
 * Optimizations:
 * - Limits time slots to 10 per request to prevent "413 Payload Too Large"
 * - Parallel requests for faster saving
 * - Detailed logging for debugging
 */
async function saveAllChanges() {
  const checkedDays = Array.from(
    document.querySelectorAll('.day-option input[type="checkbox"]:checked')
  ).map((checkbox) => parseInt(checkbox.getAttribute("data-day")));

  try {
    // Optimize: Only send requests for days that actually need to be updated
    const requests = [];

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const isActive = checkedDays.includes(dayOfWeek);
      const dayTimeSlots = isActive ? timeSlots : [];

      // Only send minimal data to reduce payload size
      const requestData = {
        _csrf: csrfToken,
        dayOfWeek: dayOfWeek,
        timeSlots: dayTimeSlots.slice(0, 10), // Limit to 10 slots max
        isActive: isActive,
      };

      // console.log(`Saving day ${dayOfWeek}:`, {
      //   dayOfWeek,
      //   slotCount: dayTimeSlots.length,
      //   isActive,
      //   payloadSize: JSON.stringify(requestData).length,
      // });

      requests.push(
        fetch("/appointments/adminportal/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        })
      );
    }

    // Execute all requests in parallel for better performance
    const responses = await Promise.all(requests);

    // Check all responses
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const dayOfWeek = i;

      // console.log(`Day ${dayOfWeek} response status:`, response.status);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error(`Day ${dayOfWeek} non-JSON response:`, responseText);
        throw new Error(
          `Server returned non-JSON response for day ${dayOfWeek}: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      // console.log(`Day ${dayOfWeek} response:`, responseData);

      if (!response.ok) {
        throw new Error(
          `Failed to save day ${dayOfWeek}: ${
            responseData.message || response.statusText
          }`
        );
      }
    }

    alert("All changes saved successfully!");
    // console.log("All changes saved");

    // Reload data to reflect changes
    loadAllData();
  } catch (error) {
    console.error("Error saving changes:", error);
    alert("Error saving changes: " + error.message);
  }
}

// Load all data
function loadAllData() {
  loadAdminAvailability();
  loadTimeSlots();
  loadBlockedDates();
  loadAppointments();
}

// Utility functions
function convertTo12Hour(time24) {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getEndTime(time24) {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const minute = parseInt(minutes);

  // Add 30 minutes
  let endMinute = minute + 30;
  let endHour = hour;

  // Handle minute overflow
  if (endMinute >= 60) {
    endMinute -= 60;
    endHour += 1;
  }

  // Handle hour overflow
  if (endHour >= 24) {
    endHour = 23;
    endMinute = 59;
  }

  const endMinuteStr = endMinute.toString().padStart(2, "0");

  return convertTo12Hour(`${endHour}:${endMinuteStr}`);
}

/* ==========================================
   HELPER FUNCTIONS
   ========================================== */

/**
 * PARSE APPOINTMENT DATE
 *
 * Parse appointment date in local timezone to prevent day shift.
 *
 * Problem:
 * - new Date("2025-10-13") interprets as UTC midnight
 * - Pacific timezone conversion shifts to previous day
 *
 * Solution:
 * - Parse date string components
 * - Create Date object in local timezone
 * - Ensures October 13 stays October 13
 *
 * @param {string|Date} dateValue - Date from MongoDB or string
 * @returns {Date} - Date object in local timezone
 */
function parseAppointmentDate(dateValue) {
  if (typeof dateValue === "string" && dateValue.includes("-")) {
    // Parse ISO string or YYYY-MM-DD format in local timezone
    const [year, month, day] = dateValue.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
  } else {
    return new Date(dateValue);
  }
}

// ==========================================
// ALL APPOINTMENTS TAB FUNCTIONALITY
// ==========================================

let allAppointmentsData = [];
let currentFilter = "all";

// Load all appointments (including past and cancelled)
async function loadAllAppointments() {
  try {
    const response = await fetch("/appointments/adminportal/appointments");
    const data = await response.json();

    if (data.success) {
      allAppointmentsData = data.appointments;
      updateAllAppointmentsTable();
    }
  } catch (error) {
    console.error("Error loading all appointments:", error);
    document.getElementById("allAppointmentsTableBody").innerHTML = `
            <tr><td colspan="7" class="loading-cell">Error loading appointments</td></tr>
        `;
  }
}

// Filter appointments based on current filter
function getFilteredAppointments() {
  const now = new Date();

  switch (currentFilter) {
    case "upcoming":
      return allAppointmentsData.filter(
        (apt) =>
          new Date(apt.appointmentDate) >= now && apt.status !== "cancelled"
      );
    case "past":
      return allAppointmentsData.filter(
        (apt) =>
          new Date(apt.appointmentDate) < now && apt.status !== "cancelled"
      );
    case "cancelled":
      return allAppointmentsData.filter((apt) => apt.status === "cancelled");
    case "all":
    default:
      return allAppointmentsData;
  }
}

// Update the appointments table
function updateAllAppointmentsTable() {
  const tbody = document.getElementById("allAppointmentsTableBody");
  const filtered = getFilteredAppointments();

  if (filtered.length === 0) {
    tbody.innerHTML = `
            <tr><td colspan="7" class="loading-cell">No appointments found</td></tr>
        `;
    return;
  }

  // Sort by date (most recent first)
  const sorted = filtered.sort(
    (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)
  );

  tbody.innerHTML = sorted
    .map((apt) => {
      // Parse date in local timezone to prevent day shift
      const dateObj = parseAppointmentDate(apt.appointmentDate);

      const dateStr = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return `
            <tr>
                <td>${apt.clientName}</td>
                <td>${apt.clientEmail}</td>
                <td>${apt.clientPhone}</td>
                <td>${dateStr}</td>
                <td>${apt.appointmentTime}</td>
                <td><span class="status-badge ${apt.status}">${
        apt.status
      }</span></td>
                <td>
                    <div class="action-buttons">
                        <select class="status-dropdown" data-id="${
                          apt._id
                        }" data-current="${apt.status}">
                            <option value="">Change Status...</option>
                            <option value="pending" ${
                              apt.status === "pending" ? "selected" : ""
                            }>Pending</option>
                            <option value="confirmed" ${
                              apt.status === "confirmed" ? "selected" : ""
                            }>Confirmed</option>
                            <option value="completed" ${
                              apt.status === "completed" ? "selected" : ""
                            }>Completed</option>
                            <option value="cancelled" ${
                              apt.status === "cancelled" ? "selected" : ""
                            }>Cancelled</option>
                        </select>
                        <button class="action-btn delete" data-id="${
                          apt._id
                        }">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");

  // Add event listeners for status dropdowns
  document.querySelectorAll(".status-dropdown").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const appointmentId = e.target.dataset.id;
      const newStatus = e.target.value;
      const currentStatus = e.target.dataset.current;

      if (newStatus && newStatus !== currentStatus) {
        await updateAppointmentStatus(appointmentId, newStatus);
      }
    });
  });

  // Add event listeners for delete buttons
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const appointmentId = e.target.dataset.id;
      await deleteAppointmentPermanently(appointmentId);
    });
  });
}

/**
 * UPDATE APPOINTMENT STATUS
 *
 * Change the status of an existing appointment.
 * Syncs with Google Calendar.
 *
 * API: PUT /appointments/adminportal/appointments/:id/status
 *
 * Process:
 * 1. Show confirmation dialog
 * 2. Send PUT request with new status and CSRF token
 * 3. Update database and Google Calendar
 * 4. Reload appointments table and sidebar
 * 5. Show success/error message
 *
 * @param {string} appointmentId - MongoDB ObjectId of appointment
 * @param {string} newStatus - New status (pending|confirmed|cancelled|completed)
 */
async function updateAppointmentStatus(appointmentId, newStatus) {
  if (
    !confirm(`Are you sure you want to change the status to "${newStatus}"?`)
  ) {
    updateAllAppointmentsTable(); // Reset dropdown to original value
    return;
  }

  try {
    const response = await fetch(
      `/appointments/adminportal/appointments/${appointmentId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _csrf: csrfToken,
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      // console.log("Appointment status updated:", newStatus);
      // Reload all data to reflect changes
      await loadAllAppointments();
      await loadAppointments();
    } else {
      alert("Error updating status: " + data.message);
      updateAllAppointmentsTable();
    }
  } catch (error) {
    console.error("Error updating appointment status:", error);
    alert("Error updating status. Please try again.");
    updateAllAppointmentsTable();
  }
}

/**
 * DELETE APPOINTMENT PERMANENTLY
 *
 * Permanently remove appointment from database and Google Calendar.
 * This action cannot be undone.
 *
 * API: DELETE /appointments/adminportal/appointments/:id
 *
 * Process:
 * 1. Show confirmation dialog with warning
 * 2. Send DELETE request with CSRF token
 * 3. Remove from database
 * 4. Delete from Google Calendar
 * 5. Reload appointments table and sidebar
 *
 * @param {string} appointmentId - MongoDB ObjectId of appointment
 */
async function deleteAppointmentPermanently(appointmentId) {
  if (
    !confirm(
      "Are you sure you want to PERMANENTLY DELETE this appointment? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `/appointments/adminportal/appointments/${appointmentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _csrf: csrfToken,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      // console.log("Appointment deleted permanently");
      // Reload all data to reflect deletion
      await loadAllAppointments();
      await loadAppointments();
    } else {
      alert("Error deleting appointment: " + data.message);
    }
  } catch (error) {
    console.error("Error deleting appointment:", error);
    alert("Error deleting appointment. Please try again.");
  }
}

/* ==========================================
   EVENT LISTENERS - ALL APPOINTMENTS TAB
   ========================================== */

// Filter change listeners (All, Upcoming, Past, Cancelled)
document
  .querySelectorAll('input[name="appointmentFilter"]')
  .forEach((radio) => {
    radio.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      updateAllAppointmentsTable(); // Refilter and redisplay table
    });
  });

// Load appointments when "All Appointments" tab is clicked
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab === "all-appointments") {
      loadAllAppointments(); // Fetch and display all appointments
    }
  });
});

// Zoom integration state
let zoomConnected = false;

/**
 * Render the Zoom integration UI in the "App Integration" tab.
 *
 * Expects these elements to exist in the HTML:
 * - #zoomStatusText (span that shows "Connected"/"Disconnected")
 * - #zoomToggleBtn (button that reads "Connect"/"Disconnect")
 * - #zoomSettingsLink (the Manage link)
 * - #zoomIntegrationCard (wrapper for styling)
 */
function renderZoomIntegration() {
  const statusEl = document.getElementById("zoomStatusText");
  const toggleBtn = document.getElementById("zoomToggleBtn");
  const manageLink = document.getElementById("zoomSettingsLink");
  const cardEl = document.getElementById("zoomIntegrationCard");

  if (!statusEl || !toggleBtn || !manageLink || !cardEl) {
    return;
  }

  if (zoomConnected) {
    statusEl.textContent = "Connected";
    statusEl.classList.remove("disconnected");
    statusEl.classList.add("connected");

    toggleBtn.textContent = "Disconnect";
    toggleBtn.classList.remove("danger", "primary");
    toggleBtn.classList.add("danger");
    toggleBtn.setAttribute("data-status", "connected");

    manageLink.style.display = "inline-block";

    cardEl.classList.add("connected");
  } else {
    statusEl.textContent = "Disconnected";
    statusEl.classList.remove("connected");
    statusEl.classList.add("disconnected");

    toggleBtn.textContent = "Connect";
    toggleBtn.classList.remove("danger", "primary");
    toggleBtn.classList.add("primary");
    toggleBtn.setAttribute("data-status", "disconnected");

    manageLink.style.display = "none";

    cardEl.classList.remove("connected");
  }
}

/**
 * Ask backend for current Zoom connection state.
 */
async function loadZoomIntegrationState() {
  try {
    const resp = await fetch("/zoom/status", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      // backend gives us { success: true, connected: boolean }
      zoomConnected = !!data.connected;
    } else {
      console.warn("Failed to load zoom status:", resp.status);
      zoomConnected = false;
    }
  } catch (err) {
    console.error("Error loading Zoom integration state:", err);
    zoomConnected = false;
  }

  renderZoomIntegration();
}

/**
 * Toggle Zoom connect/disconnect when the button is clicked.
 *
 * If currently disconnected:
 *   - POST /zoom/connect
 * If currently connected:
 *   - POST /zoom/disconnect
 *
 * Both requests should include CSRF if required by server.
 */
async function toggleZoomIntegration() {
  const toggleBtn = document.getElementById("zoomToggleBtn");
  if (!toggleBtn) return;

  const currentStatus = toggleBtn.getAttribute("data-status"); // 'connected' or 'disconnected'

  try {
    if (currentStatus === "connected") {
      // disconnect flow
      const resp = await fetch("/zoom/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({}),
      });

      if (resp.ok) {
        const data = await resp.json();
        zoomConnected = !!data.connected; // should be false
      } else {
        console.error("Disconnect failed:", resp.status);
      }
    } else {
      // connect flow
      const resp = await fetch("/zoom/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({}),
      });

      if (resp.ok) {
        const data = await resp.json();
        zoomConnected = !!data.connected; // should be true
      } else {
        console.error("Connect failed:", resp.status);
      }
    }
  } catch (err) {
    console.error("Zoom toggle error:", err);
  }

  renderZoomIntegration();
}

/* ==========================================
   GLOBAL FUNCTION EXPORTS
   ========================================== */
/*
   Make functions available globally so they can be called from:
   - Inline onclick handlers in dynamically generated HTML
   - Browser console for debugging
   - Other scripts if needed
*/
window.removeTimeSlot = removeTimeSlot;
window.removeBlockedDate = removeBlockedDate;
window.cancelAppointment = cancelAppointment;
window.updateAppointmentStatus = updateAppointmentStatus;
window.deleteAppointmentPermanently = deleteAppointmentPermanently;
