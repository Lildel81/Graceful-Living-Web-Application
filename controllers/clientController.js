const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const slides = [];
// for file uploads
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const Client = require("../models/client");
const CarouselSlide = require("../models/carouselSlide");
const testimonials = require("../models/testimonialSchema");
const ResourcesImage = require("../models/resourcesImage");
const ResourcesText = require('../models/resourcesText');
const Services = require("../models/servicesSchema");
const Application = require('../models/appSchema');
const ChakraAssessment = require('../models/chakraAssessment');

const mongoose = require("mongoose"); 
// ML conversion prediction - uses centralized controller
const {getMLConversionStats} = require('./conversionStatsController');

// --- Allow admin iframes & local form posts (http/https localhost + YouTube) ---
function allowAdminEmbeds(res) {
  const extra = [
    "frame-ancestors 'self'",
    "frame-src 'self' http://localhost:8080 https://localhost:8080 https://www.youtube.com https://www.youtube-nocookie.com",
    "form-action 'self' http://localhost:8080 https://localhost:8080"
  ].join('; ');

  const existing = res.get('Content-Security-Policy') || '';
  const cleaned = existing
    .replace(/frame-ancestors[^;]*;?/ig, '')
    .replace(/frame-src[^;]*;?/ig, '')
    .replace(/form-action[^;]*;?/ig, '')
    .trim();

  res.set('Content-Security-Policy', cleaned ? `${cleaned}; ${extra}` : extra);
  res.set('X-Frame-Options', 'SAMEORIGIN');
}


const MOCK_USERS = [
  {
    firstname: "Ava",
    lastname: "Ng",
    phonenumber: "(555) 010-1001",
    email: "ava.ng@example.com",
    closedChakra: "heart",
  },
  {
    firstname: "Liam",
    lastname: "Patel",
    phonenumber: "(555) 010-1002",
    email: "liam.patel@example.com",
    closedChakra: "throat",
  },
  {
    firstname: "Noah",
    lastname: "Kim",
    phonenumber: "(555) 010-1003",
    email: "noah.kim@example.com",
    closedChakra: "root",
  },
  {
    firstname: "Mia",
    lastname: "Khan",
    phonenumber: "(555) 010-1004",
    email: "mia.khan@example.com",
    closedChakra: "solarPlexus",
  },
  {
    firstname: "Zoe",
    lastname: "Lopez",
    phonenumber: "(555) 010-1005",
    email: "zoe.lopez@example.com",
    closedChakra: "thirdEye",
  },
  {
    firstname: "Omar",
    lastname: "Ali",
    phonenumber: "(555) 010-1006",
    email: "omar.ali@example.com",
    closedChakra: "crown",
  },
];

const getHubView = async (req, res, next) => {
  res.render("hub");
};

const getHomeView = async (req, res, next) => {
  try {
    const slides = await CarouselSlide.find().sort({ order: 1 });

    const allReviews = [
      {
        name: "Vicki Carroll",
        quote: "This event was excellent. I loved everything about it!",
        image: "/images/review-face1.png",
      },
      {
        name: "Claire Larke",
        quote:
          "Very engaging, interesting and charismatic. The content really got us all thinking outside the box.",
        image: "/images/review-face2.png",
      },
      {
        name: "Alexea Takacs",
        quote:
          "The energy, wisdom and motivation the workshop gave me was what I liked most about the event.",
        image: "/images/review-face3.png",
      },
      {
        name: "Adanna Eke",
        quote:
          "I rate the event as excellent! I liked the partner activity the most. I would definitely recommend to a friend!",
        image: "/images/review-face1.png",
      },
      {
        name: "Shirley Brown",
        quote:
          "I really enjoyed the positiveness of the subject matter, the positiveness in the room and of the speaker.",
        image: "/images/review-face2.png",
      },
      {
        name: "Latoya Holmes-Green",
        quote:
          "I learned how to increase my energy vibration and redirect my thoughts to the outcomes I want. Shante is so nurturing and caring.",
        image: "/images/review-face3.png",
      },
      {
        name: "Sha D.",
        quote:
          "Shante has a nurturing energy which is of paramount importance when working toward health and wellness.",
        image: "/images/review-face1.png",
      },
      {
        name: "Amanda Chacon",
        quote:
          "Your examples always relate to something I’m dealing with. It’s refreshing and eye opening!",
        image: "/images/review-face2.png",
      },
      {
        name: "Philip Victor Rader",
        quote:
          "It was very interesting and enlightening. Thank you for helping me see more clearly and guiding me in my future.",
        image: "/images/review-face3.png",
      },
      {
        name: "Rhonda Miller",
        quote:
          "Enlightening, energizing, repairing my soul, cleansing—thank you, you are amazing!",
        image: "/images/review-face1.png",
      },
      {
        name: "Cindi Tolkmit",
        quote:
          "Thank you for being so welcoming and calming and bringing some clarity.",
        image: "/images/review-face2.png",
      },
      {
        name: "Irene Barron",
        quote:
          "I feel lighter and like spirit is guiding me and cleaning me in and out. I love myself more… starting to love myself and put myself first.",
        image: "/images/review-face3.png",
      },
      {
        name: "Janean McGowen",
        quote:
          "Very observational and sensible. Knew how to help me approach my lifestyle.",
        image: "/images/review-face1.png",
      },
      {
        name: "Jenna Collins",
        quote: "Amazing, your energy is so vibrant and loving, thank you!",
        image: "/images/review-face2.png",
      },
      {
        name: "Maria Casarez",
        quote:
          "Loved it all! Thank you for your listening ear and guidance. I love the gong. I love the tapping.",
        image: "/images/review-face3.png",
      },
      {
        name: "Moe Bedolla",
        quote: "Thank you so much for setting me at peace with myself.",
        image: "/images/review-face1.png",
      },
      {
        name: "DL Whitaker",
        quote:
          "I realize I need a f*cking break, thank you for helping me see that!",
        image: "/images/review-face2.png",
      },
      {
        name: "Diana Cor",
        quote:
          "She (Coach Tay) made me feel comfort, safe, and that my feelings are valuable.",
        image: "/images/review-face3.png",
      },
      {
        name: "Anessa Paz-Arias",
        quote: "This was absolutely amazing! 10/10!!",
        image: "/images/review-face1.png",
      },
      {
        name: "Carla Johnson",
        quote:
          "I really felt lighter after my session. So many thanks. I’m grateful.",
        image: "/images/review-face2.png",
      },
      {
        name: "Arynn Duncan",
        quote:
          "Your assistance on this journey was wonderful and uplifting. I wouldn’t change a thing!",
        image: "/images/review-face3.png",
      },
      {
        name: "Melina Breight",
        quote:
          "Outstanding communication & perspective on life issues. Wonderful experience! Thank you so much!",
        image: "/images/review-face1.png",
      },
      {
        name: "Mayra",
        quote: "One word: WONDERFUL! Thank you.",
        image: "/images/review-face2.png",
      },
      {
        name: "Valerie M.",
        quote:
          "This was extremely helpful. Realized I'm not breathing—these techniques help me center during stress.",
        image: "/images/review-face3.png",
      },
      {
        name: "Saundra W.",
        quote:
          "I feel stronger, have more energy, and love how I feel in my body.",
        image: "/images/review-face1.png",
      },
      {
        name: "Casie P.",
        quote:
          "I enjoy the breath work and chanting and mantras I can repeat to myself during times of stress.",
        image: "/images/review-face2.png",
      },
      {
        name: "Eric Wulf",
        quote:
          "Great information, well presented. Shining personality! Well informed.",
        image: "/images/review-face3.png",
      },
      {
        name: "Mark Keskeny",
        quote: "Great job, very interesting and effective!",
        image: "/images/review-face1.png",
      },
      {
        name: "Quincia Lynn Burlson",
        quote:
          "Great job, LOVED the exercises. Loved the gong…I appreciate you!",
        image: "/images/review-face2.png",
      },
      {
        name: "Stephanie Torres",
        quote:
          "I arrived with anxiety and I’m leaving with clarity and calmness <3",
        image: "/images/review-face3.png",
      },
      {
        name: "Hannah Ramirez",
        quote:
          "Such a powerful soundbath. Opened my eyes to be myself and to love me as I am.",
        image: "/images/review-face1.png",
      },
      {
        name: "Marisela Alcala",
        quote:
          "I came in tired. This helped me find my center again. Thank you!!",
        image: "/images/review-face2.png",
      },
      {
        name: "Lori Lynch",
        quote: "Wonderful! Relaxed! Ready for my day and Life!",
        image: "/images/review-face3.png",
      },
      {
        name: "Angie Doctolero",
        quote: "Don’t change Anything! Loved it and loved Your Energy!",
        image: "/images/review-face1.png",
      },
      {
        name: "Alma Espejo",
        quote: "I enjoyed being in a safe space and in tune with myself. <3",
        image: "/images/review-face2.png",
      },
      {
        name: "Michelle Cano",
        quote: "You were great. I felt the powerful healing.",
        image: "/images/review-face3.png",
      },
      {
        name: "Natalie Sanchez",
        quote:
          "Your energy is on point. There is enough of a balance for an intro class.",
        image: "/images/review-face1.png",
      },
      {
        name: "Kathy Wilson",
        quote:
          "Thank you for providing a safe and healing experience. You made a comfortable space for me to just be Me!",
        image: "/images/review-face2.png",
      },
    ];
    const getRandomReviews = (list, count) => {
      const shuffled = [...list].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    const selectedReviews = getRandomReviews(allReviews, 3);

    const services = await Services.find().sort({ createdAt: -1 }).limit(3);

    res.render("home", { 
      slides, 
      selectedReviews,
      //to view services 
      services
    });
  } catch (error) {
    console.error("Error fetching slides:", error.message);
    res.render("home", { slides: [], selectedReviews: [] });
  }
};

const getIntroductionView = async (req, res, next) => {
  res.render("quiz/intro");
};

const getGettingToKnowYouView = async (req, res, next) => {
  res.render("quiz/getting-to-know-you");
};

const getAssessmentView = async (req, res, next) => {
  res.render("quiz/assessment");
};

const postCreateClient = async (req, res) => {
  try {
    const payload = {
      firstname:   (req.body.firstname || '').trim(),
      lastname:    (req.body.lastname  || '').trim(),
      phonenumber: (req.body.phonenumber || '').trim(),
      email:       (req.body.email || '').trim(),
      closedChakra:(req.body.closedChakra || '').trim(),
      currentDate: new Date().toISOString()
    };

    if (typeof Client.validate === 'function') {
      const { error } = Client.validate(payload);
      if (error) {
        return res.status(400).render('client-add', {
          formError: error.details?.[0]?.message || 'Validation error',
          formValues: payload
        });
      }
    }

    const existing = await Client.findOne({ email: payload.email }).lean();
    if (existing) {
      return res.status(400).render('client-add', {
        formError: 'A client with this email already exists.',
        formValues: payload
      });
    }

    await Client.create(payload);
    // CHANGED: go to Client Management, not Admin Portal
    return res.redirect('/clientmanagement?created=1');
  } catch (err) {
    console.error('Failed to create client:', err);
    return res.status(500).render('client-add', {
      formError: 'Something went wrong creating the client.',
      formValues: req.body
    });
  }
};



// --- Robust getAdminPortalView (replace existing) ---
const getAdminPortalView = async (req, res) => {
  // chakraMap: keys are canonical stored focusChakra values (normalized)
  // value is the friendly label shown in the UI
  const chakraMap = {
    rootchakra: "Root",
    sacralchakra: "Sacral",
    solarplexuschakra: "Solar Plexus",
    heartchakra: "Heart",
    throatchakra: "Throat",
    thirdeyechakra: "Third Eye",
    crownchakra: "Crown"
  };

  try {
    // fetch all assessments (lean -> plain objects)
    const assessments = (await ChakraAssessment.find().lean()) || [];

    // total submissions
    const totalSubmissions = assessments.length;

    // average chakra balance across all submissions (defensive)
    let avgChakraBalance = 0;
    if (totalSubmissions > 0) {
      const totalAverages = assessments.reduce((sum, assessment) => {
        if (assessment && assessment.results && typeof assessment.results === 'object') {
          const chakraValues = Object.values(assessment.results)
            .map(r => {
              if (r == null) return NaN;
              if (typeof r === 'number') return r;
              if (typeof r === 'object' && r.average != null) return parseFloat(r.average);
              return NaN;
            })
            .filter(n => !isNaN(n));

          if (chakraValues.length > 0) {
            const avg = chakraValues.reduce((a, b) => a + b, 0) / chakraValues.length;
            return sum + avg;
          }
        }
        return sum;
      }, 0);
      avgChakraBalance = (totalAverages / totalSubmissions).toFixed(2);
    }

    // Build counts map from assessments in a normalized way
    const counts = Object.keys(chakraMap).reduce((acc, k) => {
      acc[k] = 0;
      return acc;
    }, {});

    assessments.forEach(a => {
      // guard: a.focusChakra might be "rootChakra" or "rootchakra" or have extra whitespace
      const raw = (a && a.focusChakra) ? String(a.focusChakra).trim().toLowerCase() : '';
      if (raw) {
        // normalize to remove spaces/hyphens etc (just letters+numbers)
        const norm = raw.replace(/[^a-z0-9]/gi, '');
        // If exact match exists, increment; otherwise try partial match
        if (counts.hasOwnProperty(norm)) counts[norm] += 1;
        else {
          // fallback: try to find a key that contains the normalized raw (e.g. 'root' inside 'rootchakra')
          const foundKey = Object.keys(counts).find(k => k.includes(norm) || norm.includes(k));
          if (foundKey) counts[foundKey] += 1;
        }
      }
    });

    // Create chakra array in desired display order
    const chakraOrder = [
      'rootchakra',
      'sacralchakra',
      'solarplexuschakra',
      'heartchakra',
      'throatchakra',
      'thirdeyechakra',
      'crownchakra'
    ];

    const chakraArray = chakraOrder.map(key => ({
      // keep the same shape that EJS expects: key, label, count
      key,                    // used for CSS class (already normalized)
      label: chakraMap[key] || key,
      count: counts[key] || 0
    }));

    // server-side debug: log what we will send (remove/turn off in production)
    //console.log('AdminPortal - totalSubmissions:', totalSubmissions);
    //console.log('AdminPortal - chakraArray:', JSON.stringify(chakraArray, null, 2));

    // // render template
    // return res.render('adminportal', {
    //   userName: (req.user && (req.user.firstname || req.user.name)) || 'Admin',
    //   totalSubmissions,
    //   avgChakraBalance,
    //   csrfToken: req.csrfToken(),
    //   chakras: chakraArray
    // });

    // -------------- Oanh: ML conversion rate prediction - Get comprehensive stats ---------------------
    // Use the centralized function from conversionStatsController
    const mlResult = await getMLConversionStats({ 
      daysBack: 90, 
      limit: 50, 
      verbose: true 
    });
    
    const conversionStats = mlResult.conversionStats;
    const mlPredictions = mlResult.mlPredictions;
    const highProbabilityLeads = mlResult.highProbabilityLeads || 0;

    // --- render the page with the stats ---//
    console.log('\n' + '='.repeat(60));
    console.log('📊 RENDERING ADMIN PORTAL WITH:');
    console.log('='.repeat(60));
    console.log('conversionStats:', conversionStats ? 'SET ✅' : 'NULL ❌');
    console.log('mlPredictions:', mlPredictions ? `${mlPredictions.length} predictions ✅` : 'NULL ❌');
    console.log('highProbabilityLeads:', highProbabilityLeads !== null ? `${highProbabilityLeads} leads ✅` : 'NULL ❌');
    if (conversionStats) {
      console.log('\nConversion Stats Summary:');
      console.log('  - Conversion Rate:', (conversionStats.conversionRate * 100).toFixed(1) + '%');
      console.log('  - Recent Assessments:', conversionStats.recentAssessments);
      console.log('  - Recent Conversions:', conversionStats.recentConversions);
      console.log('  - High Probability Count:', conversionStats.highProbabilityCount);
    }
    console.log('='.repeat(60) + '\n');
    
    res.render('adminportal', {
      userName: (req.user && (req.user.firstname || req.user.name)) || 'Admin',
      //users,                // Oanh commented out bcz with uses my ML not showing
      totalSubmissions,
      avgChakraBalance,
      conversionStats,        // From ML prediction model
      mlPredictions,          //
      highProbabilityLeads,    //
      csrfToken: req.csrfToken(),
      chakras: chakraArray

    });

  } catch (err) {
    console.error('Failed to load admin portal:', err);
    // Fallback: send zeros so the template still renders safely
    const fallback = [
      { key: 'rootchakra', label: 'Root', count: 0 },
      { key: 'sacralchakra', label: 'Sacral', count: 0 },
      { key: 'solarplexuschakra', label: 'Solar Plexus', count: 0 },
      { key: 'heartchakra', label: 'Heart', count: 0 },
      { key: 'throatchakra', label: 'Throat', count: 0 },
      { key: 'thirdeyechakra', label: 'Third Eye', count: 0 },
      { key: 'crownchakra', label: 'Crown', count: 0 },
    ];
    return res.render('adminportal', {
      userName: 'Admin',
      //users: [],
      totalSubmissions: 0,
      avgChakraBalance: 0,
      conversionStats: null,
      mlPredictions: null,
      highProbabilityLeads: 0,
      csrfToken: req.csrfToken(),
      chakras: fallback
    });
  }
};


    // old quizresponses query logic retained for reference
    /*
    if (!forceMock) {
      try {
        const coll = mongoose.connection.collection("quizresponses");
        const docs = await coll
          .find(
            {},
            {
              projection: {
                fullName: 1,
                contactNumber: 1,
                email: 1,
                emailAddress: 1,
                contactEmail: 1,
                closedChakra: 1,
                submittedAt: 1,
                createdAt: 1,
              },
            }
          )
          .sort({ submittedAt: -1, createdAt: -1 })
          .toArray();

        const clean = (v) => {
          const s = (v ?? "").toString().trim();
          return s.length ? s : "—";
        };

        users = (docs || []).map((d) => {
          const full = clean(d.fullName);
          const parts = full === "—" ? [] : full.split(/\s+/);
          const firstname = parts[0] || "—";
          const lastname = parts.slice(1).join(" ") || "—";

          const rawEmail =
            d.email ??
            d.emailAddress ??
            d.contactEmail ??
            (d.contact && d.contact.email);
          const rawPhone =
            d.contactNumber ?? d.phone ?? (d.contact && d.contact.phone);

          return {
            firstname,
            lastname,
            phonenumber: clean(rawPhone),
            email: clean(rawEmail),
            closedChakra: clean(d.closedChakra),
          };
        });
      } catch (e) {
        console.error("Failed to query quizresponses:", e.message);
      }
    }

    if (forceMock || !users || users.length === 0) {
      users = MOCK_USERS;
    }
    */ 
    
    //For now, placeholder values until real DB queries are added
    //const totalSubmissions = users.length; // show how many users exist
    // placeholder until the correct logic is implemented
    //const avgChakraBalance = 0;
    //const avgQuadrantBalance = 0;
    //const mostImbalanced = null;

 

const getGalleryView = async (req, res, next) => {
  const uploadDir = path.join(__dirname, "..", "uploads");

  // read the uploads folder
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.send("Error reading uploads.");

    // filter image formats
    const imgs = files.filter((f) => f.match(/\.(jpg|jpeg|png|gif)$/));

    // renders the gallery page (header + footer) and passes the images array
    res.render("gallery", { images: imgs });
  });
};

const handleUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).send("File uploaded successfully.");
};

const deleteImage = async (req, res, next) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "../uploads", imageName);

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error("Error deleting image:", err);
      return res.status(500).send("Error deleting image.");
    }
    console.log(`Deleted image: ${imageName}`);
    res.status(200).send("Image deleted successfully.");
  });
};

const getContactView = async (req, res, next) => {
  res.render("contact");
};

const getResourcesView = async (req, res, next) => {
  // res.render('resources');

  try {
    const resources = await ResourcesImage.find().sort({ createdAt: -1 });
    const resourcesText = await ResourcesText.findOne();

    res.render('resources', { 
      resources,
      resourcesText
    });
  } catch (err) {
    console.error("Error loading resources page:", err);
    res.status(500).send("Error loading resources page");
  }
};

const getNotFoundView = async (req, res, next) => {
  res.render("notFound");
};

const getServicesView = async (req, res, next) => {
  res.render("services");
};

const getShopView = async (req, res, next) => {
  res.render("shop");
};

const getApplicationView = async (req, res, next) => {
  res.render("prequiz/application", { successMessage: null });
};

const getPreAppView = (req, res) =>{
  res.render('prequiz/pre-app'); 
};

const getApplicationSuccessView = (req, res) =>{
  res.render('prequiz/app-success');
};


// PreQuiz results 
async function getPreQuizResults(req, res, next ){
  try {
    const {
      q,
      ageBracket,
      isHealthcareWorker,
      workedWithPractitioner,
      familiarWith,
      challenges,
      from,
      to
    } = req.query;

    
    const filter = {};
    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [
        { fullName: rx },
        { email: rx },
        { contactNumber: rx },
        { jobTitle: rx }
      ];
    }
    if (ageBracket) filter.ageBracket = ageBracket;
    if (isHealthcareWorker) filter.isHealthcareWorker = isHealthcareWorker;
    if (workedWithPractitioner) filter.workedWithPractitioner = workedWithPractitioner;

    const toArr = v => (Array.isArray(v) ? v : v ? [v] : []);
    const fam = toArr(familiarWith);
    if (fam.length) filter.familiarWith = { $all: fam };

    const ch = toArr(challenges);
    if (ch.length) filter.challenges = { $all: ch };

    if (from || to) {
      filter.submittedAt = {};
      if (from) filter.submittedAt.$gte = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        filter.submittedAt.$lte = d;
      }
    }

    const [totalSubmissions, rows] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter).sort({ submittedAt: -1 }).lean()
    ]);

    res.render('prequiz-results', {
      title: 'Pre-Application Results',
      stats: { total: totalSubmissions },
      rows,
     
      q: q || '',
      ageBracket: ageBracket || '',
      isHealthcareWorker: isHealthcareWorker || '',
      workedWithPractitioner: workedWithPractitioner || '',
      familiarWith: toArr(familiarWith),
      challenges: toArr(challenges),
      from: from || '',
      to: to || ''
    });
  } catch (err) {
    next(err);
  }
}



// Chakra Quiz Results 
const { buildChakraFilter, toArr } = require('./chakraFilter');

async function getChakraQuizResults(req, res, next){
  try {
    const filter = buildChakraFilter(req.query);
    console.log({ query: req.query, filter });
    const [totalSubmissions, rows] = await Promise.all([
      ChakraAssessment.countDocuments(filter),
      ChakraAssessment.find(filter).sort({ createdAt: -1 }).lean()
    ]);

    res.render('chakraquiz-results', {
      title: 'Energy Leak Results',
      stats: { total: totalSubmissions },
      rows,
     
      q: req.query.q || '',
      ageBracket: req.query.ageBracket || '',
      healthcareWorker: req.query.healthcareWorker || '',
      workedWithPractitioner: req.query.workedWithPractitioner || '',
      familiarWith: toArr(req.query.familiarWith ?? req.query['familiarWith[]']),
      challenges:   toArr(req.query.challenges   ?? req.query['challenges[]']),
      from: req.query.from || '',
      to: req.query.to || '',
      focusChakra: toArr(req.query.focusChakra) || '',
      archetype:toArr(req.query.archetype) || ''
    });
  } catch (err) {
    next(err);
  }
}

//delete from Chakra Quiz results
const postBulkDeleteChakraResults = async (req, res, next) => {
    try {
      console.log('[BULK DELETE] raw body:', req.body);
  
      let ids = req.body.ids ?? req.body['ids[]'];

      if (!ids || (Array.isArray(ids) && ids.length === 0)) {
        console.log('[BULK DELETE] No ids provided.');
        return res.redirect('/clientmanagement/chakraquiz-results');
      }
      
      if (!Array.isArray(ids)) ids = [ids];

      const result = await ChakraAssessment.deleteMany({ _id: { $in: ids } });
      console.log('[BULK DELETE] deleteMany result:', result);

      return res.redirect('/clientmanagement/chakraquiz-results');
    } catch (err) {
      console.error('[BULK DELETE] ERROR:', err);
      return next(err);
    }
};




// Delete for Pre-Quiz results 
const postBulkDeletePreQuizResults = async (req, res, next) => {
    try {
      console.log('[BULK DELETE] raw body:', req.body);
  
      let ids = req.body.ids ?? req.body['ids[]'];

      if (!ids || (Array.isArray(ids) && ids.length === 0)) {
        console.log('[BULK DELETE] No ids provided.');
        return res.redirect('/clientmanagement/prequiz-results');
      }
      
      if (!Array.isArray(ids)) ids = [ids];

      const result = await Application.deleteMany({ _id: { $in: ids } });
      console.log('[BULK DELETE] deleteMany result:', result);

      return res.redirect('/clientmanagement/prequiz-results');
    } catch (err) {
      console.error('[BULK DELETE] ERROR:', err);
      return next(err);
    }
};




const getReviewsView = async (req, res, next) => {
  try {
    const testimonialData = await testimonials.find({});
    res.render("reviews", { testimonials: testimonialData });
  } catch (err) {
    console.error("Failed to fetch testimonials:", err);
    res.status(500).send("Error retrieving testimonials");
  }
};

const getLoginView = async (req, res, next) => {
  res.render("login");
};

const getUserSignUpView = async (req, res, next) => {
  res.render("user-signup");
};

const getUserLoginView = async (req, res, next) => {
  res.render("user-login");
};

const getUserDashboardView = async (req, res, next) => {
  res.render("user-dashboard");
};

const getContentManagementView = (req, res) => {
  // loosen CSP only for this admin page (it hosts the testimonials iframe)
  allowAdminEmbeds(res);
  res.render("content-management");
};


const getResourcesManagementView = (req, res) => {
  res.render("resourcesmanagement");
};

const getClientManagementView = async (req, res, next) => {
  try {
    const users = await Client
      .find({}, 'firstname lastname phonenumber email closedChakra')
      .sort({ firstname: 1, lastname: 1 })
      .lean();

    res.render('clientmanagement', {
      users,
      userName: (req.user && (req.user.firstname || req.user.name)) || 'Admin',
    });
  } catch (err) {
    next(err);
  }
};



// GET: edit form
const getClientEditView = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).render('notFound');

    const client = await Client.findById(id).lean();
    if (!client) return res.status(404).render('notFound');

    res.render('client-edit', {
      client, // used to prefill the form
      userName: (req.user && (req.user.firstname || req.user.name)) || 'Admin',
      formError: null
    });
  } catch (err) { next(err); }
};

// POST: update
const postUpdateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {
      firstname:   (req.body.firstname   || '').trim(),
      lastname:    (req.body.lastname    || '').trim(),
      phonenumber: (req.body.phonenumber || '').trim(),
      email:       (req.body.email       || '').trim(),
      closedChakra:(req.body.closedChakra|| '').trim(),
    };

    // optional: basic guards
    if (!payload.firstname || !payload.lastname || !payload.email) {
      const client = { _id: id, ...payload };
      return res.status(400).render('client-edit', {
        client, formError: 'First, Last, and Email are required.'
      });
    }

    await Client.findByIdAndUpdate(id, { $set: payload }, { runValidators: true });
    return res.redirect('/clientmanagement?updated=1');
  } catch (err) {
    console.error('Update client failed:', err);
    const client = { _id: req.params.id, ...req.body };
    return res.status(500).render('client-edit', {
      client, formError: 'Something went wrong updating the client.'
    });
  }
};

// POST: delete
const postDeleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    await Client.findByIdAndDelete(id);
    return res.redirect('/clientmanagement?deleted=1');
  } catch (err) {
    console.error('Delete client failed:', err);
    return res.redirect('/clientmanagement?error=delete');
  }
};



const getEditResourcesImageView = async (req, res) => {
  const resource = await ResourcesImage.findById(req.params.id);
  res.render("editresourcesimage", { resource }); // ✅ layout.ejs wraps it
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
  postCreateClient,
  getContactView,
  getResourcesView,
  getNotFoundView,
  getServicesView,
  getShopView,
  getApplicationView,
  getPreAppView,
  getApplicationSuccessView,
  getReviewsView,
  getContentManagementView,
  getResourcesManagementView,
  getEditResourcesImageView,
  getLoginView,
  getUserSignUpView,
  getUserLoginView,
  getUserDashboardView,
  getClientManagementView,
  postCreateClient,
  getClientEditView,
  postUpdateClient,
  postDeleteClient,
  getPreQuizResults,
  getChakraQuizResults,
  postBulkDeleteChakraResults,
  postBulkDeletePreQuizResults,
  router,
};
