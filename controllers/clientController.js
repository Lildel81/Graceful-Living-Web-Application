const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const slides = [];
// for file uploads 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const Client = require('../models/client'); 
const CarouselSlide = require('../models/carouselSlide');
const testimonials = require('../models/testimonialSchema');
const ResourcesImage = require('../models/resourcesImage');

const getHubView = async (req,res,next) => {
    res.render('hub');
};


const getHomeView = async (req, res, next) => {
    try {
      const slides = await CarouselSlide.find().sort({ order: 1 });
  
      const allReviews = [{ name: "Vicki Carroll", quote: "This event was excellent. I loved everything about it!", image: "/images/review-face1.png" },
        { name: "Claire Larke", quote: "Very engaging, interesting and charismatic. The content really got us all thinking outside the box.", image: "/images/review-face2.png" },
        { name: "Alexea Takacs", quote: "The energy, wisdom and motivation the workshop gave me was what I liked most about the event.", image: "/images/review-face3.png" },
        { name: "Adanna Eke", quote: "I rate the event as excellent! I liked the partner activity the most. I would definitely recommend to a friend!", image: "/images/review-face1.png" },
        { name: "Shirley Brown", quote: "I really enjoyed the positiveness of the subject matter, the positiveness in the room and of the speaker.", image: "/images/review-face2.png" },
        { name: "Latoya Holmes-Green", quote: "I learned how to increase my energy vibration and redirect my thoughts to the outcomes I want. Shante is so nurturing and caring.", image: "/images/review-face3.png" },
        { name: "Sha D.", quote: "Shante has a nurturing energy which is of paramount importance when working toward health and wellness.", image: "/images/review-face1.png" },
        { name: "Amanda Chacon", quote: "Your examples always relate to something I’m dealing with. It’s refreshing and eye opening!", image: "/images/review-face2.png" },
        { name: "Philip Victor Rader", quote: "It was very interesting and enlightening. Thank you for helping me see more clearly and guiding me in my future.", image: "/images/review-face3.png" },
        { name: "Rhonda Miller", quote: "Enlightening, energizing, repairing my soul, cleansing—thank you, you are amazing!", image: "/images/review-face1.png" },
        { name: "Cindi Tolkmit", quote: "Thank you for being so welcoming and calming and bringing some clarity.", image: "/images/review-face2.png" },
        { name: "Irene Barron", quote: "I feel lighter and like spirit is guiding me and cleaning me in and out. I love myself more… starting to love myself and put myself first.", image: "/images/review-face3.png" },
        { name: "Janean McGowen", quote: "Very observational and sensible. Knew how to help me approach my lifestyle.", image: "/images/review-face1.png" },
        { name: "Jenna Collins", quote: "Amazing, your energy is so vibrant and loving, thank you!", image: "/images/review-face2.png" },
        { name: "Maria Casarez", quote: "Loved it all! Thank you for your listening ear and guidance. I love the gong. I love the tapping.", image: "/images/review-face3.png" },
        { name: "Moe Bedolla", quote: "Thank you so much for setting me at peace with myself.", image: "/images/review-face1.png" },
        { name: "DL Whitaker", quote: "I realize I need a f*cking break, thank you for helping me see that!", image: "/images/review-face2.png" },
        { name: "Diana Cor", quote: "She (Coach Tay) made me feel comfort, safe, and that my feelings are valuable.", image: "/images/review-face3.png" },
        { name: "Anessa Paz-Arias", quote: "This was absolutely amazing! 10/10!!", image: "/images/review-face1.png" },
        { name: "Carla Johnson", quote: "I really felt lighter after my session. So many thanks. I’m grateful.", image: "/images/review-face2.png" },
        { name: "Arynn Duncan", quote: "Your assistance on this journey was wonderful and uplifting. I wouldn’t change a thing!", image: "/images/review-face3.png" },
        { name: "Melina Breight", quote: "Outstanding communication & perspective on life issues. Wonderful experience! Thank you so much!", image: "/images/review-face1.png" },
        { name: "Mayra", quote: "One word: WONDERFUL! Thank you.", image: "/images/review-face2.png" },
        { name: "Valerie M.", quote: "This was extremely helpful. Realized I'm not breathing—these techniques help me center during stress.", image: "/images/review-face3.png" },
        { name: "Saundra W.", quote: "I feel stronger, have more energy, and love how I feel in my body.", image: "/images/review-face1.png" },
        { name: "Casie P.", quote: "I enjoy the breath work and chanting and mantras I can repeat to myself during times of stress.", image: "/images/review-face2.png" },
        { name: "Eric Wulf", quote: "Great information, well presented. Shining personality! Well informed.", image: "/images/review-face3.png" },
        { name: "Mark Keskeny", quote: "Great job, very interesting and effective!", image: "/images/review-face1.png" },
        { name: "Quincia Lynn Burlson", quote: "Great job, LOVED the exercises. Loved the gong…I appreciate you!", image: "/images/review-face2.png" },
        { name: "Stephanie Torres", quote: "I arrived with anxiety and I’m leaving with clarity and calmness <3", image: "/images/review-face3.png" },
        { name: "Hannah Ramirez", quote: "Such a powerful soundbath. Opened my eyes to be myself and to love me as I am.", image: "/images/review-face1.png" },
        { name: "Marisela Alcala", quote: "I came in tired. This helped me find my center again. Thank you!!", image: "/images/review-face2.png" },
        { name: "Lori Lynch", quote: "Wonderful! Relaxed! Ready for my day and Life!", image: "/images/review-face3.png" },
        { name: "Angie Doctolero", quote: "Don’t change Anything! Loved it and loved Your Energy!", image: "/images/review-face1.png" },
        { name: "Alma Espejo", quote: "I enjoyed being in a safe space and in tune with myself. <3", image: "/images/review-face2.png" },
        { name: "Michelle Cano", quote: "You were great. I felt the powerful healing.", image: "/images/review-face3.png" },
        { name: "Natalie Sanchez", quote: "Your energy is on point. There is enough of a balance for an intro class.", image: "/images/review-face1.png" },
        { name: "Kathy Wilson", quote: "Thank you for providing a safe and healing experience. You made a comfortable space for me to just be Me!", image: "/images/review-face2.png" },
    ];
      const getRandomReviews = (list, count) => {
        const shuffled = [...list].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      };
      const selectedReviews = getRandomReviews(allReviews, 3);
  
      res.render('home', { slides, selectedReviews });
    } catch (error) {
      console.error('Error fetching slides:', error.message);
      res.render('home', { slides: [], selectedReviews: [] });
    }
  };

const getIntroductionView = async (req, res, next) => {
    res.render('quiz/intro')
}

const getGettingToKnowYouView = async (req, res, next) => {
    res.render('quiz/getting-to-know-you')
}

const getAssessmentView = async (req, res, next) => {
    res.render('quiz/assessment');
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
    // res.render('resources');

    try {
        const resources = await ResourcesImage.find().sort({ createdAt: -1 });
        res.render('resources', { resources });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading resources");
    }
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

const getLoginView = async(req, res, next) => {
    res.render('login');
}

const getContentManagementView = (req, res) => {
    res.render('content-management');
};


const getResourcesManagementView = (req, res) => {
    res.render('resourcesmanagement');
};

const getEditResourcesImageView = async (req, res) => {
    const resource = await ResourcesImage.findById(req.params.id);
    res.render('editresourcesimage', { resource }); // ✅ layout.ejs wraps it
};

module.exports = {
    
    getHubView,
    getHomeView,
    getAssessmentView,
    getIntroductionView,
    getGettingToKnowYouView,
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
    getContentManagementView,
    getResourcesManagementView,
    getEditResourcesImageView,
    getLoginView,
    router
};
