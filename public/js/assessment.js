const header = document.getElementById("chakraHeader");
const description = document.getElementById("chakraDescription");
const sections = document.querySelectorAll(".chakra-section");
const progressFill = document.getElementById('progressFill');
const heroSection = document.querySelector(".hero");
const totalSections = sections.length;
const currentSectionSpan = document.getElementById('currentSectionSpan');
let current = 0;


// map section IDs to chakra CSS classes
const chakraColorMap = {
    'gettingToKnowYou': 'user-info',
    'rootChakra': 'chakra-root',
    'sacralChakra': 'chakra-sacral',
    'solarPlexusChakra': 'chakra-solar',
    'heartChakra': 'chakra-heart',
    'throatChakra': 'chakra-throat',
    'thirdEyeChakra': 'chakra-third-eye',
    'crownChakra': 'chakra-crown',
    'lifeQuadrantsIntro': 'life-quadrant',
    'healthWellness': 'life-quadrant',
    'loveRelationships': 'life-quadrant',
    'careerJob': 'life-quadrant',
    'timeMoney': 'life-quadrant'
};

// validation function to check if section is complete
function validateSection(sectionIndex) {
    const section = sections[sectionIndex];
    const errors = [];
    
    // check required text inputs (excluding disabled fields and conditional fields)
    const requiredInputs = section.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"]), textarea[required]');
    requiredInputs.forEach(input => {
        // Skip if disabled or if it's a conditional field that shouldn't be required
        if (input.disabled) return;
        
        // Skip healthcareYears unless healthcare worker is "yes"
        if (input.name === 'healthcareYears') {
            const healthcareYes = section.querySelector('input[name="healthcareWorker"][value="yes"]');
            if (!healthcareYes || !healthcareYes.checked) return;
        }
        
        // Skip experienceOtherText unless "other" is selected
        if (input.name === 'experienceOtherText') {
            const experienceOther = section.querySelector('input[name="experience"][value="other"]');
            if (!experienceOther || !experienceOther.checked) return;
        }
        
        // Skip challengeOtherText unless "other" is selected
        if (input.name === 'challengeOtherText') {
            const challengesOther = section.querySelector('input[name^="challenges"][value="other"]');
            if (!challengesOther || !challengesOther.checked) return;
        }
        
        if (!input.value.trim()) {
            const label = section.querySelector(`label[for="${input.id}"]`);
            const fieldName = label ? label.textContent.replace('*', '').trim().replace(/\s+/g, ' ') : 'A required field';
            errors.push(`${fieldName} is required`);
        }
    });
    
    // check required radio button groups
    const radioGroups = {};
    section.querySelectorAll('input[type="radio"]').forEach(radio => {
        const fieldset = radio.closest('fieldset');
        const legend = fieldset ? fieldset.querySelector('legend') : null;
        
        // Check if this is a required field (has * in legend OR has required attribute)
        const hasRequired = (legend && legend.textContent.includes('*')) || radio.hasAttribute('required');
        
        if (hasRequired || !legend || legend.textContent.trim() !== '') {
            // Group by name to check if at least one in the group is selected
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = {
                    radios: [],
                    legend: legend,
                    hasRequiredAttribute: radio.hasAttribute('required')
                };
            }
            radioGroups[radio.name].radios.push(radio);
        }
    });
    
    Object.entries(radioGroups).forEach(([groupName, group]) => {
        const isChecked = group.radios.some(radio => radio.checked);
        
        // Only validate if it has a required attribute on any radio in the group
        if (!isChecked && group.hasRequiredAttribute) {
            const fieldName = group.legend ? group.legend.textContent.replace('*', '').trim().replace(/\s+/g, ' ') : 'This question';
            errors.push(`Please select an option for: ${fieldName}`);
        }
    });
    
    // check required checkbox groups (at least one must be selected)
    const checkboxGroups = {};
    section.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const fieldset = checkbox.closest('fieldset');
        if (fieldset && fieldset.id) {
            const legend = fieldset.querySelector('legend');
            const hasRequired = legend && legend.textContent.includes('*');
            
            if (hasRequired) {
                if (!checkboxGroups[fieldset.id]) {
                    checkboxGroups[fieldset.id] = {
                        checkboxes: [],
                        legend: legend
                    };
                }
                checkboxGroups[fieldset.id].checkboxes.push(checkbox);
            }
        }
    });
    
    Object.entries(checkboxGroups).forEach(([groupId, group]) => {
        const isChecked = group.checkboxes.some(cb => cb.checked);
        if (!isChecked) {
            const fieldName = group.legend.textContent.replace('*', '').trim().replace(/\s+/g, ' ');
            errors.push(`Please select at least one option for: ${fieldName}`);
        }
    });
    
    // check conditional fields that should be filled when their condition is met
    // healthcare years - only required if "yes" is selected
    const healthcareYes = section.querySelector('input[name="healthcareWorker"][value="yes"]');
    if (healthcareYes && healthcareYes.checked) {
        const yearsInput = section.querySelector('input[name="healthcareYears"]');
        if (yearsInput && !yearsInput.value.trim()) {
            errors.push('Please specify how many years you have worked in healthcare');
        }
    }
    
    // experience other text - only required if "other" is selected
    const experienceOther = section.querySelector('input[name="experience"][value="other"]');
    if (experienceOther && experienceOther.checked) {
        const otherText = section.querySelector('input[name="experienceOtherText"]');
        if (otherText && !otherText.value.trim()) {
            errors.push('Please specify your other experience with healers');
        }
    }
    
    // challenges other text - only required if "other" is selected
    const challengesOther = section.querySelector('input[name="challenges"][value="other"]');
    if (challengesOther && challengesOther.checked) {
        const otherText = section.querySelector('input[name="challengeOtherText"]');
        if (otherText && !otherText.value.trim()) {
            errors.push('Please specify your other challenge');
        }
    }
    
    return errors;
}

// show validation errors in a modal
function showValidationErrors(errors) {
    if (errors.length === 0) return;
    
    const modal = document.getElementById('validationModal');
    const errorList = document.getElementById('validationErrorList');
    
    // Clear previous errors and populate new ones
    errorList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
    
    // Show modal
    modal.style.display = 'flex';
}

// Close modal function
function closeValidationModal() {
    const modal = document.getElementById('validationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Set up modal event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('validationModal');
    const closeBtn = modal.querySelector('.validation-modal-close');
    const gotItBtn = modal.querySelector('.validation-modal-btn');
    
    // Close button
    closeBtn.addEventListener('click', closeValidationModal);
    
    // Got it button
    gotItBtn.addEventListener('click', closeValidationModal);
    
    // Click outside modal to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeValidationModal();
        }
    });
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeValidationModal();
        }
    });
});

// updating current section display
function showSection(index) {
    sections.forEach((sec, i) => {
        sec.classList.toggle("active", i === index);
    });

    // update header and description
    const currentSection = sections[index];
    header.textContent = currentSection.dataset.title;
    description.textContent = currentSection.dataset.description;

    // update progress
    if (currentSectionSpan) currentSectionSpan.textContent = index + 1;
    const progressPercent = ((index + 1) / totalSections) * 100;
    progressFill.style.width = progressPercent + '%';

    // update hero background color based on current section
    const sectionId = currentSection.id;
    const chakraClass = chakraColorMap[sectionId];
    
    // remove all existing chakra classes
    Object.values(chakraColorMap).forEach(className => {
        heroSection.classList.remove(className);
    });
    
    // add the appropriate chakra class
    if (chakraClass) {
        heroSection.classList.add(chakraClass);
    }

    // show/hide buttons
    sections.forEach(sec => {
        const nextBtn = sec.querySelector(".next-btn");
        const prevBtn = sec.querySelector(".prev-btn");

        if (nextBtn) nextBtn.style.display = "inline-block";
        if (prevBtn) prevBtn.style.display = "inline-block";
    });

    const activeSection = sections[index];
    const nextBtn = activeSection.querySelector(".next-btn");
    const prevBtn = activeSection.querySelector(".prev-btn");

    if (index === 0 && prevBtn) prevBtn.style.display = "none"; // hide previous on first
    if (index === sections.length - 1 && nextBtn) nextBtn.style.display = "none"; // hide next on last
}

function fillOtherTextFor(control, fallbackText) {
  const sel = control.getAttribute('data-other-input');
  const otherInput = sel ? document.querySelector(sel) : null;
  if (otherInput) {
    otherInput.disabled = false;
    otherInput.required = true;
    if (!otherInput.value) otherInput.value = fallbackText;
  }
}

// next buttons with validation
document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // validate current section before moving forward
        const errors = validateSection(current);
        
        if (errors.length > 0) {
            showValidationErrors(errors);
            return;
        }
        
        if (current < sections.length - 1) {
            current++;
            showSection(current);
            window.scrollTo(0, 0);   // scroll to top on section change
        }
    });
});

// previous buttons (no validation needed when going back)
document.querySelectorAll(".prev-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (current > 0) {
            current--;
            showSection(current);
            window.scrollTo(0, 0); // scroll to top on section change
        }
    });
});

// show first section on load
showSection(current);

// form validation and interactivity
document.addEventListener('DOMContentLoaded', function() {
const form = document.getElementById('assessment-form');

// handle "other" option for experience
const experienceOtherRadio = document.getElementById('experienceOther');
const experienceOtherText = document.getElementById('experienceOtherText');

document.querySelectorAll('input[name="experience"]').forEach(radio => {
    radio.addEventListener('change', function() {
    if (this.value === 'other') {
        experienceOtherText.disabled = false;
        experienceOtherText.required = true;
        experienceOtherText.focus();
    } else {
        experienceOtherText.disabled = true;
        experienceOtherText.required = false;
        experienceOtherText.value = '';
    }
    });
});

// handle "other" option for challenges
const challengesOtherCheckbox = document.getElementById('challengesOther');
const challengeOtherText = document.getElementById('challengeOtherText');

challengesOtherCheckbox.addEventListener('change', function() {
    if (this.checked) {
    challengeOtherText.disabled = false;
    challengeOtherText.required = true;
    challengeOtherText.focus();
    } else {
    challengeOtherText.disabled = true;
    challengeOtherText.required = false;
    challengeOtherText.value = '';
    }
});

// handle "none of the above" exclusivity for familiar with
const noneCheckbox = document.getElementById('noneCheckbox');
const familiarCheckboxes = document.querySelectorAll('input[name^="familiarWith"]:not(#noneCheckbox)');

noneCheckbox.addEventListener('change', function() {
    if (this.checked) {
    familiarCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    }
});

familiarCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
    if (this.checked) {
        noneCheckbox.checked = false;
    }
    });
});

// form validation
form.addEventListener('submit', function(e) {
    // validate the final section
    const errors = validateSection(current);
    
    if (errors.length > 0) {
        e.preventDefault();
        showValidationErrors(errors);
        return;
    }
    
    // check if at least one checkbox is selected for "familiar with"
    const familiarWithChecked = document.querySelectorAll('input[name^="familiarWith"]:checked');
    if (familiarWithChecked.length === 0) {
    e.preventDefault();
    alert('Please select at least one option for "Which of the following are you familiar with?"');
    return;
    }

    // check if at least one checkbox is selected for "challenges"
    const challengesChecked = document.querySelectorAll('input[name^="challenges"]:checked');
    if (challengesChecked.length === 0) {
    e.preventDefault();
    alert('Please select at least one option for "Are there specific challenges you\'re currently facing?"');
    return;
    }

    // check if "Other" text fields are filled when their checkboxes are selected
    if (experienceOtherRadio.checked && !experienceOtherText.value.trim()) {
    e.preventDefault();
    alert('Please specify your "Other" experience with healers.');
    experienceOtherText.focus();
    return;
    }

    if (challengesOtherCheckbox.checked && !challengeOtherText.value.trim()) {
    e.preventDefault();
    alert('Please specify your "Other" challenge.');
    challengeOtherText.focus();
    return;
    }
});
});

// handle healthcare years input enable/disable
const healthcareRadios = document.querySelectorAll('input[name="healthcareWorker"]');
const healthcareYearsInput = document.getElementById('healthcareYears');

healthcareRadios.forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.value === 'yes') {
      healthcareYearsInput.disabled = false;
      healthcareYearsInput.required = true;
      healthcareYearsInput.focus();
    } else {
      healthcareYearsInput.disabled = true;
      healthcareYearsInput.required = false;
      healthcareYearsInput.value = ''; // clear if switching back to No
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("autoFillChakraBtn");
  if (btn) {
    btn.addEventListener("click", adminAutoFill);
  }
});

// auto-fill button for admin users
function adminAutoFill() {
  console.log("Admin autofill triggered");
  
  // --- 1. Fill text inputs and textareas (skip "Other" unless relevant) ---
  document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], textarea").forEach(input => {
    const name = input.name?.toLowerCase() || "";
    const id = input.id?.toLowerCase() || "";
    // Skip "other" text inputs for now; we'll handle them later
    if (name.includes("other") || id.includes("other")) return;
    // Fill in basic info fields
    if (name === "fullname") input.value = "Test User";
    else if (name === "email") input.value = "test@test.com";
    else if (name === "contactnumber") input.value = "(123) 456-7890";
    else if (name === "jobtitle") input.value = "Test Job";
    else if (!input.value) input.value = "test";
  });
  
  // --- 2. Randomly select one radio button per group ---
  const radioGroups = {};
  document.querySelectorAll("input[type='radio']").forEach(radio => {
    const name = radio.name || "ungrouped";
    if (!radioGroups[name]) radioGroups[name] = [];
    radioGroups[name].push(radio);
  });
  
  Object.values(radioGroups).forEach(group => {
    const random = group[Math.floor(Math.random() * group.length)];
    random.checked = true;
    
    // Trigger change event to enable conditional fields
    random.dispatchEvent(new Event('change', { bubbles: true }));
    
    // If "Other" selected, fill its input
    if ((random.value || '').toLowerCase() === "other") {
        fillOtherTextFor(random, "Other test response");
    }
    
    // If healthcareWorker = "yes", enable and fill random years (1–20)
    if (random.name === "healthcareWorker" && random.value.toLowerCase() === "yes") {
      const yearsInput = document.querySelector("input[name='healthcareYears']");
      if (yearsInput) {
        yearsInput.disabled = false;
        yearsInput.value = Math.floor(Math.random() * 20) + 1;
      }
    }
  });
  
  // --- 3. Handle checkbox groups (at least one per group) ---
  const checkboxGroups = {};
  document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
    const name = checkbox.name || checkbox.id || "ungrouped";
    if (!checkboxGroups[name]) checkboxGroups[name] = [];
    checkboxGroups[name].push(checkbox);
  });
  
  Object.values(checkboxGroups).forEach(group => {
    const numToCheck = Math.max(1, Math.floor(Math.random() * group.length) + 1);
    const shuffled = [...group].sort(() => 0.5 - Math.random());
    
    shuffled.slice(0, numToCheck).forEach(checkbox => {
      checkbox.checked = true;
      
      // Trigger change event
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Handle "Other" checkboxes
      if ((checkbox.value || '').toLowerCase() === "other") {
      fillOtherTextFor(checkbox, "Other test challenge");
      }
    });
  });
  
  // --- 4. Fill number inputs (but skip healthcareYears, handled above) ---
  document.querySelectorAll("input[type='number']").forEach(input => {
    if (input.name === "healthcareYears") return; // Skip, handled conditionally
    if (!input.value) input.value = Math.floor(Math.random() * 20) + 1;
  });
  
  // --- 5. Fill dropdowns/selects if they exist ---
  document.querySelectorAll("select").forEach(select => {
    const options = Array.from(select.options).filter(o => o.value);
    if (options.length > 0) {
      const random = options[Math.floor(Math.random() * options.length)];
      select.value = random.value;
    }
  });
  
  console.log("Admin autofill complete!");
}

module.exports = { adminAutoFill };