const dotenv = require('dotenv');
const assert = require('assert');

dotenv.config();

//const{PORT, HOST, HOST_URL} = process.env;
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const HOST_URL = process.env.HOST_URL || `http://${HOST}:${PORT}`;

assert(PORT, 'PORT is required');
assert(HOST, 'HOST is required');

module.exports = {
    port: PORT,
    host: HOST,
    url: HOST_URL
}