// fixDemoShopStaff.js — διορθώνει τη ΜΟΡΦΗ του tenants/demo-shop/staff (array, όχι object).
// Αγγίζει ΑΠΟΚΛΕΙΣΤΙΚΑ το tenants/demo-shop/staff. Τίποτα άλλο.
const admin = require(require("path").join(__dirname, "..", "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({
  credential: admin.credential.cert(require(require("path").join(__dirname, "..", "..", "firebase-key.json"))),
  databaseURL: "https://glamager-hair-corner-default-rtdb.europe-west1.firebasedatabase.app"
});

async function main() {
  const staff = [
    {
      id: "m1",
      name: "Demo Master",
      email: "demo.master@glamager.test",
      role: "master",
      servesClients: false,
      leaveTotal: 20,
      schedule: null,
      birthday: null,
      hired: null,
      active: true
    }
  ];
  await admin.database().ref("tenants/demo-shop/staff").set(staff);
  console.log("✔ Διορθώθηκε tenants/demo-shop/staff → array (ήταν object πριν)");
  process.exit(0);
}
main().catch(err => { console.error("Error:", err.message); process.exit(1); });
