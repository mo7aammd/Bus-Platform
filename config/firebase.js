var admin = require("firebase-admin");

var serviceAccount = require("./yemen-bus-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports.firebase = admin;
