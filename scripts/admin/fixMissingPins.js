// fixMissingPins.js — δίνει αρχικό PIN σε όποιον στο tenants/demo-shop/staff δεν έχει ακόμα.
// Αγγίζει ΑΠΟΚΛΕΙΣΤΙΚΑ tenants/demo-shop/pins. Τίποτα άλλο, πουθενά αλλού.
const admin = require(require("path").join(__dirname, "..", "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({
  credential: admin.credential.cert(require(require("path").join(__dirname, "..", "..", "firebase-key.json"))),
  databaseURL: "https://glamager-hair-corner-default-rtdb.europe-west1.firebasedatabase.app"
});

async function main() {
  const staffSnap = await admin.database().ref("tenants/demo-shop/staff").once("value");
  const staff = staffSnap.val() || [];
  const pinsSnap = await admin.database().ref("tenants/demo-shop/pins").once("value");
  const pins = pinsSnap.val() || {};

  let next = 1;
  const updates = {};
  for (const person of staff) {
    if (!person || !person.id) continue;
    if (pins[person.id]) continue; // έχει ήδη PIN, δεν το αγγίζουμε
    const pin = String(1000 + next).padStart(4, '0'); // 1001, 1002, ...
    updates[person.id] = pin;
    console.log(`✔ ${person.name || person.id} (${person.role}) -> PIN: ${pin}`);
    next++;
  }

  if (Object.keys(updates).length === 0) {
    console.log("Όλοι έχουν ήδη PIN, καμία αλλαγή.");
  } else {
    await admin.database().ref("tenants/demo-shop/pins").update(updates);
    console.log("\nΈτοιμο.");
  }
  process.exit(0);
}
main().catch(err => { console.error("Error:", err.message); process.exit(1); });
