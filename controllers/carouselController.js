const CarouselSlide = require('../models/carouselSlide');
const path = require('path');
const putToS3 = require('../public/js/s3').putToS3;
const { upload } = require('../middleware/upload');


const getCarouselManagement = async(req, res) => {
    const slides = await CarouselSlide.find().sort({createdAt: -1});
    // dani: changed layout to false so header won't show in iframe since i changed order of app.us(carouselRoutes) in index.js
    res.render('carouselmanagement', {csrfToken: req.csrfToken(), slides, layout: false});
};

const getEditSlideView = async(req, res) => {
    const slide = await CarouselSlide.findById(req.params.id);
    res.render('editslide', {csrfToken: req.csrfToken(), slide, layout: false});
};


function safeFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const base = path.basename(originalname, ext).replace(/[^a-z0-9_\-]/gi, '_');
  return `${Date.now()}_${base}${ext}`;
}

  const createSlide = async (req, res) => {
  const { title, description, buttonText, buttonUrl, imageOption, imageUrl } = req.body;


    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    imagePath = publicUrl;



  if (imageOption === 'upload' && req.file) {
    const filename = safeFilename(req.file.originalname);
    const key = `carousel/${filename}`;

    await putToS3({
      key,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    // store as "s3:<key>" so MongoDB can hold either URL or s3 object reference
    imagePath = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } else if (imageOption === 'url' && imageUrl) {
    imagePath = imageUrl;
  } else {
    imagePath = 'images/default-fallback.jpg';
  }

  await CarouselSlide.create({
    title,
    description,
    buttonText,
    buttonUrl,
    imageUrl: imagePath,
  });

  res.redirect('/adminportal/carouselmanagement');
};


const { deleteFromS3, isS3Image, s3KeyFromImageUrl } = require("../public/js/s3");

const deleteSlide = async (req, res) => {
  const id = req.params.id;

  try {
    const slide = await CarouselSlide.findById(id);

    if (slide && slide.imageUrl) {
      const isDefault = slide.imageUrl.includes('default-fallback');

      // If it was an uploaded S3 image, delete it
      if (isS3Image(slide.imageUrl) && !isDefault) {
        const key = s3KeyFromImageUrl(slide.imageUrl);
        try {
          await deleteFromS3(key);
        } catch (err) {
          console.error('Failed to remove slide image from S3:', key, err.message);
        }
      }
    }

    await CarouselSlide.findByIdAndDelete(id);
  } catch (err) {
    console.error('Error deleting slide:', err.message);
  }

  res.redirect('/adminportal/carouselmanagement');
};


//const {isS3Image, s3KeyFromImageUrl } = require("../utils/s3");

const editSlide = async (req, res) => {
  const { title, description, buttonText, buttonUrl, imageOption, imageUrl } = req.body;

  try {
    const existing = await CarouselSlide.findById(req.params.id);

    const hadS3Upload =
      existing &&
      existing.imageUrl &&
      isS3Image(existing.imageUrl) &&
      !existing.imageUrl.includes('default-fallback');

    let imagePath = existing ? existing.imageUrl : 'images/default-fallback.jpg';

    if (imageOption === 'upload' && req.file) {
      // upload new
      const filename = safeFilename(req.file.originalname);
      const key = `carousel/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

    imagePath = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // delete old uploaded file if it exists
      if (hadS3Upload) {
        const oldKey = s3KeyFromImageUrl(existing.imageUrl);
        try { await deleteFromS3(oldKey); }
        catch (err) { console.error('Failed to remove old slide image from S3:', oldKey, err.message); }
      }
    } else if (imageOption === 'url' && imageUrl) {
      imagePath = imageUrl;

      // if switching from upload to URL, delete old upload
      if (hadS3Upload) {
        const oldKey = s3KeyFromImageUrl(existing.imageUrl);
        try { await deleteFromS3(oldKey); }
        catch (err) { console.error('Failed to remove old slide image from S3:', oldKey, err.message); }
      }
    }

    await CarouselSlide.findByIdAndUpdate(req.params.id, {
      title,
      description,
      buttonText,
      buttonUrl,
      imageUrl: imagePath,
    });
  } catch (err) {
    console.error('Error updating slide:', err.message);
  }

  res.redirect('/adminportal/carouselmanagement');
};


module.exports = {
    getCarouselManagement,
    createSlide,
    deleteSlide,
    getEditSlideView,
    editSlide
};