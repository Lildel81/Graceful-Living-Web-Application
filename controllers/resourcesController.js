const ResourcesImage = require('../models/resourcesImage');

// show all resource images
const getResourcesManagement = async (req, res) => {
  const resources = await ResourcesImage.find().sort({ createdAt: -1 });
  res.render('resourcesmanagement', { 
    resources,
    layout: 'layout',
    error: req.query.error
  });
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

  res.redirect('/adminportal/resourcesmanagement');
};

// delete resource image
const deleteResourcesImage = async (req, res) => {
  const id = req.params.id;
  await ResourcesImage.findByIdAndDelete(id);
  res.redirect('/adminportal/resourcesmanagement');
};

// edit resource image page
const getEditResourcesImageView = async (req, res) => {
  const resource = await ResourcesImage.findById(req.params.id);
  res.render('editresourcesimage', { 
    resource,
    layout: 'layout'
  });
};

// update resource image
const editResourcesImage = async (req, res) => {
  const { imageOption, imageUrl, overlayText, buttonText, buttonUrl } = req.body;

  // build an update object with only the text fields
  const updateData = {
    overlayText,
    buttonText,
    buttonUrl
  };

  // only change the image if the admin provided one
  if (imageOption === 'upload' && req.file) {
    updateData.imageUrl = `/images/uploads/${req.file.filename}`;
  } else if (imageOption === 'url' && imageUrl) {
    updateData.imageUrl = imageUrl;
  }
  // otherwise, keep the existing imageUrl untouched

  await ResourcesImage.findByIdAndUpdate(req.params.id, updateData);

  res.redirect('/adminportal/resourcesmanagement');
};

module.exports = {
  getResourcesManagement,
  createResourcesImage,
  deleteResourcesImage,
  getEditResourcesImageView,
  editResourcesImage
};