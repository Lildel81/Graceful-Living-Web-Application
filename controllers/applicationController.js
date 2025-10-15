const Application = require('../models/appSchema');
const {validate} = Application;

const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


// handles the application form submission
const submitApplication = async (req, res) => {
    //Checkbox
    const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    // submitted form becomes object, and make checkboxes arrays
//    const payload = {
//     ...req.body,

//     familiarWith: toArray(DOMPurify.sanitize(req.body.familiarWith)),
//     challenges: toArray(DOMPurify.sanitize(req.body.challenges)),
//    };
//terry added all this so its sanitized.
    const payload = {
        email: DOMPurify.sanitize(req.body.email),
  fullName: DOMPurify.sanitize(req.body.fullName),
  contactNumber: DOMPurify.sanitize(req.body.contactNumber),
  ageBracket: DOMPurify.sanitize(req.body.ageBracket),
  isHealthcareWorker: DOMPurify.sanitize(req.body.isHealthcareWorker),
  healthcareRole: DOMPurify.sanitize(req.body.healthcareRole),
  healthcareYears: req.body.healthcareYears
    ? Number(DOMPurify.sanitize(req.body.healthcareYears))
    : undefined,
  jobTitle: DOMPurify.sanitize(req.body.jobTitle),
  workedWithPractitioner: DOMPurify.sanitize(req.body.workedWithPractitioner),
  familiarWith: DOMPurify.sanitize(req.body.familiarWith),  //terry fixed problem... sanitizeArray is not a function
  experience: DOMPurify.sanitize(req.body.experience),
  goals: DOMPurify.sanitize(req.body.goals),
  challenges: DOMPurify.sanitize(req.body.challenges),  //terry fixed problem... sanitizeArray is not a function
    }

   
   // validate the data with schema joi
   const {error, value } = validate(payload); 

    
    // validate the data on the form with joi
    if (error){
        return res.status(400).render('prequiz/application',{
            successMessage: null,
            errorMessage: error.details[0].message,
            form: payload,
           // csrfToken: req.csrfToken(),        // terry added this for security purposes
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
            //csrfToken: req.csrfToken(),        // terry added this for security purposes
        });
    }
};

module.exports = {
    submitApplication
};