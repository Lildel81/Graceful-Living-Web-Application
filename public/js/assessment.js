const header = document.getElementById("chakraHeader");
const description = document.getElementById("chakraDescription");
const sections = document.querySelectorAll(".chakra-section");
const heroSection = document.querySelector(".hero");
let current = 0;

// map section IDs to chakra CSS classes
const chakraColorMap = {
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

function showSection(index) {
    sections.forEach((sec, i) => {
        sec.classList.toggle("active", i === index);
    });

    // update header and description
    const currentSection = sections[index];
    header.textContent = currentSection.dataset.title;
    description.textContent = currentSection.dataset.description;

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