const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const winston = require('winston');
const clientRoutes = require('./routes/client-routes');

// for file uploads -- dani
const uploadRoutes = require('./routes/uploadRoutes');

const err = require('./middleware/errors');
const config = require('./startup/config');
const multer = require('multer');
const carouselRoutes = require('./routes/carousel-routes');
const homeRoutes = require('./routes/homeRoutes'); // ✅ ADDED

const app = express();

require('./startup/db')();
require('./startup/validations')();

app.use(carouselRoutes);

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

// ✅ Set view engine before using express-ejs-layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure Express looks in the correct views folder
app.use(expressLayouts); // ✅ No parentheses!

// ✅ Middleware setup order
app.use(express.json()); // Needed for parsing JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

// routes for uploads directory -- dani
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', uploadRoutes);

// ✅ Home Page Route with Reviews
app.use('/', homeRoutes); // ✅ ADDED

// ✅ Services Page Route (NEWLY ADDED)
app.get('/services', (req, res) => {
    res.render('services');  // Renders views/services.ejs
});

// ✅ Contact Page Route
app.get('/contact', (req, res) => {
    res.render('contact');
});

// ✅ About Page Route (NEWLY ADDED)
app.get('/about', (req, res) => {
    res.render('aboutUS'); // Renders views/about.ejs
});

// ✅ Existing Routes
app.use(clientRoutes.routes);

// ✅ Start the Server
app.listen(config.port, () => winston.info('App is listening on http://localhost:' + config.port));



