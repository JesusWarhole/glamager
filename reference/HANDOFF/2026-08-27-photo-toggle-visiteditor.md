# GLAMAGER — SHIFT DEBRIEF
## Photo toggle στο VisitEditor + 2 follow-up διορθώσεις

## 0. SHIFT INFO
Agent: Claude
Date: 2026-08-27
Duration: —
Starting commit: Phase 2 completion commit (βλ. PROJECT_STATUS.md / reference/HANDOFF/latest.md)
Ending commit: — (pending — το κάνει commit ο Ανδρέας μετά το upload των follow-up διορθώσεων)
Branch: main

## 1. OBJECTIVE
Μέρος Α: Ο Ανδρέας ζήτησε το flag "📷 Φωτό" να μπορεί να ενεργοποιηθεί/απενεργοποιηθεί ΚΑΙ μετά την αποθήκευση μιας επίσκεψης (όχι μόνο στο checkout), γιατί συνήθως ο πελάτης πληρώνει πρώτα και φωτογραφίζεται μετά. Έγινε, ανέβηκε, live — ο Ανδρέας το δοκίμασε.

Μέρος Β (follow-up, ίδια μέρα, μετά από live testing): κατά το testing βρέθηκαν δύο πράγματα προς διόρθωση —
1. Ψεύτικη γραμμή "Tip → άλλος υπάλληλος" στο audit log σε ΚΑΘΕ edit επίσκεψης χωρίς tip (προϋπάρχον bug, άσχετο με το photo feature, απλά φάνηκε τώρα λόγω επαναλαμβανόμενου testing).
2. Στο Πελατολόγιο (ClientCard), το ιστορικό επισκέψεων πελάτη ήταν πλήρως read-only — καμία ένδειξη ή δυνατότητα edit για το Φωτό (ή οτιδήποτε άλλο) από εκεί.

## 2. COMPLETED

### Α. Photo toggle στο VisitEditor (LIVE, επιβεβαιωμένο)
- `photo` state στο `VisitEditor`, αρχικοποιημένο από την υπάρχουσα τιμή.
- `save()` στέλνει το `photo` στο `onSave`.
- Toggle switch UI, ίδιο με AddScreen.
- `diffVisit` πλέον συγκρίνει το `photo` field (`!!b.photo!==!!a.photo`) — χωρίς αυτό, edit μόνο στο photo θα χανόταν σιωπηλά.
- +2 STRINGS keys (`auditPhotoOnLabel`/`auditPhotoOffLabel`).
- Καμία αλλαγή χρειάστηκε στο `PendingPhotosQueue`/`markPosted` — αυτόματη σύνδεση μέσω του υπάρχοντος filter.
- **Επιβεβαιωμένο live από τον Ανδρέα**: δοκίμασε πολλαπλές ενεργοποιήσεις/απενεργοποιήσεις, το audit log καταγράφει σωστά "📷 Φωτό ενεργοποιήθηκε/απενεργοποιήθηκε".

### Β1. Διόρθωση: false-positive "Tip → άλλος υπάλληλος" στο audit log
**Root cause:** Όταν μια επίσκεψη δεν έχει tip, το `VisitEditor`/`AddScreen` γράφουν ρητά `tipStaffId: null`. Το Firebase Realtime Database, όταν λαμβάνει `null` σε ένα field, **διαγράφει το field εντελώς** — δεν το αποθηκεύει ως null. Άρα στο επόμενο read, `v.tipStaffId` είναι `undefined`, όχι `null`. Η σύγκριση στο `diffVisit` ήταν `b.tipStaffId!==a.tipStaffId` — χωρίς normalization, `undefined !== null` πάντα, άρα ΚΑΘΕ edit σε επίσκεψη χωρίς tip παρήγαγε ψεύτικη γραμμή "Tip → άλλος υπάλληλος", ανεξάρτητα από το τι πραγματικά άλλαξε.

Όλα τα άλλα πεδία (`tipSplit`, `tipPm`, `note`, `photo`) είχαν ήδη προστασία (`||null`, `||''`, `!!`) — μόνο το `tipStaffId` όχι.

**Fix:** `diffVisit`, γραμμή σύγκρισης tipStaffId άλλαξε από
```js
if(b.tipStaffId!==a.tipStaffId) out.push(t('auditTipStaffChangedLabel'));
```
σε
```js
if((b.tipStaffId||null)!==(a.tipStaffId||null)) out.push(t('auditTipStaffChangedLabel'));
```

### Β2. Πλήρες edit επίσκεψης από το Πελατολόγιο (ClientCard)
Πριν: η κάρτα κάθε επίσκεψης στο ιστορικό πελάτη ήταν αμιγώς read-only (μόνο η σημείωση ήταν επεξεργάσιμη). Καμία ένδειξη ή πρόσβαση στο Φωτό.

Τώρα: κάθε γραμμή ιστορικού (εκτός σημείωσης) είναι clickable για τον Master και ανοίγει το ίδιο `VisitDetail`/`VisitEditor` που χρησιμοποιείται ήδη στο Ταμείο και στην Αρχική — ίδιο component, καμία διπλή υλοποίηση. Άρα τώρα μπορεί να ορίσει το Φωτό (και ό,τι άλλο επιτρέπεται) και από το Πελατολόγιο.

Αλλαγές:
- `ClientCard`: +props (`clients`, `zmap`, `onEditVisit`, `onSoftDelete`, `onHardDeleteVisit`), +state `selVisitId` με live-lookup pattern (ίδιο με το App-level), +onClick στην κάρτα κάθε επίσκεψης (μόνο για Master· η σημείωση παραμένει ανεξάρτητη, δεν επηρεάζεται), +rendering του `VisitDetail` modal στο τέλος.
- `ClientsScreen`: περνάει τα νέα props από το App-level στο `ClientCard`.
- App-level: το `<ClientsScreen>` παίρνει τώρα `zmap`, `onEditVisit={editVisit}`, `onSoftDelete={softDelete}`, `onHardDeleteVisit={hardDeleteVisit}`.
- Ασφάλεια: το edit/delete εμφανίζεται μόνο αν `operator.role===ROLE.MASTER` (defense-in-depth — έτσι κι αλλιώς μόνο ο Master φτάνει στο tab «Πελατολόγιο»).

## 3. FILES CHANGED
`public/index.html` — σύνολο 8 σημειακές αλλαγές σε αυτό το shift (5 από το Μέρος Α + 3 από το Μέρος Β):
- Μέρος Α: STRINGS (+2 keys), `diffVisit` (+photo check), `VisitEditor` state/save/JSX (3 σημεία).
- Μέρος Β1: `diffVisit` — 1 γραμμή (normalization tipStaffId).
- Μέρος Β2: `ClientCard` (signature+state+onClick+modal), `ClientsScreen` (signature+passthrough), App-level `<ClientsScreen>` invocation (+4 props).

Καμία άλλη function/component δεν άλλαξε.

## 4. ARCHITECTURE DECISIONS
Καμία νέα αρχιτεκτονική απόφαση. Το Πελατολόγιο τώρα ξαναχρησιμοποιεί το υπάρχον `VisitDetail`/`VisitEditor` (ίδιο pattern με Ταμείο/Αρχική) — καμία παράλληλη/διπλή υλοποίηση edit-UI.

## 5. DATABASE / FIREBASE
Καμία αλλαγή σε rules/schema. Το Β1 fix αγγίζει μόνο πώς διαβάζεται/συγκρίνεται ένα ήδη υπάρχον field (`tipStaffId`) στο audit log — καμία αλλαγή στο πώς αποθηκεύεται.

## 6. BUSINESS LOGIC
Καμία αλλαγή business rule. Το Β1 είναι καθαρά διόρθωση bug στο audit trail (ψεύτικες καταχωρήσεις). Το Β2 προσθέτει ένα ακόμα σημείο πρόσβασης στο ίδιο υπάρχον edit flow.

## 7. UI / UX
- Β1: καμία ορατή UI αλλαγή — απλά το audit log θα είναι πλέον καθαρό, χωρίς ψεύτικες γραμμές "Tip → άλλος υπάλληλος".
- Β2: οι κάρτες επισκέψεων στο Πελατολόγιο γίνονται clickable (Master only) με `cursor:pointer`, ίδιο visual pattern με τις κάρτες εξόδων στο Ταμείο.

## 8. TESTING
Μέρος Α: επιβεβαιωμένο live από τον Ανδρέα (βλ. section 2Α).
Μέρος Β: δεν έχει γίνει live testing ακόμα — χρειάζεται μετά το upload:
- Άνοιξε επίσκεψη χωρίς tip από το Ταμείο, edit, save χωρίς να αλλάξεις τίποτα → επιβεβαίωσε ότι ΔΕΝ εμφανίζεται πια ψεύτικο "Tip → άλλος υπάλληλος".
- Πήγαινε Πελατολόγιο → άνοιξε πελάτη → πάτα πάνω σε μια επίσκεψη ιστορικού → επιβεβαίωσε ότι ανοίγει το VisitDetail και δουλεύει Edit/Delete/Φωτό όπως και στο Ταμείο.
- Επιβεβαίωσε ότι η σημείωση (📝) στο Πελατολόγιο συνεχίζει να δουλεύει ανεξάρτητα, χωρίς να ανοίγει κατά λάθος το VisitDetail.

## 9. KNOWN ISSUES
Κανένα νέο. Το Β1 ήταν προϋπάρχον, τώρα διορθωμένο.

## 10. NOT IMPLEMENTED
- Καμία αλλαγή σε Firebase/Security Rules/deployment.
- Phase 3 (Auth/Memberships/Roles) — παραμένει μπλοκαρισμένη, δεν αγγίχτηκε.

## 11. RISKS / WARNINGS
Καμία security/data επίπτωση. Συνιστάται γρήγορο visual review πριν το commit, όπως πάντα.

## 12. NEXT RECOMMENDED TASKS
### P0
1. Ανδρέας: upload το ενημερωμένο `public/index.html` (Β1+Β2) → auto-deploy.
2. Manual test των δύο fixes (βλ. section 8).

### P1
1. Phase 3 (Auth/Memberships/Roles) — παραμένει "WAITING FOR EXPLICIT APPROVAL FROM ANDREAS."
2. GitHub Actions Node.js 20 deprecation warning — ξεχωριστό maintenance task.

### P2
—

## 13. DO NOT CHANGE
- Soft-delete + audit trail σε visits/expenses (μόνη εξαίρεση: στενά scoped `hardDeleteVisit/Expense`, ίδια μέρα πριν Ζ)
- `servesClients` καθορίζει attribution eligibility, ΟΧΙ ο ρόλος — Reception ποτέ επιλογή "ποιος εξυπηρέτησε"
- Προσωπικό (κατ.2) ποτέ δεν βλέπει tips/σύνολα συναδέλφων
- Καμία αλλαγή/deploy χωρίς ρητή έγκριση Ανδρέα πριν, ανά session
- `firebase-key.json` παραμένει local-only, ποτέ σε AI/chat/upload

## 14. GIT
Branch: main
Commit: δεν έγινε από τον Claude — τα edits έγιναν σε local αντίγραφο, παραδόθηκαν στον Ανδρέα με SendUserFile ως το πλήρες `public/index.html` προς upload.
Push status: Μέρος Α live/ανέβηκε. Μέρος Β (Β1+Β2) εκκρεμεί upload.

## 15. HANDOFF
Το photo-toggle feature (Μέρος Α) είναι **live και επιβεβαιωμένο**. Τα δύο follow-up fixes (Β1: audit log false-positive, Β2: edit από Πελατολόγιο) είναι **έτοιμα σε επίπεδο κώδικα, εκκρεμεί upload+test**. Μόλις γίνει deploy και επιβεβαιωθεί το testing (section 8), αυτό το shift θεωρείται πλήρως CLOSED.

Καμία άλλη εκκρεμότητα από αυτό το shift. Phase 3 παραμένει μπλοκαρισμένη όπως πριν.
