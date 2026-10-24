// setupDemoShop.js — γράφει το staff node + seed flag του demo-shop, και βάζει τα claims.
// Αγγίζει ΑΠΟΚΛΕΙΣΤΙΚΑ: tenants/demo-shop/... , _seeded/tenants/demo-shop/... ,
// και τα claims του demo.master@glamager.test. Τίποτα άλλο, πουθενά αλλού.
const admin = require(require("path").join(__dirname, "..", "..", "functions", "node_modules", "firebase-admin"));
admin.initializeApp({
  credential: admin.credential.cert(require(require("path").join(__dirname, "..", "..", "firebase-key.json"))),
  databaseURL: "https://glamager-hair-corner-default-rtdb.europe-west1.firebasedatabase.app"
});

async function main() {
  const email = "demo.master@glamager.test";

  // 1) Custom claims στον demo λογαριασμό
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: "master", tenantId: "demo-shop" });
  console.log("✔ Claims set για", email, "→ { role: 'master', tenantId: 'demo-shop' }");

  // 2) Staff node του demo-shop tenant
  const staff = {
    m1: {
      id: "m1",
      name: "Demo Master",
      email,
      role: "master",
      servesClients: false,
      leaveTotal: 20,
      schedule: null,
      birthday: null,
      hired: null,
      active: true
    }
  };
  await admin.database().ref("tenants/demo-shop/staff").set(staff);
  console.log("✔ Γράφτηκε tenants/demo-shop/staff");

  // 3) Seed flag, ώστε το DEFAULT_STAFF να ΜΗΝ πυροδοτηθεί ποτέ για το demo-shop
  await admin.database().ref("_seeded/tenants/demo-shop/staff").set(true);
  console.log("✔ Γράφτηκε _seeded/tenants/demo-shop/staff = true");

  console.log("\nΈτοιμο. Δεν έγινε καμία εγγραφή σε hair-corner ή σε άλλο tenant.");
  process.exit(0);
}
main().catch(err => { console.error("Error:", err.message); process.exit(1); });
