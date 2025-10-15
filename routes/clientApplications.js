const express = require('express');
const router = express.Router();
const { getPreQuizResults } = require('../controllers/clientController');

router.get('/clientmanagement/assessments', getPreQuizResults);

module.exports = router