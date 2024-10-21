const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Cloud Function to send notification
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const {fcmToken, message} = data;

  const payload = {
    notification: {
      title: "Tracking Alert",
      body: message,
    },
  };

  try {
    // Send notification to FCM token
    const response = await admin.messaging().sendToDevice(fcmToken, payload);
    return {success: true, response};
  } catch (error) {
    console.error("Error sending notification:", error);
    return {success: false, error};
  }
});
