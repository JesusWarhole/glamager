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

   ΤΙ ΚΑΝΕΙ: διαβάζει το `staff` node του RTDB (πηγή αλήθειας για ρόλους —
   ΔΕΝ κρατάμε δεύτερο, ξεχωριστό mapping email→role μέσα στη function που θα
   μπορούσε να ξεσυγχρονιστεί), και για κάθε άτομο με πραγματικό Firebase Auth
   λογαριασμό, του βάζει custom claim { role: <ίδια τιμή με staff.role> }.
   ROLE = {RECEPTION:1, STAFF:2, MASTER:'master'} — ίδιο enum με το index.html.

   ΠΟΤΕ ΤΡΕΧΕΙ: ΔΕΝ τρέχει αυτόματα σε κάθε αλλαγή προσωπικού (θα ήταν RTDB
   trigger — εκτός scope σήμερα, θα πρόσθετε πολυπλοκότητα για κάτι που αλλάζει
   σπάνια). Αντ' αυτού: κουμπί "Συγχρονισμός δικαιωμάτων" στις Ρυθμίσεις
   (Master-only), το πατάει ο Ανδρέας/η Σοφία χειροκίνητα μετά από κάθε
   πρόσληψη/αλλαγή ρόλου/αποχώρηση. Λίγες φορές τον χρόνο — ασήμαντο κόστος.

   ΑΣΦΑΛΕΙΑ: μόνο ήδη-συνδεδεμένος χρήστης με email έναν από τους δύο
   hardcoded Masters μπορεί να το καλέσει — ΔΕΝ μπορούμε να βασιστούμε σε
   custom claims εδώ (θα ήταν circular, αυτά ακριβώς φτιάχνει η function),
   άρα email-check, ίδιο μοτίβο με το ήδη υπάρχον AUTH_ACCOUNTS lookup. */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 2 });

const MASTER_EMAILS = ["antreas@haircorner.gr", "sofia@haircorner.gr"];

exports.syncStaffClaims = onCall(async (request) => {
  const callerEmail = (request.auth && request.auth.token && request.auth.token.email || "").toLowerCase();
  if (!request.auth || !MASTER_EMAILS.includes(callerEmail)) {
    throw new HttpsError("permission-denied", "Μόνο Master μπορεί να συγχρονίσει δικαιώματα.");
  }

  const snap = await admin.database().ref("staff").once("value");
  const staff = snap.val() || {};
  const entries = Object.values(staff).filter((s) => s && s.email && s.role != null);

  const results = [];
  for (const person of entries) {
    const email = String(person.email).toLowerCase();
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: person.role });
      results.push({ email, name: person.name || "", role: person.role, ok: true });
    } catch (err) {
      // Πιθανό: το άτομο έχει εγγραφή στο staff αλλά όχι (ακόμα) πραγματικό
      // Firebase Auth account — π.χ. μόλις προστέθηκε, δεν έχει γίνει invite.
      // Δεν σταματάμε όλη τη διαδικασία για ένα άτομο· το αναφέρουμε και συνεχίζουμε.
      results.push({ email, name: person.name || "", role: person.role, ok: false, error: err.message });
    }
  }

  return { ok: true, count: results.length, results };
});
