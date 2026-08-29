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

   28/08 (Phase 3, Step 3 — πρώτο πραγματικό code change, βλ. phase3-step1-architecture.md
   στο Project): προστέθηκε tenantId claim δίπλα στο role — θεμέλιο για tenant isolation.
   Προστέθηκε επίσης χειρισμός για ανενεργό (`active:false`) προσωπικό: αντί να αφαιρεθεί
   απλά μια πληροφορία από τον λογαριασμό, ο ίδιος ο Firebase Auth λογαριασμός κλειδώνεται
   (`disabled:true`) — ξεκάθαρο "δεν μπαίνει πουθενά πια", όχι "δεν έχει ετικέτα μαγαζιού".
   Πλήρως αναστρέψιμο: αν το άτομο ξαναγίνει active και ξανατρέξει το sync, ξεκλειδώνεται
   κανονικά.

   29/08 (multi-tenant client step, μετά το Phase 3): αφαιρέθηκαν τα καρφωμένα MASTER_EMAILS
   και TENANT_ID — η function δεν "ξέρει" πια ότι υπάρχει μόνο το Hair Corner. Αντ' αυτού
   διαβάζει το ΔΙΚΟ ΤΟΥ claim του καλούντος (`request.auth.token.role`/`tenantId`, το ίδιο
   claim που ΗΔΗ έχει από προηγούμενο sync ή χειροκίνητο αρχικό setup) και συγχρονίζει ΜΟΝΟ
   το προσωπικό ΤΟΥ ΔΙΚΟΥ ΤΟΥ μαγαζιού — ποτέ άλλου tenant, ό,τι κι αν του ζητηθεί. Αυτό
   σημαίνει ότι ΚΑΘΕ μελλοντικός Master οποιουδήποτε μαγαζιού μπορεί να χρησιμοποιήσει το
   ίδιο κουμπί χωρίς καμία αλλαγή εδώ. Ρητό όριο (βλ. phase3-step1-architecture.md):
   αυτή η function ΣΥΓΧΡΟΝΙΖΕΙ προσωπικό που ήδη ανήκει σε tenant — ΔΕΝ φτιάχνει τον πρώτο
   Master ενός ολότελα νέου μαγαζιού (αυτός δεν έχει ακόμα κανένα claim να διαβαστεί εδώ),
   αυτό παραμένει χειροκίνητο αρχικό βήμα, ίδιο μοτίβο με το αρχικό setup του Hair Corner. */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 2 });

exports.syncStaffClaims = onCall(async (request) => {
  const callerRole = request.auth && request.auth.token && request.auth.token.role;
  const callerTenantId = request.auth && request.auth.token && request.auth.token.tenantId;
  if (!request.auth || callerRole !== "master" || !callerTenantId) {
    throw new HttpsError("permission-denied", "Μόνο ο Master ενός συγκεκριμένου μαγαζιού μπορεί να συγχρονίσει τα δικαιώματά του.");
  }

  const snap = await admin.database().ref(`tenants/${callerTenantId}/staff`).once("value");
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
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: person.role, tenantId: callerTenantId });
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
