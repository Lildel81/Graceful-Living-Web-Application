
// Manual navigation with next and previous arrow
const buttons = document.querySelectorAll("[data-carousel-button]");

buttons.forEach(button => {
  button.addEventListener("click", () => {
    const offset = button.dataset.carouselButton === "next" ? 1 : -1;
    const slides = button.closest("[data-carousel]").querySelector("[data-slides]");
    const slidesArray = Array.from(slides.querySelectorAll(".slide"));
    const activeSlide = slides.querySelector("[data-active]");

    let newIndex = slidesArray.indexOf(activeSlide) + offset;
    if (newIndex < 0) newIndex = slidesArray.length - 1;
    if (newIndex >= slidesArray.length) newIndex = 0;

    slidesArray[newIndex].dataset.active = true;
    delete activeSlide.dataset.active;

    updateRadioButtons(newIndex);
  });
});

// Auto slide functionality
let counter = 0;
const slides = document.querySelectorAll(".slide");
const totalSlides = slides.length;
const autoRadios = document.querySelectorAll('input[name="radio-btn"]');

function autoSlide() {
  counter++;
  if (counter >= totalSlides) counter = 0;
  moveToSlide(counter);
}

let slideInterval = setInterval(autoSlide, 5000); // Change every 5s

/*function moveToSlide(index) {
  slides.forEach(slide => delete slide.dataset.active);
  slides[index].dataset.active = true;

  updateRadioButtons(index);
}*/

// dani edited this bc it was causing issues with her adminportal.js delete-button
function moveToSlide(index) {
  if (!slides || !slides[index]) return; // prevent crash

  slides.forEach(slide => {
    if (slide && slide.dataset) delete slide.dataset.active;
  });

  slides[index].dataset.active = true;

  updateRadioButtons(index);
}

// Manual radio button functionality
autoRadios.forEach((radio, index) => {
  radio.addEventListener("click", () => {
    //clearInterval(slideInterval); // optional: stop auto on manual nav
    counter = index;
    moveToSlide(counter);
  });
});

// Update radio button UI
function updateRadioButtons(index) {
  autoRadios.forEach((radio, i) => {
    radio.checked = i === index;
  });
}