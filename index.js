const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const winston = require('winston');
const clientRoutes = require('./routes/client-routes');
require('dotenv').config();
const helmet = require('helmet');


// for file uploads -- dani
const uploadRoutes = require('./routes/uploadRoutes');

const err = require('./middleware/errors');
const config = require('./startup/config');
const multer = require('multer');
const carouselRoutes = require('./routes/carousel-routes');
const resourcesRoutes = require('./routes/resources-routes');
const homeRoutes = require('./routes/homeRoutes');
const chakraRoutes = require('./routes/chakraRoutes');

const app = express();

require('./startup/db')();
require('./startup/validations')();

const mongoose = require('mongoose');
mongoose.connection.once('open', async () => {
  try {
    const col = mongoose.connection.collection('passwordresettokens');
    // Drop old non-TTL index if it exists
    await col.dropIndex('expiresAt_1').catch(e => {
      if (e?.codeName !== 'IndexNotFound') throw e;
    });

    // Recreate indexes defined in your schema (won’t drop others)
    await require('./models/PasswordResetToken').createIndexes();

    console.log('[indexes] PasswordResetToken OK');
  } catch (err) {
    console.error('[indexes] PasswordResetToken error:', err.message);
    // don’t throw here — keep the app running
  }
});

app.use(carouselRoutes);
app.use(resourcesRoutes);

// Set up multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/uploads');
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({storage});
app.locals.upload = upload;

// Set view engine before using express-ejs-layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure Express looks in the correct views folder
app.use(expressLayouts); // No parentheses!


// Middleware setup order
app.use(express.json()); // Needed for parsing JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

const session = require('express-session')

//constructor for each session cookie
app.use(
    session({
        name: 'sid',
        secret: 'super-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000*60*60*2 },

    })
);

//creates an anon id for each new conection to the site

app.use((req, res, next) => {
    if (req.session.userId) {
        req.session.pageViews = 0;
    }
    next();
});


// routes for uploads directory -- dani
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', uploadRoutes);

// Home Page Route with Reviews
app.use('/', homeRoutes); 

// assessment routes (for chakra assessment)
app.use('/assessment', chakraRoutes);

// Services Page Route 
app.get('/services', (req, res) => {
    res.render('services');  // Renders views/services.ejs
});

// Contact Page Route
app.get('/contact', (req, res) => {
    res.render('contact');
});

// About Page Route 
app.get('/about', (req, res) => {
    res.render('aboutUS'); // Renders views/about.ejs
});

// Login logic
const loginController = require('./controllers/loginController');
app.use('/login', loginController);
app.get('/login', (req, res) => {
    res.render('login', {ok: req.query.ok });
});




// nodmailer password reset routes
const passwordResetRoutes = require('./routes/passwordReset');
app.use('/auth/reset', passwordResetRoutes);
const resetPageRoutes = require('./routes/resetPage');
app.use('/reset', resetPageRoutes);

// Rate Limiting for Password Reset Requests
const rateLimit = require('express-rate-limit');
const resetLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 }); // 5 req/15min per IP Address
app.use('/auth/reset/request', resetLimiter);
app.use(helmet());
app.disable('x-powered-by');


//require('./models/PasswordResetToken').syncIndexes?.();






// Existing Routes
app.use(clientRoutes.routes);

// Start the Server
app.listen(config.port, () => winston.info('App is listening on http://localhost:' + config.port));

