const Application = require('../models/appSchema');
const {validate} = require('../models/appSchema'); 


// handles the application form submission
const submitApplication = async (req, res) => {
    //Checkbox
    const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    console.log("Application received:", req.body); 
    const { error } = validate(req.body);

    // 
    req.body.familiarWith = toArray(req.body.familiarWith);
    req.body.challenges  = toArray(req.body.challenges);

    
    // validate the data on the form with joi
    if (error){
        console.log("Validation Error:", error.details[0].message);
        return res.status(400).render('application', {successMessage: null}); // if fails restart the form 
    }

    try{
        const application = new Application(req.body);
        await application.save(); // save to Mongo 
        
        // log data in a json format 
        console.log("New application received:");
        console.log(JSON.stringify(application, null, 2));

        // render the same page with a success message
        res.render('application',{successMessage:" Application Submitted Successfully! "});

        // incase team wants to make a thank you page for after submission 
        //res.redirect('/thank-you'); 
    } catch (err){
        console.error("Error Saving Application ", err.message);
        res.status(500).render('application',{successMessage: null}); // if fails rerender
    }
};

module.exports = {
    submitApplication
};