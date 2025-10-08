const Application = require('../models/appSchema');
const {validate} = Application;


// handles the application form submission
const submitApplication = async (req, res) => {
    //Checkbox
    const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    // submitted form becomes object, and make checkboxes arrays
   const payload = {
    ...req.body,
    familiarWith: toArray(req.body.familiarWith),
    challenges: toArray(req.body.challenges),
   };

   // validate the data with schema joi
   const {error, value } = validate(payload); 

    
    // validate the data on the form with joi
    if (error){
        return res.status(400).render('prequiz/application',{
            successMessage: null,
            errorMessage: error.details[0].message,
            form: payload,
            csrfToken: req.csrfToken(),        // terry added this for security purposes
        });
    }    

    try{
        const application = new Application(value);
        await application.save(); // save to Mongo 
        
      
        // Go to success page
        return res.redirect(303, '/app-success');
   
    } catch (err){
        console.error('Application save failed:', err);

        return res.status(500).render('prequiz/application',{
            successMessage: null,
            errorMessage: 'Something went wrong saving your application. Please try again', //terry fixed the error issue
            form: payload,
            csrfToken: req.csrfToken(),        // terry added this for security purposes
        });
    }
};

module.exports = {
    submitApplication
};