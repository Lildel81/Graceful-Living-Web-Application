const { JSDOM } = require('jsdom');

describe('adminAutoFill', () => {
  let restoreRandom;
  let adminAutoFill;

  const html = `
    <header class="hero">
      <div class="container">
        <h1 id="chakraHeader"></h1>
        <p id="chakraDescription"></p>
        <div class="progress-bar"><div id="progressFill" class="progress-fill"></div></div>
        <p class="progress-text">Section <span id="currentSectionSpan">1</span></p>
      </div>
    </header>

    <main>
      <form id="assessment-form">
        <div class="chakra-section active" id="gettingToKnowYou" data-title="Intro" data-description="Desc">
          <!-- basic fields -->
          <label for="fullName">Full Name*</label>
          <input type="text" name="fullName" id="fullName" required />
          <label for="email">Email*</label>
          <input type="email" name="email" id="email" required />
          <label for="contactNumber">Contact*</label>
          <input type="tel" name="contactNumber" id="contactNumber" />
          <label for="jobTitle">Job Title*</label>
          <input type="text" name="jobTitle" id="jobTitle" />
          <textarea name="notes" id="notes"></textarea>

          <!-- experience (includes "other" + companion input) -->
          <fieldset>
            <legend>Experience*</legend>
            <label><input type="radio" name="experience" value="current" /></label>
            <label><input type="radio" name="experience" value="past" /></label>
            <label><input type="radio" name="experience" value="no" /></label>
            <label><input type="radio" name="experience" value="notSure" /></label>
            <label>
              <input type="radio" name="experience" value="other" id="experienceOther" data-other-input="#experienceOtherText" />
            </label>
            <input type="text" id="experienceOtherText" name="experienceOtherText" disabled />
          </fieldset>

          <!-- healthcare worker -->
          <fieldset>
            <legend>Healthcare Worker*</legend>
            <label><input type="radio" name="healthcareWorker" value="yes" /></label>
            <label><input type="radio" name="healthcareWorker" value="no" /></label>
          </fieldset>
          <input type="number" id="healthcareYears" name="healthcareYears" disabled />

          <!-- familiarWith + none checkbox (needed by assessment.js listeners) -->
          <fieldset id="familiarWithFieldset">
            <legend>Which of the following are you familiar with?*</legend>
            <label><input type="checkbox" name="familiarWith" value="kundalini" /></label>
            <label><input type="checkbox" name="familiarWith" value="soundBaths" /></label>
            <label><input type="checkbox" name="familiarWith" value="lifeCoaching" /></label>
            <label><input type="checkbox" name="familiarWith" value="eft" /></label>
            <label><input type="checkbox" name="familiarWith" value="none" id="noneCheckbox" /></label>
          </fieldset>

          <!-- challenges (includes "other" + companion) -->
          <fieldset id="challengesFieldset">
            <legend>Challenges*</legend>
            <label><input type="checkbox" name="challenges" value="physical" /></label>
            <label><input type="checkbox" name="challenges" value="emotional" /></label>
            <label><input type="checkbox" name="challenges" value="mental" /></label>
            <label><input type="checkbox" name="challenges" value="spiritual" /></label>
            <label>
              <input type="checkbox" id="challengesOther" name="challenges" value="other"
                     data-other-input="#challengeOtherText" />
            </label>
          </fieldset>
          <input type="text" id="challengeOtherText" name="challengeOtherText" disabled />

          <!-- a select -->
          <select id="region">
            <option value="">--</option>
            <option value="na">NA</option>
            <option value="eu">EU</option>
          </select>
        </div>

        <button type="button" id="autoFillChakraBtn">Auto Fill</button>
      </form>
    </main>

    <!-- validation modal used by the script -->
    <div id="validationModal" style="display:none;">
      <ul id="validationErrorList"></ul>
      <button class="validation-modal-close" type="button"></button>
      <button class="validation-modal-btn" type="button"></button>
    </div>
  `;

  beforeEach(() => {
    // Build DOM first
    const dom = new JSDOM(html, {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      runScripts: 'outside-only'
    });

    // Expose globals for the module we're about to import
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.CustomEvent = dom.window.CustomEvent;
    global.Event = dom.window.Event; // <-- IMPORTANT for jsdom Event validation
    window.scrollTo = jest.fn();

    // Deterministic randomness
    const orig = Math.random;
    jest.spyOn(Math, 'random').mockImplementation(() => 0);
    restoreRandom = () => (Math.random = orig);

    // Now import assessment.js (it reads the DOM immediately)
    ({ adminAutoFill } = require('../assessment'));

    // Fire DOMContentLoaded so listeners in the module attach
    document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (restoreRandom) restoreRandom();
    jest.resetModules();

    // Clean globals
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.CustomEvent;
    delete global.Event;
  });

  test('clicking the button triggers autofill and populates fields', () => {
    const btn = document.getElementById('autoFillChakraBtn');
    expect(btn).toBeTruthy();
    btn.click();

    // Text inputs / textarea
    expect(document.getElementById('fullName').value).toBe('Test User');
    expect(document.getElementById('email').value).toBe('test@test.com');
    expect(document.getElementById('contactNumber').value).toBe('(123) 456-7890');
    expect(document.getElementById('jobTitle').value).toBe('Test Job');
    expect(document.getElementById('notes').value).toBe('test');

    // Radios: healthcare "yes" should be selected (random=0 chooses first)
    const hcYes = document.querySelector('input[name="healthcareWorker"][value="yes"]');
    expect(hcYes.checked).toBe(true);

    // Years enabled and filled
    const years = document.getElementById('healthcareYears');
    expect(years.disabled).toBe(false);
    expect(String(years.value)).not.toBe('');

    // At least one challenge checked
    expect(!!document.querySelector('input[name="challenges"]:checked')).toBe(true);

    // Select non-empty
    const region = document.getElementById('region');
    expect(region.value).toBeTruthy();
  });

  test('when "experience: other" is randomly chosen the companion text is enabled and filled', () => {
    // Reorder the "experience" radios so "other" is the first option
    const fs = document.querySelector('fieldset legend').parentElement;
    fs.innerHTML = `
      <legend>Experience*</legend>
      <label><input type="radio" name="experience" value="other" id="experienceOther" data-other-input="#experienceOtherText" /></label>
      <label><input type="radio" name="experience" value="current" /></label>
      <label><input type="radio" name="experience" value="past" /></label>
      <label><input type="radio" name="experience" value="no" /></label>
      <label><input type="radio" name="experience" value="notSure" /></label>
      <input type="text" id="experienceOtherText" name="experienceOtherText" disabled />
    `;

    document.getElementById('autoFillChakraBtn').click();

    const expOther = document.getElementById('experienceOther');
    const expOtherText = document.getElementById('experienceOtherText');

    expect(expOther.checked).toBe(true);
    expect(expOtherText.disabled).toBe(false);
    expect(expOtherText.required).toBe(true);
    expect(expOtherText.value).toBe('Other test response');
  });
});
