const functions = require('firebase-functions');
const admin = require('firebase-admin');

const firebaseConfig = {
    apiKey: "AIzaSyC9Nzc8Pyk4LdrWp9RExqi76gvGTD85R60",
    authDomain: "chat-af420.firebaseapp.com",
    databaseURL: "https://chat-af420.firebaseio.com",
    projectId: "chat-af420",
    storageBucket: "chat-af420.appspot.com",
    messagingSenderId: "765001571691",
    appId: "1:765001571691:web:3f3480ce2ab34b79bfc02e"
  };

admin.initializeApp();

const express = require('express');
const app = express();


// add firebase
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig)

const db = admin.firestore();
// get screams
app.get('/screams', (req, res) => {
     db
       .collection('screams')
       .orderBy('createdAt', 'desc')
       .get()
       .then(snapshot => {
           let screams = [];
           snapshot.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
           })
           return res.json(screams);
       })
       .catch(err =>console.error(err))
})

// create screams
app.post('/scream', (req, res) => {
    let newScream = {
        userHandle: req.body.userHandle,
        body: req.body.body,
        createdAt: new Date().toISOString()
    }

      db
        .collection('screams')
        .add(newScream)
        .then(doc => {
            return res.json({ message: `New Scream ${doc.id} created`});
        })
        .catch(err => {
            res.status(500).json({error: 'Something went wrong'});
            console.log(err);
        })
})

// Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    // TODO validate data

    // check if handle exists
    let tokenId, userId;
    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if(doc.exists) {
                return res.status(400).json({ handle: 'this handle is already taken'});
            } else {
                return firebase.auth()
                            .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            let userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({token})
        })
        .catch((err) => {
            console.log(err);
            if(err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: `Email already in use`});
            } else {
                return res.status(500).json({ error: err.code });
            }
           
        })
})

exports.api = functions.https.onRequest(app);