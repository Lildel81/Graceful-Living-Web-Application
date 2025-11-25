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
const cookieParser = require("cookie-parser");

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
const clientApplications = require("./routes/clientApplications");
const chakraApplications = require("./routes/chakraApplications");
const appointmentRoutes = require("./routes/appointment-routes");
const googleCalendarService = require("./services/googleCalendar");
const userAuthRoutes = require("./routes/userAuth");
const statsRoutes = require("./routes/statsRoutes");
const zoomIntegrations = require("./routes/zoom-integrations");
const footerRoutes = require("./routes/footer-routes");
const homeQuoteRoutes = require("./routes/home-quote-routes");

const app = express();
app.set("trust proxy", 1);
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("query parser", "extended");
app.use(expressLayouts);

// For application PDF endings
app.use("/pdfs", express.static(path.join(__dirname, "public", "pdfs")));

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
        "script-src": [
          "'self'",
          "https://www.youtube.com",
          "https://www.gstatic.com",
        ],
        "script-src-attr": ["'none'"],

        // allow framing self + YouTube
        "frame-src": [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],

        // forms can POST back to this origin
        "form-action": ["'self'", "https://checkout.stripe.com"],

        // images/fonts/styles you already had
        "img-src": ["'self'", "data:", "https://i.ytimg.com"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com"],

        // iframes should only be embedded by our own pages
        "frame-ancestors": ["'self'", "https://checkout.stripe.com"],
      },
    },
    // optional: some browsers need this relaxed in dev
    crossOriginEmbedderPolicy: false,
  })
);

//this is the webhook to use for stripe (our payment system)
app.post("/checkout/webhook", bodyParser.raw({ type: "application/json" }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/chart.js/dist"))
);

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

app.use(mongoSanitize());

// for delete
app.use(
  hpp({
    whitelist: [
      // bulk delete
      "ids",
      "ids[]",

      // your filters that can be arrays
      "familiarWith",
      "familiarWith[]",
      "challenges",
      "challenges[]",
      "focusChakra",
      "focusChakra[]",
      "archetype",
      "archetype[]",

      // csrf
      "_csrf",
    ],
  })
);
app.use("/images", express.static(path.join(__dirname, "images")));

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

// renders resources on footer
const ResourcesImage = require("./models/resourcesImage");
app.use(async (req, res, next) => {
  try {
    res.locals.footerResources = await ResourcesImage.find()
      .sort({ createdAt: -1 })
      .limit(3);
  } catch (err) {
    console.error("Error loading footer resources:", err);
    res.locals.footerResources = [];
  }
  next();
});

// renders services on footer
const Services = require("./models/servicesSchema");
app.use(async (req, res, next) => {
  try {
    res.locals.footerServices = await Services.find()
      .sort({ createdAt: -1 })
      .limit(3);
  } catch (err) {
    console.error("Error loading footer Services:", err);
    res.locals.footerServices = [];
  }
  next();
});

// load contact content on the footer
const Footer = require("./models/footer");

app.use(async (req, res, next) => {
  try {
    const s = await Footer.findOne().lean();
    res.locals.footerContact = s
      ? {
          phone: s.phone || "",
          facebookUrl: s.facebookUrl || "",
          facebookLabel: s.facebookLabel || "Facebook",
          instagramUrl: s.instagramUrl || "",
          instagramLabel: s.instagramLabel || "Instagram",
        }
      : {};
  } catch (err) {
    console.error("Error loading footer contact:", err);
    res.locals.footerContact = {};
  }
  next();
});

// load the quote on the homepage
const HomeQuote = require("./models/homeQuote");

app.use(async (req, res, next) => {
  try {
    const quote = await HomeQuote.findOne().lean();
    res.locals.homeQuote = quote || {
      quoteText: "“Lorem ipsum dolor sit amet, consectetur adipiscing elit.”",
    };
  } catch {
    res.locals.homeQuote = {
      quoteText: "“Lorem ipsum dolor sit amet, consectetur adipiscing elit.”",
    };
  }
  next();
});

app.use(cookieParser(process.env.SESSION_SECRET || "dev-secret"));

const csrfProtection = csurf({
  cookie: {
    key: "_csrf",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
});

// for delete
app.use(express.urlencoded({ extended: true }));

// middleware to make user available in all views (for nav bar)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.admin = req.session.isAdmin || null;
  next();
});

// catches TOS post
app.post("/intro/accept-terms", csrfProtection, (req, res) => {
  req.session.acceptedTOS = true;
  res.redirect("/assessment");
});

// middleware to require TOS to be accepted before accessing Chakra Assessment
function requireTOS(req, res, next) {
  if (!req.session.acceptedTOS) {
    return res.redirect("/intro");
  }
  next();
}

app.use(["/application"], csrfProtection, (req, res, next) => {
  res.locals.csrfToken = req.csrfToken(); // This allows CSRF tokens  to access all redners in the application route
  next();
});

// Only here: pass the token to the view that has the form
app.get("/application", csrfProtection, (req, res) => {
  req.session.appFlow = true; // touching the session triggers Set-Cookie: sid=...
  res.render("prequiz/application");
});

app.use((err, req, res, next) => {
  if (err.code !== "EBADCSRFTOKEN") return next(err);
  res.status(403).render("prequiz/application", {
    error: "Your form expired or was submitted twice. Please try again.",
    // csrfToken already in res.locals
  });
});

app.use(["/assessment"], csrfProtection, (req, res, next) => {
  res.locals.csrfToken = req.csrfToken(); // available to every render()
  next();
});

app.get("/assessment", requireTOS, csrfProtection, (req, res) => {
  res.render("quiz/assessment", {
    csrfToken: req.csrfToken(),
    session: req.session,
  });
});

app.get("/intro", csrfProtection, (req, res) => {
  res.render("quiz/intro", { csrfToken: req.csrfToken() });
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
/*
app.get("/about", (req, res) => {
  res.render("aboutUs");
});*/

app.use("/stats", statsRoutes);

// Routes for the shop
const csrf = require("./middleware/csrf");

// helper: expose a CSRF token to EJS views rendered by these routes
const exposeCsrf = (req, res, next) => {
  if (typeof req.csrfToken === "function") {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
};

app.use("/shop", require("./routes/shop"));
app.use("/cart", require("./routes/cart"));

// Ensure /checkout pages/forms have a CSRF token available
app.use("/checkout", csrf, exposeCsrf, require("./routes/checkout"));

// Stripe redirect landing pages
app.get("/success", (req, res) => res.render("success"));
app.get("/cancel", (req, res) => res.render("cancel"));

// Appointment booking routes
app.get("/booking", csrfProtection, (req, res) => {
  res.render("booking", { csrfToken: req.csrfToken() });
});

// Admin appointment management
app.get("/adminportal/appointments", csrfProtection, (req, res) => {
  if (req.session && req.session.isAdmin) {
    const zoomEnabled =
      process.env.ZOOM_ENABLED === "false"
        ? false
        : typeof req.session.zoomEnabled !== "undefined"
        ? !!req.session.zoomEnabled
        : typeof req.app?.locals?.zoomEnabled !== "undefined"
        ? !!req.app.locals.zoomEnabled
        : true;

    res.render("appointment-management", {
      csrfToken: req.csrfToken(),
      zoomConnected: !!req.session.zoomConnected,
      zoomEmail: req.session.zoomEmail || null,
      zoomEnabled,
    });
  } else {
    res.redirect("/login");
  }
});

// Toggle Zoom for new bookings (admin only)
app.post("/zoom/toggle", csrfProtection, (req, res) => {
  try {
    const enabled = String(req.body.enabled) === "true";

    // persist to session and app scope so controllers can read it
    if (req.session) req.session.zoomEnabled = enabled;
    if (req.app && req.app.locals) req.app.locals.zoomEnabled = enabled;

    console.log(
      `[ZOOM][TOGGLE] Zoom for new bookings is now ${enabled ? "ON" : "OFF"}`
    );
    if (req.flash)
      req.flash(
        "success",
        `Zoom for new bookings is now ${enabled ? "ON" : "OFF"}.`
      );
  } catch (err) {
    console.error("[ZOOM][TOGGLE] Failed to toggle Zoom setting", err);
    if (req.flash) req.flash("error", "Failed to toggle Zoom setting.");
  }
  return res.redirect("/adminportal/appointments");
});

app.use("/appointments", appointmentRoutes);
//terry added for debugging purposes

const { submitApplication } = require("./controllers/applicationController");

app.post(
  "/application",
  (req, res, next) => {
    console.log("POST /application debug:", {
      hasSession: !!req.session,
      hasSecret: !!(req.session && req.session.csrfSecret),
      bodyToken: req.body && req.body._csrf,
    });
    next();
  },
  submitApplication
);

app.use((err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    console.error("CSRF FAIL", {
      method: req.method,
      path: req.originalUrl,
      bodyCsrf: req.body?._csrf,
      headerCsrf:
        req.headers["csrf-token"] ||
        req.headers["x-csrf-token"] ||
        req.headers["x-xsrf-token"],
      hasSession: !!req.session,
      sessionID: req.sessionID,
      cookies: Object.keys(req.cookies || {}),
    });
    return res.status(403).send("Invalid CSRF token");
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
app.use("/", clientApplications);
app.use("/", chakraApplications);

// DANI TESTING PURPOSES ONLY
const simpleFormRoutes = require("./routes/simpleFormRoutes");
app.use("/", simpleFormRoutes);

// for services in content management & home page
const servicesRoutes = require("./routes/servicesRoutes");
app.use("/", servicesRoutes);

// for about us in content management
const aboutUsRoutes = require("./routes/aboutUsRoutes");
app.use("/", aboutUsRoutes);

exports.getHomePage = async (req, res) => {
  const homeQuote = await HomeQuote.findOne();
  res.render("home", { homeQuote });
};

// for next month's chakra predictions
const predictRoutes = require("./routes/predictRoutes");
app.use("/", predictRoutes);

app.use("/", zoomIntegrations);
app.use(footerRoutes);
app.use(homeQuoteRoutes);

app.listen(config.port, () =>
  winston.info("App is listening on http://localhost:" + config.port)
);
