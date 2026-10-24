// checkDemoAccount.js — μόνο διάβασμα, καμία εγγραφή.
const admin = require(require("path").join(__dirname, "..", "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.cert(require(require("path").join(__dirname, "..", "..", "firebase-key.json"))) });

async function main() {
  const user = await admin.auth().getUserByEmail("demo.master@glamager.test");
  console.log("UID:", user.uid);
  console.log("Email verified:", user.emailVerified);
  console.log("Disabled:", user.disabled);
  console.log("Custom claims:", user.customClaims || "(κανένα ακόμα — αναμενόμενο)");
  process.exit(0);
}
main().catch(err => { console.error("Error:", err.message); process.exit(1); });
