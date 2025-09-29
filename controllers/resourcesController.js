const ResourcesImage = require('../models/resourcesImage');
const ResourcesText = require('../models/resourcesText');

// show all resource images
const getResourcesManagement = async (req, res) => {
  try {
    const resources = await ResourcesImage.find().sort({ createdAt: -1 });
    const resourcesText = await getOrCreateResourcesText();

    res.render('resourcesmanagement', { 
      resources,
      resourcesText,
      layout: false,
      error: req.query.error
    });
  } catch (err) {
    console.error("Error loading resources management:", err);
    res.status(500).send("Error loading resources management");
  }
};


// show text or create default text 
async function getOrCreateResourcesText() {
  let text = await ResourcesText.findOne();
  if (!text) {
    text = await ResourcesText.create({
      title: "Resources",
      paragraphs: [
        "Welcome to our treasure trove of free resources where the possibilities are as boundless as your imagination!"
      ],
      videoUrl: "https://youtu.be/LKa0ABbkGrQ"
    });
  }
  return text;
}

// helper: normalize to embed url
function normalizeYouTubeUrl(url) {
  if (!url) return null;

  // Convert youtu.be short links
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  // Convert normal youtube.com/watch?v= links
  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url; // fallback if already embed format
}

// update text 
const updateResourcesText = async (req, res) => {
  try {
    // console.log("REQ TEXT BODY:", req.body);

    const { title, paragraphs, videoUrl } = req.body;
    let text = await ResourcesText.findOne();

    const normalizedVideoUrl = normalizeYouTubeUrl(videoUrl) 
      || "https://www.youtube.com/embed/LKa0ABbkGrQ"; // fallback

    if (!text) {
      text = new ResourcesText({ 
        title, 
        paragraphs: Array.isArray(paragraphs) ? paragraphs.filter(p => p.trim() !== "") : [],
        videoUrl: normalizedVideoUrl
      });
    } else {
      text.title = title;
      text.paragraphs = Array.isArray(paragraphs) ? paragraphs.filter(p => p.trim() !== "") : [];
      text.videoUrl = normalizedVideoUrl;
      text.updatedAt = Date.now();
    }

    await text.save();
    res.send(`
      <script>
        window.top.location.href = '/content-management';
      </script>
    `);
  } catch (err) {
    console.error("Error updating resources text:", err);
    res.status(500).send("Error updating resources text");
  }
};


// add new resource image
const createResourcesImage = async (req, res) => {
  const { imageOption, imageUrl, overlayText, buttonText, buttonUrl } = req.body;

  // check how many resources exist. can only have max 3
  const count = await ResourcesImage.countDocuments();
  if (count >= 3) {
    return res.redirect('/adminportal/resourcesmanagement?error=max');
  }

  let imagePath = imageUrl;
  if (imageOption === 'upload' && req.file) {
    imagePath = `/images/uploads/${req.file.filename}`;
  } else if (!imageUrl) {
    imagePath = '/images/default-fallback.jpg';
  }

  await ResourcesImage.create({
    imageUrl: imagePath,
    overlayText,
    buttonText,
    buttonUrl
  });

  res.send(`
  <script>
    window.top.location.href = '/content-management';
  </script>
  `);
};

// delete resource image
const deleteResourcesImage = async (req, res) => {
  const id = req.params.id;
  await ResourcesImage.findByIdAndDelete(id);
  res.send(`
  <script>
    window.top.location.href = '/content-management';
  </script>
  `);
};

// edit resource image page
const getEditResourcesImageView = async (req, res) => {
  const resource = await ResourcesImage.findById(req.params.id);
  res.render('editresourcesimage', { 
    resource,
    layout: false
  });
};

// update resource image
const editResourcesImage = async (req, res) => {
  try {
    // debug logs 
    // console.log("REQ BODY:", req.body);
    // console.log("REQ FILE:", req.file);

    // const { overlayText, buttonText, buttonUrl } = req.body;
    const { overlayText, buttonText, buttonUrl } = req.body || {};
    let { imageOption, imageUrl } = req.body || {};

    const updateData = {
      overlayText,
      buttonText,
      buttonUrl
    };

    // only update image if admin provided one
    if (imageOption === 'upload' && req.file) {
      updateData.imageUrl = `/images/uploads/${req.file.filename}`;
    } else if (imageOption === 'url' && imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // otherwise, imageUrl stays the same

    await ResourcesImage.findByIdAndUpdate(req.params.id, updateData);
    res.send(`
    <script>
      window.top.location.href = '/content-management';
    </script>
    `);
  } catch (err) {
    console.error("Error editing resource image:", err);
    res.status(500).send("Error editing resource image");
  }
};

module.exports = {
  getResourcesManagement,
  getOrCreateResourcesText,
  updateResourcesText,
  createResourcesImage,
  deleteResourcesImage,
  getEditResourcesImageView,
  editResourcesImage
};