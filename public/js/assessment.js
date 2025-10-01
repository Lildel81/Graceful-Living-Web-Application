const header = document.getElementById("chakraHeader");
const description = document.getElementById("chakraDescription");
const sections = document.querySelectorAll(".chakra-section");
const progressFill = document.getElementById('progressFill');
const heroSection = document.querySelector(".hero");
const totalSections = sections.length;
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
    currentSectionSpan.textContent = index + 1;
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

// next buttons
document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (current < sections.length - 1) {
            current++;
            showSection(current);
            window.scrollTo(0, 0);   // scroll to top on section change
        }
    });
});

// previous buttons
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
const familiarCheckboxes = document.querySelectorAll('input[name="familiarWith"]:not(#noneCheckbox)');

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
    // check if at least one checkbox is selected for "familiar with"
    const familiarWithChecked = document.querySelectorAll('input[name="familiarWith"]:checked');
    if (familiarWithChecked.length === 0) {
    e.preventDefault();
    alert('Please select at least one option for "Which of the following are you familiar with?"');
    return;
    }

    // check if at least one checkbox is selected for "challenges"
    const challengesChecked = document.querySelectorAll('input[name="challenges"]:checked');
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