const Client = require('../models/client'); 



const getHubView = async (req,res,next) => {
    res.render('hub');
}

const getHomeView = async (req, res, next) => {
    res.render('home');
}

const getAssessmentView = async (req, res, next) => {
    res.render('assessment');
}

const getAdminPortalView = async(req, res, next) => {
    res.render('adminportal');
}

const getContactView = async(req, res, next) => {
    res.render('contact');
}

const getResourcesView = async(req, res, next) =>{
    res.render('resources');
}

const getNotFoundView = async(req, res, next) => {
    res.render('notFound');
}

const getServicesView = async(req, res, next) => {
    res.render('services');
}

const getShopView = async(req, res, next) => {
    res.render('shop');
}

const getApplicationView = async(req, res, next) => {
    res.render('application');
}

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
 };
