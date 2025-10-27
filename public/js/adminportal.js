// get the button and subpage elements
const openBtn = document.getElementById('openResourcesBtn');
const closeBtn = document.getElementById('closeBtn');
const subpage = document.getElementById('subpage');


if (openBtn && subpage) {
    openBtn.addEventListener('click', function () {
      subpage.style.display = 'block';
    });
}


if (closeBtn && subpage) {
    closeBtn.addEventListener('click', function () {
      subpage.style.display = 'none';
    });
  }

// new js 

function toggleGallery() {
    const gallery = document.getElementById('gallerySection');
    gallery.style.display = gallery.style.display === 'none' ? 'block' : 'none';
}


document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
  
    if (uploadForm) {
      uploadForm.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const formData = new FormData(uploadForm);
  
        const res = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
  
        if (res.ok) {
          if (uploadStatus) uploadStatus.textContent = '✅ Upload successful!';
          uploadForm.reset();
        } else {
          if (uploadStatus) uploadStatus.textContent = '❌ Upload failed.';
        }
      });
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('gallerySection').addEventListener('click', async function (e) {
      if (e.target.classList.contains('delete-btn')) {
        const imageName = e.target.getAttribute('data-image');
  
        const res = await fetch(`/delete/${imageName}`, {
          method: 'DELETE',
        });
  
        if (res.ok) {
          e.target.closest('.image-item').remove();
        } else {
          alert('Failed to delete image');
        }
      }
    });
  });

  // Dani added for chakra assessment 
 document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("showTrendBtn");
  const iframe = document.getElementById("trendFrame");

  if (!btn || !iframe) return;

  const alreadyViewed = sessionStorage.getItem("trendViewed");

  if (alreadyViewed) {
    iframe.style.display = "block";
    iframe.src = "/adminportal/predict-chakra";
  }

  btn.addEventListener("click", () => {
    iframe.style.display = "block";
    iframe.src = "/adminportal/predict-chakra?t=" + Date.now();
    sessionStorage.setItem("trendViewed", "true");
  });
});

