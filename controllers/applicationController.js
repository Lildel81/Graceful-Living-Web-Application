const Application = require('../models/appSchema');
const {validate} = require('../models/appSchema'); 


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
        });
    }    

    try{
        const application = new Application(value);
        await application.save(); // save to Mongo 
        
      
        // Go to success page
        return res.redirect(303, '/app-success');
   
    } catch (err){
        return res.status(500).render('prequiz/application',{
            successMessage: null,
            errrorMessage: 'Something went wrong saving your application. Please try again',
            form: payload,
        });
    }
};

module.exports = {
    submitApplication
};