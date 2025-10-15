const csurf = require('csurf');

const csrfProtection = csurf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

module.exports = csrfProtection;