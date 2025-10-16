require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");
const winston = require("winston");
const helmet = require("helmet");
const csurf = require("csurf");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const session = require("express-session");
const cookieParser = require('cookie-parser');


const config = require("./startup/config");
const clientRoutes = require("./routes/client-routes");
const carouselRoutes = require("./routes/carousel-routes");
const resourcesRoutes = require("./routes/resources-routes");
const homeRoutes = require("./routes/homeRoutes");
const chakraRoutes = require("./routes/chakraRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const loginController = require("./controllers/loginController");
const passwordResetRoutes = require("./routes/passwordReset");
const resetPageRoutes = require("./routes/resetPage");
const clientApplications = require('./routes/clientApplications');
const chakraApplications = require('./routes/chakraApplications');
const appointmentRoutes = require("./routes/appointment-routes");
const googleCalendarService = require("./services/googleCalendar");
const userAuthRoutes = require("./routes/userAuth");

const app = express();

app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // IMPORTANT: turn OFF automatic http→https upgrade in dev
        "upgrade-insecure-requests": null,

        // keep your existing sources
        "default-src": ["'self'"],

        // allow YouTube embeds (no inline scripts allowed)
        "script-src": ["'self'", "https://www.youtube.com", "https://www.gstatic.com"],
        "script-src-attr": ["'none'"],

        // allow framing self + YouTube
        "frame-src": ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],

        // forms can POST back to this origin
        "form-action": ["'self'"],

        // images/fonts/styles you already had
        "img-src": ["'self'", "data:", "https://i.ytimg.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],

        // iframes should only be embedded by our own pages
        "frame-ancestors": ["'self'"],
      },
    },
    // optional: some browsers need this relaxed in dev
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cors());
app.use(bodyParser.json());




app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// app.use((req, res, next) => {
//   // nuke old cookie-mode artifacts so they can't confuse things
//   res.clearCookie('_csrf');
//   res.clearCookie('csrfSecret');
//   next();
// });



app.use(hpp());
app.use(mongoSanitize());
app.use(hpp({ whitelist: ["familiarWith", "challanges", "_csrf"] }));
app.use('/images', express.static(path.join(__dirname, 'images')));


// ✅ Allow same-origin iframing ONLY for the testimonials manager pages
app.use(["/admin/testimonials", "/admin/testimonials/*"], (req, res, next) => {
  // Permit this site to embed these routes in an <iframe>
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Ensure CSP also allows same-origin framing for these routes
  const existing = res.getHeader("Content-Security-Policy");
  const fa = "frame-ancestors 'self'";
  if (existing) {
    // remove any existing frame-ancestors directive, then append ours
    const withoutFA = existing.replace(/frame-ancestors[^;]*;?/i, "").trim();
    const merged = withoutFA ? `${withoutFA}; ${fa}` : fa;
    res.setHeader("Content-Security-Policy", merged);
  } else {
    res.setHeader("Content-Security-Policy", fa);
  }
  next();
});

require("./startup/db")();
require("./startup/validations")();

const mongoose = require("mongoose");
mongoose.connection.once("open", async () => {
  try {
    const col = mongoose.connection.collection("passwordresettokens");
    await col.dropIndex("expiresAt_1").catch((e) => {
      if (e?.codeName !== "IndexNotFound") throw e;
    });
    await require("./models/passwordResetToken").createIndexes();
    console.log("[indexes] PasswordResetToken OK");
  } catch (err) {
    console.error("[indexes] PasswordResetToken error:", err.message);
  }

  // Initialize Google Calendar API
  googleCalendarService.initialize();
});

const ResourcesImage = require("./models/resourcesImage");
app.use(async (req, res, next) => {
  try {
    res.locals.footerResources = await ResourcesImage.find().sort({ createdAt: -1 }).limit(3);
  } catch (err) {
    console.error("Error loading footer resources:", err);
    res.locals.footerResources = [];
  }
  next();
});

app.use(cookieParser(process.env.SESSION_SECRET || 'dev-secret'));

const csrfProtection = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

// middleware to make user available in all views (for nav bar)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Only here: pass the token to the view that has the form
app.get('/application', csrfProtection, (req, res) => {
  req.session.appFlow = true;        // touching the session triggers Set-Cookie: sid=...
  res.render('prequiz/application', { csrfToken: req.csrfToken() });
});

app.get('/assessment', csrfProtection, (req, res) => {
  res.render('quiz/assessment', { csrfToken: req.csrfToken() });
});

const rateLimit = require("express-rate-limit");
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.use("/auth/reset/request", resetLimiter);

app.use("/auth/reset", passwordResetRoutes);
app.use("/reset", resetPageRoutes);

// Home Page Route with Reviews
app.use("/", homeRoutes);

app.use("/assessment", chakraRoutes);
app.use("/login", loginController);

app.get("/services", (req, res) => {
  res.render("services");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});
app.get("/about", (req, res) => {
  res.render("aboutUs");
});

// Appointment booking routes
app.get("/booking", csrfProtection, (req, res) => {
  res.render("booking", { csrfToken: req.csrfToken() });
});

// Admin appointment management
app.get("/adminportal/appointments", csrfProtection, (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.render("appointment-management", { csrfToken: req.csrfToken() });
  } else {
    res.redirect("/login");
  }
});

app.use("/appointments", appointmentRoutes);
//terry added for debugging purposes

const { submitApplication } = require('./controllers/applicationController');

app.post(
  '/application',
  (req, res, next) => {
    console.log('POST /application debug:', {
      hasSession: !!req.session,
      hasSecret: !!(req.session && req.session.csrfSecret),
      bodyToken: req.body && req.body._csrf
    });
    next();
  },
  submitApplication
);



app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF FAIL', {
      method: req.method,
      path: req.originalUrl,
      bodyCsrf: req.body?._csrf,
      headerCsrf: req.headers['csrf-token'] || req.headers['x-csrf-token'] || req.headers['x-xsrf-token'],
      hasSession: !!req.session,
      sessionID: req.sessionID,
      cookies: Object.keys(req.cookies || {}),
    });
    return res.status(403).send('Invalid CSRF token');
  }
  next(err);
});

//end debugging

app.use("/user-dashboard", dashboardRoutes);
app.use("/", userAuthRoutes);
app.use("/", homeRoutes);
app.use(resourcesRoutes);
app.use(carouselRoutes);
//app.use(require("./routes/assessment"));
app.use(clientRoutes.routes);
app.use('/', clientApplications);
app.use('/', chakraApplications);

// DANI TESTING PURPOSES ONLY
const simpleFormRoutes = require("./routes/simpleFormRoutes");
app.use("/", simpleFormRoutes);

const servicesRoutes = require("./routes/servicesRoutes");
app.use("/", servicesRoutes);

app.listen(config.port, () => winston.info("App is listening on http://localhost:" + config.port));
