const express  = require('express');
const {getAllClients} = require('../controllers/clientController');


const router = express.Router();

// Route to render homepage
router.get('/', (req, res) => {
    res.render('home'); // This will render the home.ejs file using layout.ejs
});

router.get('/', getAllClients);

module.exports = {
    routes: router
};
