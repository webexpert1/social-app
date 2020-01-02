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

// check if email is valid
const isEmail = (email) => {
    const regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

// check if string is empty
const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

// Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    // TODO validate data
    let errors = {};
    if(isEmpty(newUser.email)) errors.email = 'Must not be empty';
    else if(!isEmail(newUser.email)) errors.email = 'Must ba a valid email address';

    if(isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if(newUser.password !== newUser.confirmPassword) {
        errors.confirmPassword = "Passwords must match";
    }
    if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)
    // check if handle exists
    let token, userId;
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

// login
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    // validate
    let errors = {}
    if(isEmpty(user.email)) errors.email = 'Must not be empty';
    if(isEmpty(user.password)) errors.password = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json({errors});

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({token})
        })
        .catch(err => {
            console.error(err)
            if(err.code === 'auth/wrong-password') {
                return res.status(403).json({ general: 'Wrong credentials, please try again'});
            } else {
                return res.status(500).json({error: err.code })
            }
            
        })
})

exports.api = functions.https.onRequest(app);