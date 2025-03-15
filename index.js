const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const winston = require('winston');
const clientRoutes = require('./routes/client-routes');
const err = require('./middleware/errors');
const config = require('./startup/config');

const app = express();

require('./startup/db')();
require('./startup/validations')();

// ✅ Set view engine before using express-ejs-layouts
app.set('view engine', 'ejs');
app.use(expressLayouts); // ✅ No parentheses!

// ✅ Middleware setup order
app.use(express.json()); // Needed for parsing JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));


app.use(clientRoutes.routes);

app.listen(config.port, () => winston.info('App is listening on http://localhost:' + config.port));
