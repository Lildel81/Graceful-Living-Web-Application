document.addEventListener('DOMContentLoaded', function() {
const form = document.getElementById('getting-to-know-you-form');

// Handle "Other" option for experience
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

// Handle "Other" option for challenges
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

// Handle "None of the above" exclusivity for familiar with
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

// Form validation
form.addEventListener('submit', function(e) {
    // Check if at least one checkbox is selected for "familiar with"
    const familiarWithChecked = document.querySelectorAll('input[name="familiarWith"]:checked');
    if (familiarWithChecked.length === 0) {
    e.preventDefault();
    alert('Please select at least one option for "Which of the following are you familiar with?"');
    return;
    }

    // Check if at least one checkbox is selected for "challenges"
    const challengesChecked = document.querySelectorAll('input[name="challenges"]:checked');
    if (challengesChecked.length === 0) {
    e.preventDefault();
    alert('Please select at least one option for "Are there specific challenges you\'re currently facing?"');
    return;
    }

    // Check if "Other" text fields are filled when their checkboxes are selected
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