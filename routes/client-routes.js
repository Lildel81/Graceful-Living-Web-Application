const express  = require('express');
const {getAllClients} = require('../controllers/clientController');


const router = express.Router();

router.get('/', getAllClients);

module.exports = {
    routes: router
};
