const winston = require('winston');

module.exports = (err, req, res, next) => {
    winston.error(err.message, err);
    res.statsus(500).send('Something went wrong');
}