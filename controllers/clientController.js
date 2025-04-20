const Client = require('../models/client'); 
const CarouselSlide = require('../models/carouselSlide');

const testimonials = [
    {
        quote: "This event was excellent. I loved everything about it!",
        name: "Vicki Carroll",
        location: "Sacramento, CA",
        event: "Vision Workshop"
    },
    {
        quote: "The energy, wisdom and motivation the workshop gave me was what I liked most about the event.",
        name: "Alexea Takacs",
        location: "San Diego, CA",
        event: "Vision Workshop"
    },
    {
        quote: "The energy, wisdom and motivation the workshop gave me was what I liked most about the event.",
        name: "Adanna Eke",
        location: "San Diego, CA"
    }
];


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
    res.render('adminportal', {userName: "Needs something passed to this", upcomingSessions: "Needs something passed to this", notifications: "Needs something passed to this", recentActivities: "Needs something passed to this"});
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

const getReviewsView = async(req, res, next) => {
    res.render('reviews', {testimonials: testimonials});
};
const getContentManagementView = (req, res) => {
    res.render('content');
};
module.exports = {
    
    getHubView,
    getHomeView,
    getAssessmentView,
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
