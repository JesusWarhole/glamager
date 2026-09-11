/* Firebase Cloud Messaging — background/locked-screen push.
   ΓΙΑΤΙ ξεχωριστό αρχείο, root-scoped: το FCM Web SDK απαιτεί service worker
   ακριβώς σε αυτό το path/scope (χωρίς φάκελο) για να παραδίδει notifications
   ενώ η σελίδα δεν είναι ανοιχτή/foreground — δες registerPushToken() στο
   index.src.html. Χωριστό από οποιοδήποτε άλλο service worker της εφαρμογής
   (δεν υπάρχει άλλο σήμερα).

   Το config είναι το ΙΔΙΟ public firebaseConfig που ήδη υπάρχει hardcoded στο
   index.src.html (apiKey Firebase δεν είναι μυστικό — η ασφάλεια είναι τα
   Database/Auth rules, όχι το να κρύβεται αυτό). */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBHa-O-o15eroJ309XqiTZWnILEGKc-Tto",
  authDomain: "glamager-hair-corner.firebaseapp.com",
  databaseURL: "https://glamager-hair-corner-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "glamager-hair-corner",
  storageBucket: "glamager-hair-corner.firebasestorage.app",
  messagingSenderId: "529759624505",
  appId: "1:529759624505:web:87dc7dfa87633bab8f5ce8",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Νέο online ραντεβού";
  const body = payload.notification?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-glamager-192.png",
    tag: "glamager-booking-alert",
  });
});
