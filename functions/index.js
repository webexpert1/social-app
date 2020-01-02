const functions = require('firebase-functions');

const express = require('express');
const app = express();

// auth middleware
const FBAuth = require('./util/fBAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login} = require('./handlers/users');

// screams routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream)

// users routes
app.post('/signup', signup);
app.post('/login', login);


exports.api = functions.https.onRequest(app);