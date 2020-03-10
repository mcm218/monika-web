import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
const cors = require('cors');

admin.initializeApp();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.region("us-central1").https.onRequest((request, response) => {
  return cors()(request, response, () => {
    response.status(200).send({ data: { msg: "Hello from Firebase!" } });
  });
});

export const getUserToken = functions.region("us-central1").https.onRequest((request, response) => {
  return cors()(request, response, () => {
    console.log("Logging user id...");
    console.log(request.body.data.userId);
    if (request.body.data.userId) {
      admin.auth().createCustomToken(request.body.data.userId).then((customToken) => {
        response.status(200).send({ data: { customToken: customToken } });
      }
      ).catch(error => {
        console.log(error);
        response.status(400).send({ error: { status_code: 400, msg: error } });
      });
    } else {
      response.status(400).send({ error: { status_code: 400, msg: "Invalid body: id is required" } });
    }
  });
});
