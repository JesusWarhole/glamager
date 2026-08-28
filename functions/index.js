/* Glamager Cloud Functions — glamager-hair-corner
   ═══════════════════════════════════════════════════════════════════════
   Μία και μοναδική function προς το παρόν: syncStaffClaims.

   ΓΙΑΤΙ υπάρχει αυτό το αρχείο (βλ. PROJECT_STATUS.md §Auth model per-υπάλληλο,
   25/08): το σημερινό hybrid auth (login μία φορά ανά ΣΥΣΚΕΥΗ + καθημερινό PIN
   μεταξύ ατόμων) σημαίνει ότι τα Security Rules ήξεραν μέχρι τώρα μόνο "ποιο
   από τα 5 emails είναι συνδεδεμένο στη συσκευή" — ΟΧΙ "ποιος πραγματικά είναι
   ο operator αυτή τη στιγμή" (αυτό είναι τοπική κατάσταση, το PIN). Το UI
   (isMaster gating) έκρυβε ήδη τα master-only κουμπιά σωστά — αυτό εδώ είναι
   δεύτερη γραμμή άμυνας: rules server-side βασισμένα σε custom claim `role`
   αντί για hardcoded emails, ώστε να μην χρειάζεται να ξαναγράφουμε τα rules
   κάθε φορά που αλλάζει/προστίθεται υπάλληλος.

   ΤΙ ΚΑΝΕΙ: διαβάζει το staff node του RTDB (πηγή αλήθειας για ρόλους), και για κάθε άτομο με πραγματικό Firebase Auth λογαριασμό, του βάζει custom claim role ίδιο με staff.role.
   ROLE = RECEPTION:1, STAFF:2, MASTER:'master' — ίδιο enum με το index.html.

   ΠΟΤΕ ΤΡΕΧΕΙ: χειροκίνητο κουμπί στις Ρυθμίσεις (Master-only), όχι αυτόματο σε κάθε staff edit.

   ΑΣΦΑΛΕΙΑ: μόνο συνδεδεμένος χρήστης με email έναν από τους δύο hardcoded Masters μπορεί να το καλέσει.

   28/08 (Phase 3, Step 3 — πρώτο πραγματικό code change, βλ. phase3-step1-architecture.md
   στο Project): προστέθηκε tenantId claim δίπλα στο role — θεμέλιο για tenant isolation.
   Τα Security Rules ΔΕΝ το ελέγχουν ακόμα σε αυτό το βήμα (ξεχωριστό, επόμενο βήμα,
   περιμένει δικό του approval). Προστέθηκε επίσης χειρισμός για ανενεργό (`active:false`)
   προσωπικό: αντί να αφαιρεθεί απλά μια πληροφορία από τον λογαριασμό, ο ίδιος ο
   Firebase Auth λογαριασμός κλειδώνεται (`disabled:true`) — ξεκάθαρο "δεν μπαίνει
   πουθενά πια", όχι "δεν έχει ετικέτα μαγαζιού". Πλήρως αναστρέψιμο: αν το άτομο
   ξαναγίνει active και ξανατρέξει το sync, ξεκλειδώνεται κανονικά. */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 2 });

const MASTER_EMAILS = ["antreas@haircorner.gr", "sofia@haircorner.gr"];
const TENANT_ID = "hair-corner";

exports.syncStaffClaims = onCall(async (request) => {
  const callerEmail = (request.auth && request.auth.token && request.auth.token.email || "").toLowerCase();
  if (!request.auth || !MASTER_EMAILS.includes(callerEmail)) {
    throw new HttpsError("permission-denied", "Μόνο Master μπορεί να συγχρονίσει δικαιώματα.");
  }

  const snap = await admin.database().ref(`tenants/${TENANT_ID}/staff`).once("value");
  const staff = snap.val() || {};
  const entries = Object.values(staff).filter((s) => s && s.email && s.role != null);

  const results = [];
  for (const person of entries) {
    const email = String(person.email).toLowerCase();
    const isActive = person.active !== false; // ίδιο fallback pattern με το client (isActiveStaff)
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (isActive) {
        await admin.auth().updateUser(userRecord.uid, { disabled: false });
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: person.role, tenantId: TENANT_ID });
      } else {
        await admin.auth().updateUser(userRecord.uid, { disabled: true });
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: person.role });
      }
      results.push({ email, name: person.name || "", role: person.role, active: isActive, disabled: !isActive, ok: true });
    } catch (err) {
      results.push({ email, name: person.name || "", role: person.role, active: isActive, ok: false, error: err.message });
    }
  }

  return { ok: true, count: results.length, results };
});
