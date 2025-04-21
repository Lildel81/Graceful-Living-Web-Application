const fs = require('fs');
const path = require('path');

// for file uploads 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const Client = require('../models/client'); 
const CarouselSlide = require('../models/carouselSlide');
const testimonials = require('../models/testimonialSchema');

const getHubView = async (req,res,next) => {
    res.render('hub');
};


const getHomeView = async (req, res, next) => {
    try {
      const slides = await CarouselSlide.find().sort({ order: 1 });
      //console.log("Slides from DB:", slides); //this is only for debugging
      res.render('home', { slides });
    } catch (error) {
      console.error('Error fetching slides:', error.message);
      res.render('home', { slides: [] }); // Fallback to empty array if error
    }
};
  

const getAssessmentView = async (req, res, next) => {
    res.render('assessment');
};

const getAdminPortalView = async(req, res, next) => {
    res.render('adminportal', {userName: "Needs something passed to this", upcomingSessions: "Needs something passed to this", notifications: "Needs something passed to this", recentActivities: "Needs something passed to this" });
};


const getGalleryView = async(req, res, next) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');

  // read the uploads folder
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.send('Error reading uploads.');

    // filter image formats
    const imgs = files.filter(f => f.match(/\.(jpg|jpeg|png|gif)$/));

    // renders the gallery page (header + footer) and passes the images array
    res.render('gallery', { images: imgs });
  });
};

const handleUpload = async(req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
      res.status(200).send('File uploaded successfully.');
};

const deleteImage  = async(req, res, next) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '../uploads', imageName);
      
    fs.unlink(imagePath, (err) => {
        if (err) {
            console.error('Error deleting image:', err);
            return res.status(500).send('Error deleting image.');
        }
        console.log(`Deleted image: ${imageName}`);
        res.status(200).send('Image deleted successfully.');
    });
};

const getContactView = async(req, res, next) => {
    res.render('contact');
};

const getResourcesView = async(req, res, next) =>{
    res.render('resources');
};

const getNotFoundView = async(req, res, next) => {
    res.render('notFound');
};

const getServicesView = async(req, res, next) => {
    res.render('services');
};

const getShopView = async(req, res, next) => {
    res.render('shop');
};

const getApplicationView = async(req, res, next) => {
    res.render('application',{successMessage: null});
};

const getReviewsView = async (req, res, next) => {
    try {
        const testimonialData = await testimonials.find({});
        res.render('reviews', { testimonials: testimonialData });
    } catch (err) {
        console.error('Failed to fetch testimonials:', err);
        res.status(500).send('Error retrieving testimonials');
    }
};

const getContentManagementView = (req, res) => {
    res.render('content');
};
module.exports = {
    
    getHubView,
    getHomeView,
    getAssessmentView,
    getGalleryView,
    handleUpload,
    deleteImage,
    getAdminPortalView,
    getContactView,
    getResourcesView,
    getNotFoundView,
    getServicesView,
    getShopView,
    getApplicationView,
    getReviewsView,
    getContentManagementView
};
