const CarouselSlide = require('../models/carouselSlide');
const fs = require('fs');
const path = require('path');

const getCarouselManagement = async(req, res) => {
    const slides = await CarouselSlide.find().sort({createdAt: -1});
    res.render('carouselmanagement', {slides});
};

const getEditSlideView = async(req, res) => {
    const slide = await CarouselSlide.findById(req.params.id);
    res.render('editslide', {slide});
};

const createSlide = async(req, res) => {
    const {title, description, buttonText, buttonUrl, imageOption, imageUrl} = req.body;

    let imagePath = imageUrl;
    if(imageOption === 'upload' && req.file) {
        imagePath = `/images/uploads/${req.file.filename}`;
    }
    else if (imageOption === 'url' && imageUrl){
        imagePath = imageUrl;
    }
    else{
        imagePath = 'images/default-fallback.jpg';
    }

    await CarouselSlide.create ({
        title,
        description,
        buttonText,
        buttonUrl,
        imageUrl: imagePath
    });

    res.redirect('/adminportal/carouselmanagement');
};

const deleteSlide = async(req, res) => {
    const id = req.params.id;
    /*
    Look up the slide first.
    If its imageUrl starts with /images/uploads/ and isn't the default image, 
        compute the absolute path under public/ and fs.unlink it.
    Then delete the slide doc.
    Errors are logged but won’t block the redirect.
    This only deletes files that were uploaded to public/images/uploads/. 
    External URLs and the default fallback are ignored.
    */
    try {
        const slide = await CarouselSlide.findById(id);
        if (slide && slide.imageUrl) {
            // Only delete local uploaded files (not external URLs or default image)
            const isLocalUpload = slide.imageUrl.startsWith('/images/uploads/');
            const isDefault = slide.imageUrl.includes('default-fallback');
            if (isLocalUpload && !isDefault) {
                const absolutePath = path.join(__dirname, '..', 'public', slide.imageUrl.replace(/^\//, ''));
                try {
                    await fs.promises.unlink(absolutePath);
                } catch (err) {
                    if (err && err.code !== 'ENOENT') {
                        console.error('Failed to remove slide image:', absolutePath, err.message);
                    }
                }
            }
        }
        await CarouselSlide.findByIdAndDelete(id);
    } catch (err) {
        console.error('Error deleting slide:', err.message);
    }
    res.redirect('/adminportal/carouselmanagement');
};

const editSlide = async (req, res) => {
    const { title, description, buttonText, buttonUrl, imageOption, imageUrl } = req.body;
    let imagePath = imageUrl;

    try {
      const existing = await CarouselSlide.findById(req.params.id);
      const hadLocalUpload = existing && existing.imageUrl && existing.imageUrl.startsWith('/images/uploads/') && !existing.imageUrl.includes('default-fallback');

      if (imageOption === 'upload' && req.file) {
        imagePath = `/images/uploads/${req.file.filename}`;
        if (hadLocalUpload) {
          const oldAbs = path.join(__dirname, '..', 'public', existing.imageUrl.replace(/^\//, ''));
          try { await fs.promises.unlink(oldAbs); } catch (err) { if (err.code !== 'ENOENT') console.error('Failed to remove old slide image:', oldAbs, err.message); }
        }
      } else if (imageOption === 'url' && imageUrl && hadLocalUpload) {
        const oldAbs = path.join(__dirname, '..', 'public', existing.imageUrl.replace(/^\//, ''));
        try { await fs.promises.unlink(oldAbs); } catch (err) { if (err.code !== 'ENOENT') console.error('Failed to remove old slide image:', oldAbs, err.message); }
      }

      await CarouselSlide.findByIdAndUpdate(req.params.id, {
        title,
        description,
        buttonText,
        buttonUrl,
        imageUrl: imagePath
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