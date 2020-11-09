const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

var serviceAccount = require("./serviceAccountKey.json");
const { Timestamp } = require('@google-cloud/firestore');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://smartfarm-f6e86.firebaseio.com"
});
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://send-image-snapshot.firebaseio.com"
// });
const db = admin.firestore();

// create
app.post('/api/sendReceive', (req, res) => {
    (async () => {
        try {
            var idTemp = Math.floor(new Date().getTime()) + makeId(23) + req.body.id;
            await db.collection('send').add({
                'id': idTemp,
                'idSend': req.body.id,
                'receiveId': 'pc',
                'urlToImage': req.body.url,
                'message': '',
                'receive': false,
            });
            var time = req.body.time;
            var response = '';
            db.collection('send').where('id', '==', idTemp)
                .onSnapshot(querySnapshot => {
                    querySnapshot.docChanges().forEach(snapshot => {
                        var timer = setInterval(async function () {
                            if (response != '') {
                                clearInterval(timer);
                            } 
                            if (time == 0) {
                                snapshot.doc.ref.update({
                                    'receive': true,
                                });
                                response = 'Error - Time out';
                                return res.status(200).send(response);
                            } else {
                                if (snapshot.doc.data().message == '') {
                                    time--;
                                } else {
                                    console.log(snapshot.doc.data().message);
                                    response = snapshot.doc.data().message;
                                    return res.status(200).send(response);
                                }
                            }

                            
                        }, 1000);
                    });
                });
            
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

//generate id
function makeId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 


// read item
app.get('/api/readitem', (req, res) => {
    (async () => {
        try {
            const document = db.collection('send').doc(req.body.id);
            let item = await document.get();
            let response = item.data().item.message;
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// read all
app.get('/api/readall', (req, res) => {
    (async () => {
        try {
            let query = db.collection('send');
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        id: doc.id,
                        item: doc.data()
                    };
                    response.push(selectedItem);
                }
                return response;
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

//read data seen == false && receive == true

app.get('/api/readseen', (req, res) => {
    (async () => {
        try {
            let query = db.collection('send')
                .where('receive', '==', true)
                .where('seen', '==', false);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        id: doc.id,
                        item: doc.data()
                    };
                    response.push(selectedItem);
                }
                return response;
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// get all unseen (isMe)
app.get('/api/readseenid', (req, res) => {
    (async () => {
        try {
            let query = db.collection('send')
                .where('idSend', '==', req.body.id)
                .where('receive', '==', true)
                .where('seen', '==', false);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        id: doc.id,
                        item: doc.data()
                    };
                    response.push(selectedItem);
                }
                return response;
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// update
app.put('/api/update', (req, res) => {
    (async () => {
        try {
            const document = db.collection('send').doc(req.body.id);
            await document.update({
                'seen': true,
            });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// delete
app.delete('/api/delete', (req, res) => {
    (async () => {
        try {
            const document = db.collection('send').doc(req.body.id);
            await document.delete();
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

app.listen(3000, () => {
    console.log('App run on port 3000')
})