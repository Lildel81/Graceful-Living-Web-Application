document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("pre-app-screening-form");
  const ending1 = document.getElementById("ending-1");
  const ending2 = document.getElementById("ending-2");
  const ending3 = document.getElementById("ending-3");

  const symptomCheckboxes = document.querySelectorAll('input[name="symptoms"]');
  const noneCheckbox = document.getElementById("symptoms-none");

  const q2Fieldset = document.getElementById("q2-fieldset");
  const q3Fieldset = document.getElementById("q3-fieldset");
  const burnoutRadios = document.querySelectorAll('input[name="burnout"]');

  function getSelectedValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
  }

  function hideAllEndings() {
    if (ending1) ending1.style.display = "none";
    if (ending2) ending2.style.display = "none";
    if (ending3) ending3.style.display = "none";
  }

  function hideAllEndings() {
    ending1.style.display = "none";
    ending2.style.display = "none";
    ending3.style.display = "none";
  }

  function getSymptomsState() {
    const selectedSymptoms = Array.from(
      document.querySelectorAll('input[name="symptoms"]:checked')
    ).map((cb) => cb.value);

    const hasAnySelection = selectedSymptoms.length > 0;
    const hasOtherSymptoms = selectedSymptoms.some((v) => v !== "none");

    return { hasAnySelection, symptomsYes: hasOtherSymptoms };
  }

  // Display certain questions depending on logic 
  function updateQuestionVisibility() {
    const burnout = getSelectedValue("burnout");
    const { hasAnySelection, symptomsYes } = getSymptomsState();

    // hide Q2 & Q3
    if (!burnout) {
      q2Fieldset.classList.add("hidden");
      q3Fieldset.classList.add("hidden");
      return;
    }

    // Skip Q2, go straight to Q3
    if (burnout === "no") {
      q2Fieldset.classList.add("hidden");
      q3Fieldset.classList.remove("hidden");
      return;
    }

    // burnout === "yes"
    q2Fieldset.classList.remove("hidden");

    if (!hasAnySelection) {
      // Haven't answered Q2 yet dont show q3
      q3Fieldset.classList.add("hidden");
    } else if (symptomsYes) {
      // Any symptom checked go to app
      q3Fieldset.classList.add("hidden");
    } else {
      // no symptoms q3
      q3Fieldset.classList.remove("hidden");
    }
  }

  symptomCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb === noneCheckbox && cb.checked) {
        // If "None of the above" is checked, uncheck all others
        symptomCheckboxes.forEach((other) => {
          if (other !== noneCheckbox) other.checked = false;
        });
      } else if (cb !== noneCheckbox && cb.checked) {
        // If any symptom is checked, uncheck "None of the above"
        noneCheckbox.checked = false;
      }
      updateQuestionVisibility();
    });
  });

  burnoutRadios.forEach((radio) => {
    radio.addEventListener("change", updateQuestionVisibility);
  });

  updateQuestionVisibility();// first load 

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // stay on this page and decide what to show

    const burnout = getSelectedValue("burnout");
    const healthcare = getSelectedValue("healthcare");
    
    // Wait for symptoms response 
    const selectedSymptoms = Array.from(
      document.querySelectorAll('input[name="symptoms"]:checked')
    ).map((cb) => cb.value);

    const hasAnySelection = selectedSymptoms.length > 0;
    const hasNone = selectedSymptoms.includes("none");
    const hasOtherSymptoms = selectedSymptoms.some((v) => v !== "none");

    
    const symptomsYes = hasOtherSymptoms; 

    // Q1 required
    if (!burnout) {
      alert("Please answer question 1 about burnout.");
      return;
    }
    
    // show Q2 if Q1 is yes
    if (burnout === "yes" && !hasAnySelection) {
      alert("Please select at least one option for question 2.");
      return;
    }

    // only show Q3 if no burnout or no symptoms 
    if (burnout === "no" || (burnout === "yes" && !symptomsYes)) {
      if (!healthcare) {
        alert("Please answer question 3 about whether you are a healthcare worker.");
        return;
      }
    }


    hideAllEndings();
    form.style.display = "none";

    
    if (burnout === "yes" && symptomsYes) {
      // Ending 1: send to application
      ending1.style.display = "block";
      // reveal the header paragraph
      document.getElementById("hero-description").style.display = "block";
    } else {
      // No burnout OR burnout but no listed symptoms 
      if (healthcare === "yes") {
        // Ending 3: healthcare PDF
        ending3.style.display = "block";
      } else {
        // Ending 2: general PDF
        ending2.style.display = "block";
      }
    }
  });
});
