/**
 * Edit Slide Form Handling
 * 
 * This script handles the interactive functionality for the carousel slide editing form.
 * It manages the visibility of different input sections based on user selection and
 * provides live image preview when uploading new images.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get references to the radio buttons for image source selection
  const keepRadio = document.getElementById('keepOption');
  const uploadRadio = document.getElementById('uploadOption');
  const urlRadio = document.getElementById('urlOption');
  
  // Get references to the input elements
  const uploadInput = document.getElementById('imageUpload');
  const urlInput = document.getElementById('imageUrl');
  
  // Get references to the parent divs containing each input section
  // This allows us to show/hide entire sections instead of individual inputs
  const uploadSection = uploadInput ? uploadInput.closest('div') : null;
  const urlSection = urlInput ? urlInput.closest('div') : null;
  
  /**
   * Updates the visibility of input sections based on selected radio button
   * - When "Keep Current Image" is selected: hides both upload and URL sections
   * - When "Upload New Image" is selected: shows file input, hides URL input
   * - When "From URL" is selected: shows URL input, hides file input
   */
  function updateInputs() {
    if (keepRadio && keepRadio.checked) {
      // Hide both upload and URL sections when keeping current image
      if (uploadSection) uploadSection.style.display = 'none';
      if (urlSection) urlSection.style.display = 'none';
    } else if (uploadRadio && uploadRadio.checked) {
      // Show upload section, hide URL section
      if (uploadSection) uploadSection.style.display = 'block';
      if (urlSection) urlSection.style.display = 'none';
    } else if (urlRadio && urlRadio.checked) {
      // Show URL section, hide upload section
      if (uploadSection) uploadSection.style.display = 'none';
      if (urlSection) urlSection.style.display = 'block';
    }
  }
  
  // Add event listeners to radio buttons to trigger section visibility changes
  if (keepRadio) keepRadio.addEventListener('change', updateInputs);
  if (uploadRadio) uploadRadio.addEventListener('change', updateInputs);
  if (urlRadio) urlRadio.addEventListener('change', updateInputs);
  
  // Set initial state based on which radio button is checked by default
  updateInputs();
  
  /**
   * Live Image Preview Functionality
   * 
   * When user selects a new image file, this displays a preview of the image
   * in the current image display area before the form is submitted.
   */
  if (uploadInput) {
    uploadInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      // Check if a file was selected and it's an image
      if (file && file.type.startsWith('image/')) {
        // Create a FileReader to read the file as a data URL
        const reader = new FileReader();
        
        // When the file is loaded, update the preview image
        reader.onload = function(e) {
          const preview = document.querySelector('.slide-img');
          if (preview) {
            // Replace the current image source with the new file data
            preview.src = e.target.result;
          }
        };
        
        // Read the file as a data URL (base64 encoded)
        reader.readAsDataURL(file);
      }
    });
  }
});

