const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();


// get screams
app.get('/screams', (req, res) => {
    admin
       .firestore()
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

    admin
        .firestore()
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

exports.api = functions.https.onRequest(app);