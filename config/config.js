
const fs = require('fs');
const path = require('path');
module.exports.xelsApi = `http://localhost:37221`;

exports.httpPort = 4000;
exports.httpsPort = 2332;

//import ssl certificate
exports.httpsOptions = {
    cert: fs.readFileSync(path.join(__dirname, '../ssl_certificate', 'xels_io.crt')),
    ca: fs.readFileSync(path.join(__dirname, '../ssl_certificate', 'xels_io.ca-bundle')),
    key: fs.readFileSync(path.join(__dirname, '../ssl_certificate', 'xels_io_private_key.key'))
  }
