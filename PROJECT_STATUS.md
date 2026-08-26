# Glamager — Τρέχουσα Κατάσταση

> **Διάβασε αυτό ΠΡΩΤΟ σε κάθε νέο chat.** Αυτό το αρχείο ενημερώνεται (όχι προσθήκη στο τέλος — αντικαθίσταται) ώστε να δείχνει πάντα τη ΣΗΜΕΡΙΝΗ αλήθεια. Για ιστορικό αποφάσεων/σκεπτικού βλέπε `reference/SESSION_DECISIONS.md` και `reference/Glamager_Spec_v2.md` (αυτά ΔΕΝ ενημερώνονται πάντα — μπορεί να δείχνουν παλιότερο/ελαφρώς διαφορετικό σχέδιο από ό,τι υλοποιήθηκε τελικά).
>
> Τελευταία ενημέρωση: **26/08/2026 — commits `9e889ed`→`2ddc42b`, pushed & live (functions deploy + database rules deploy, τρέχτηκαν χειροκίνητα από τον Ανδρέα μέσω `firebase deploy`, επιβεβαιωμένα με "Deploy complete!" logs).**
>
> ⚠️ Τα commits της 25/08 έγιναν μέσω του GitHub web-upload flow — δεν επιτρέπει custom commit message, γι' αυτό εμφανίζονται όλα ως γενικό "Add files via upload" στο git log. Αυτό εδώ το αρχείο είναι η ΜΟΝΑΔΙΚΗ αφηγηματική καταγραφή — το git log από μόνο του δεν λέει αρκετά.
>
> ⚠️ **Νέο σήμερα (26/08): υπάρχει πλέον `functions/` φάκελος με πραγματική Cloud Function.** Το GitHub Actions (`firebase-hosting-merge.yml`) κάνει deploy ΜΟΝΟ το Hosting — ΠΟΤΕ functions, ΠΟΤΕ database rules. Και τα δύο χρειάζονται χειροκίνητο `firebase deploy --only functions` / `--only database` από τοπικό terminal (`C:\Users\andwa\Glamager`). Αν στο μέλλον αλλάξει κάτι σε αυτά τα δύο αρχεία, ΜΗΝ υποθέσεις ότι το GitHub push αρκεί — πρέπει να το πεις ρητά στον Ανδρέα να τρέξει το deploy, αλλιώς το repo και το live project θα ξεσυγχρονιστούν ξανά (ίδιο μάθημα με το testMode gap νωρίτερα σήμερα).

## Πού είναι ο πραγματικός κώδικας

Ένα αρχείο: **`public/index.html`** (~5600 γραμμές, React 18 + Babel standalone + Tailwind, όλα από CDN, χωρίς build step). Αυτό ΕΙΝΑΙ ολόκληρη η εφαρμογή — δεν υπάρχει άλλος φάκελος με "τον πραγματικό κώδικα".

Backend: Firebase Realtime Database, project **`glamager-hair-corner`**, region `europe-west1`. Auth: Firebase Auth (email/password) σε επίπεδο συσκευής + τοπικό 4ψήφιο PIN ανά υπάλληλο για γρήγορη εναλλαγή χειριστή στο ίδιο tablet/κινητό μέσα στη μέρα (το PIN ΔΕΝ είναι security boundary, είναι ταυτότητα καταχώρησης — attribution).

⚠️ Αυτό διαφέρει από το "email invite ανά υπάλληλο + custom claims" μοντέλο που περιγράφει το `Glamager_Spec_v2.md` §Auth model — αυτό ΔΕΝ έχει υλοποιηθεί ακόμα, παραμένει ανοιχτό (βλ. Εκκρεμότητες).

## Deploy — πώς δουλεύει ΤΩΡΑ (άλλαξε 01-02/08/2026)

- Repo: **https://github.com/JesusWarhole/glamager** (public — αλλά `firebase-key.json` είναι στο `.gitignore`, ποτέ δεν ανέβηκε).
- **Κάθε `git push` στο `main` κάνει AUTOMATICALLY deploy live**, μέσω GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`). Δεν χρειάζεται πια χειροκίνητο `firebase deploy`.
- Δες status/ιστορικό deploys: https://github.com/JesusWarhole/glamager/actions
- Τοπικό preview πριν το push: `firebase serve` μέσα στον φάκελο `C:\Users\andwa\Glamager`.
- **Συνέπεια για μελλοντικά chats:** αν επεξεργαστούμε το `index.html` και κάνουμε `git push`, ΠΑΕΙ ΑΜΕΣΩΣ LIVE στο πραγματικό site που ανοίγει ο Ανδρέας από το κινητό του. Πριν κάνουμε push, πάντα ρωτάμε/επιβεβαιώνουμε.

## Τι είναι live/υλοποιημένο (verified στον κώδικα, όχι μόνο σε spec)

- Firebase Auth + RTDB live sync (`useFirebaseState` hook) — όχι πια demo in-memory data.
- Ρόλοι: `ROLE = {RECEPTION:1, STAFF:2, MASTER:'master'}`, με τα τρία διαφορετικά Ταμείο-views όπως στο spec.
- **`servesClients`** flag (ανεξάρτητο από role) — ελέγχει ποιος εμφανίζεται ως επιλογή "ποιος εξυπηρέτησε" σε γραμμή/tip. Master μπορεί να είναι service-provider (π.χ. Σοφία) ή όχι (π.χ. Ανδρέας), Reception ποτέ. Toggle στο StaffManager (⚙️).
- **Master hard-delete εργαλεία** (νέο, 01/08):
  - `deleteLeaveReq`, `deleteKudos`, `deleteClient` (μόνο αν ο πελάτης δεν έχει καμία επίσκεψη) — ελεύθερο hard delete, καμία ημερομηνιακή δέσμευση.
  - `hardDeleteVisit`, `hardDeleteExpense` — ΜΟΝΟ για ήδη soft-deleted εγγραφή, ΜΟΝΟ ίδια μέρα, ΜΟΝΟ πριν το Ζ κλείσει. Το soft-delete + audit trail παραμένει ο κανόνας για όλα τα υπόλοιπα — αυτό ήταν ρητά σκόπιμος, στενός compromise, όχι χαλάρωση του κανόνα.
- iOS PWA fix: Header μετατράπηκε από `sticky` σε `fixed` (ίδιο μοτίβο με το Nav) + `.hdr-spacer` — διορθώθηκε το πρόβλημα που το header "ταξίδευε" στο drag σε κοντές οθόνες. Επιβεβαιωμένο ΟΚ από τον Ανδρέα σε πραγματικό iPhone.
- **Εορτολόγιο επεκτάθηκε** (νέο, 02/08 βράδυ): `NAMEDAYS` πήγε από ~35 σε ~73 ημερομηνίες/~150 ονόματα, επιμελημένη λίστα υψηλής εμπιστοσύνης (ΟΧΙ η πλήρης βάση ~3.000 του eortologio.gr — ρητή απόφαση Ανδρέα, βλ. §Εκκρεμότητες). Προστέθηκε και κινητή γιορτή Ζωής (Ζωοδόχου Πηγής, Πάσχα+5). Βρέθηκε και διορθώθηκε bug στο φιλτράρισμα Γιώργου/Γεωργίας/Γεωργίου όταν μετατίθεται στη Δευτέρα του Πάσχα (verified με node script, Πάσχα 2026/2027).
- **ΝΕΟ: Ερώτηση της ημέρας + Ζωδιακό fun fact** (`QUESTIONS`/`questionOfDay()`, `ZODIAC`/`zodiacFactOn()`, component `DailySpark`) — ακόμα δύο "χαρούμενο layer" προσθήκες, στην Αρχική προσωπικού (`HomeStaff`) ΚΑΙ στην Αρχική Master (επέκταση 02/08 βράδυ, ρητό αίτημα Ανδρέα — "όλοι έχουν δικαίωμα στην ομιλία, πόσο μάλλον η Σοφία"), και στις δύο κάτω από το Celebrations. 118 πρωτότυπες ερωτήσεις-αφορμές κουβέντας (καμία σχέση με chat/messaging — ρητά αποκλεισμένο ξανά), κυλάνε 1/μέρα. Ζωδιακό fun fact = trivia (στοιχείο/πλανήτης/σύμβολο/πέτρα/χρώμα + 3 rotating traits ανά ζώδιο) για όποιο ζώδιο έχει "σειρά" σήμερα — ΟΧΙ ημερήσια πρόβλεψη (ρητή απόφαση Ανδρέα ώστε να μην τίθεται θέμα «ακρίβειας» σε κάτι εγγενώς επινοημένο). Verified: 0 κενά ημερολογιακές μέρες στο ζωδιακό, σωστό wraparound Αιγόκερω γύρω τον χρόνο, 118/118 μοναδικές ερωτήσεις.
- **ΝΕΟ: Παγκόσμιες/Διεθνείς Ημέρες** (`WORLD_DAYS`, `worldDayOn()`) — δεύτερο ανεξάρτητο "χαρούμενο layer", **145 ημερομηνίες / 152 εγγραφές** (value είναι array, μπορεί να έχει πάνω από μία τη ίδια μέρα). Ρητή απόφαση Ανδρέα (02/08): ΚΑΙ επίσημες θεσμικές (Ημέρα Γυναίκας, Βαλεντίνος, Ημέρα Ζώων) ΚΑΙ ανεπίσημες/κουλές (Talk Like a Pirate Day, Work Naked Day, Festivus κ.λπ. — πηγή timeanddate.com/holidays/fun) μαζί, χωρίς λογοκρισία λόγω σοβαρότητας — οι κουλές βγάζουν περισσότερη κουβέντα στο σαλόνι. Εμφανίζεται 🌍 δίπλα στο εορτολόγιο, στο Celebrations banner ΚΑΙ στις γραμμές ημερολογίου (προσωπικού + Master). Πλήρης λίστα προς έλεγχο: `Glamager_Eortologio_review.md` (δόθηκε στον Ανδρέα εκτός repo).
- Καλάθι επίσκεψης, εκπτώσεις, ΦΠΑ ανά είδος, soft delete + audit, κλείδωμα Ζ, Πελατολόγιο, Salon Staff module, Αναφορές/Απόδοση, Kudos, γενέθλια/εορτολόγιο — όλα όπως περιγράφονται στο `Glamager_Spec_v2.md` §1-§9 (θεωρούνται κλειστά, βλ. εκείνο το αρχείο για λεπτομέρειες — δεν επαναλαμβάνουμε εδώ).

### ΝΕΑ σήμερα (25/08)

- **Staff soft-deactivation**: νέο `active:true/false` flag ανά υπάλληλο (`isActiveStaff`/`activeStaff` helpers). Toggle στο Ρυθμίσεις → Προσωπικό, ορατό μόνο όταν επεξεργάζεσαι ήδη υπάρχον άτομο. Ανενεργό προσωπικό: εξαφανίζεται από το PIN operator picker και από νέες αναθέσεις γραμμής, αλλά ΟΛΟ το ιστορικό (visits/tips/ClientCard/product purchases) κρατάει το όνομα για πάντα — γκρι, με badge «(ανενεργός/-ή)». Ενεργό προσωπικό ταξινομείται πρώτο στη λίστα. Edge case καλυμμένο: επεξεργασία παλιάς εγγραφής με ανενεργό υπάλληλο δείχνει ακόμα το chip του στο picker.
- **🔒 Κλειστό μαγαζί** (`ShopClosureModal`, Αναφορές → 📅 Πρόγρ., πάνω-πάνω): νέο κουμπί για να σημειωθεί μαζικά μια μέρα κλειστή για όλο το ενεργό προσωπικό. Respectάρει active/inactive, δεν αγγίζει κανέναν που έχει ήδη κάτι καταχωρημένο εκείνη τη μέρα.
- **Bug fix — γλώσσα δεν άλλαζε άμεσα**: το `LANG` (module-level μεταβλητή, όχι React state) ενημερωνόταν μέσα σε `useEffect` που τρέχει ΜΕΤΑ το render, οπότε το UI έδειχνε την παλιά γλώσσα μέχρι να συμβεί κάποια άσχετη re-render (π.χ. κλείσιμο Ρυθμίσεων). Fix: dummy state (`bumpLangTick`) που αναγκάζει άμεσο δεύτερο render αμέσως μετά το `applyLang`.
- **Bug fix (δομικό) — πορτοκαλί TEST MODE μπάνερ "κολλούσε"** στη safe-area/notch περιοχή σε iPhone standalone PWA μετά το off. Το πρώτο fix (forced reflow) δεν έπιασε· το πραγματικό fix ήταν δομικό στο `Header` component — το `.hdr` πλέον ΔΕΝ μετακινείται/εξαφανίζεται ποτέ, το `TestBanner` ζει πάντα μέσα στο ίδιο fixed κουτί. ⚠️ Χρειάζεται επιβεβαίωση σε πραγματικό iPhone — δεν δοκιμάστηκε εδώ χωρίς συσκευή.
- **`DailySpark` widget επεκτάθηκε από 2 σε 4 rotating στοιχεία** (Αρχική προσωπικού + Master, κάτω από Celebrations): στην ερώτηση-της-ημέρας + ζωδιακό fact προστέθηκαν **Fun Fact ζώων** (`FUN_FACTS`, 51 entries, δίγλωσσο `{el,en}`, `funFactOn()`) και **Motto της ημέρας** (`MOTTOS`, 51 entries, `mottoOfDay()`). Σκόπιμα ΧΩΡΙΣ απόδοση σε συγκεκριμένο πρόσωπο ("είπε ο/η Χ") — οι περισσότερες «διάσημες ρήσεις» online είναι λάθος αποδοσμένες. ✅ **Επιβεβαιώθηκε με τον Ανδρέα (25/08): το `MOTTOS` είναι ΣΚΟΠΙΜΑ μόνο στα Αγγλικά** — το `mottoOfDay()` δεν ακολουθεί το `LANG` και αυτό είναι σωστό ως έχει, δεν χρειάζεται δίγλωσση μετάφραση. Δεν είναι εκκρεμότητα.
- **Security hardening (25/08, μετά από GitHub Secret Scanning alert):**
  - Βρέθηκαν 2 εκτεθειμένα Google API keys στο public repo. Το ένα ήταν το ζωντανό κλειδί του `glamager-hair-corner` σε `public/index.html` — φυσιολογικό/αναμενόμενο για Firebase web app (δεν είναι password), πραγματική προστασία = Auth + Security Rules. Το άλλο ήταν ΞΕΝΟ, παλιό κλειδί ενός προγενέστερου/ασύνδετου project (`salon-info-a23ac`, pre-Glamager SalonStaff) μέσα σε δύο νεκρά ιστορικά αρχεία.
  - **Διαγράφηκαν `reference/SalonStaff-original.html` και `reference/SalonPro-original.html`** — επιβεβαιώθηκε πρώτα ότι το `firebase.json` σερβίρει ΜΟΝΟ τον φάκελο `public/` (όχι `reference/`) και ότι κανένα σημείο του ζωντανού `index.html` δεν τα αναφέρει/φορτώνει· η λειτουργικότητά τους είναι ήδη πλήρως ενσωματωμένη στο σημερινό Glamager. Ασφαλής διαγραφή, καμία απώλεια λειτουργίας (το git ιστορικό τα κρατάει ούτως ή άλλως).
  - Το αντίστοιχο GitHub Secret Scanning alert έκλεισε χειροκίνητα ως **"Won't fix"** (το παλιό project δεν μας αφορά πια, το αρχείο έφυγε — αλλά το git ιστορικό πάντα θα το δείχνει, εκτός αν γίνει rewrite ιστορικού, που δεν αξίζει τον κίνδυνο για κάτι τόσο χαμηλής σημασίας).
  - **Firebase API key του ζωντανού project περιορίστηκε στο Google Cloud Console**: Application restrictions → Websites → `glamager-hair-corner.web.app/*`, `glamager-hair-corner.firebaseapp.com/*`, `localhost/*` (για τοπικά `firebase serve` τεστ). Το κλειδί πλέον δεν δουλεύει από πουθενά αλλού, ακόμα κι αν κάποιος το αντιγράψει από το public repo. Δεν επηρεάζει το deploy pipeline (το GitHub Actions χρησιμοποιεί ξεχωριστό service account).
  - Επιβεβαιώθηκε παράλληλα ότι τα `database.rules.json` είναι ήδη καλά κλειδωμένα: κανένα read/write χωρίς `auth != null`, admin-ευαίσθητα paths (staff/services/zmap/kudos/settings) περιορισμένα επιπλέον στα δύο Master emails.
- **`testMode` server-side protection (25/08, ερώτηση Ανδρέα "μόνο Master το ενεργοποιεί;"):** το UI ήδη το κρύβει από μη-Master (`{isMaster && (...)}`). Έλεγχος στο `database.rules.json` **του repo** έδειξε ότι το `testMode` δεν ήταν στη λίστα προστατευμένων πεδίων του `settings` node — τεχνικά ανοιχτό σε write από οποιονδήποτε συνδεδεμένο λογαριασμό. Πριν αλλάξω οτιδήποτε, έλεγξα τους **πραγματικά ζωντανούς** κανόνες απευθείας στο Firebase Console (Realtime Database → Rules) — και εκεί το `testMode` ΗΤΑΝ ήδη προστατευμένο, πανομοιότυπη διόρθωση με αυτή που ετοίμαζα. ⚠️ **Το repo's `database.rules.json` ήταν stale/out-of-sync με τους ζωντανούς κανόνες** — κάποια προηγούμενη session πρέπει να το είχε κάνει publish απευθείας από Firebase Console χωρίς να γίνει commit πίσω στο repo. Καμία αλλαγή χρειάστηκε στο Firebase (ήδη σωστό live) — μόνο sync του αρχείου στο repo ώστε να ξαναταιριάζουν. **Μάθημα:** τα `database.rules.json`/`firebase.json` δεν γίνονται deploy από το GitHub Actions (αυτό κάνει μόνο Hosting) — κάθε rules αλλαγή περνάει είτε από `firebase deploy --only database` είτε απευθείας από το Console, ΚΑΙ χρειάζεται ξεχωριστό commit στο repo για να μείνει το repo συγχρονισμένο. Το repo ΔΕΝ είναι αυτόματα η πηγή αλήθειας για rules, μόνο για hosting.

## i18n EN — έλεγχος + διόρθωση (02/08 βράδυ)

⚠️ Διόρθωση προηγούμενης καταγραφής: τα Αγγλικά ΔΕΝ ήταν αναβεβλημένα όπως έγραφε παλιότερη σημείωση — υπάρχει ήδη πλήρες, λειτουργικό EL/EN toggle (Ρυθμίσεις → Γλώσσα), με 394/394 UI labels πραγματικά μεταφρασμένα (verified προγραμματιστικά, όχι με μάτι), σωστή μορφή ημερομηνιών/μηνών ανά locale, σωστές αργίες σε EN.

**Βρέθηκε και διορθώθηκε πραγματικό bug:** `diffVisit()`/`diffExpense()` (το Master-only Audit Trail «τι άλλαξε» σε επεξεργασμένη εγγραφή) ήταν 100% hardcoded Ελληνικά, παρέκαμπτε το `t()` σύστημα εντελώς — ακριβώς σε οικονομικό/επιχειρησιακό περιεχόμενο (Πληρωμή/Κατηγορία/Ποσό/Τιμή/υπάλληλος άλλαξε κ.λπ.). Διορθώθηκε με `t()` + το ήδη υπάρχον `pmName()`· αφαιρέθηκε και το νεκρό/επικίνδυνο `pmLbl[]` που το προκαλούσε. Verified με runtime τεστ EL↔EN side-by-side (node) — σωστή έξοδος και στις δύο γλώσσες, ονόματα ειδών/κατηγοριών (δεδομένα χρήστη) σωστά ΔΕΝ μεταφράζονται.

Μικρή, χαμηλής προτεραιότητας εκκρεμότητα: τα ονόματα των εξαγόμενων αρχείων CSV (π.χ. `Glamager_Ταμείο_...csv`) μένουν πάντα Ελληνικά — μόνο το filename, το περιεχόμενο μέσα είναι σωστά μεταφρασμένο.

## Εκκρεμότητες / ΔΕΝ έχει γίνει ακόμα

- ~~Auth model per-υπάλληλο~~ **✅ Custom claims μέρος λύθηκε 26/08:** νέα Cloud Function `syncStaffClaims` (`functions/index.js`, Node.js 20, 2nd Gen, region `europe-west1`) διαβάζει το `staff` node και βάζει custom claim `{role}` σε κάθε πραγματικό λογαριασμό — καλείται χειροκίνητα από νέο κουμπί **"Συγχρονισμός δικαιωμάτων"** στις Ρυθμίσεις (Master-only), όχι αυτόματα. Deployed live, τρέχτηκε, **όλοι οι 5 λογαριασμοί επιβεβαιώθηκαν ✅** (verified από τον Ανδρέα). Τα `database.rules.json` ενημερώθηκαν να κοιτάνε `auth.token.role === 'master'` αντί για hardcoded emails σε όλα τα Master-only paths (`staff`/`services`/`products`/`zmap`/`kudos`/`expCats`/`fixedExpenses`/`settings`) — deployed live, `rules ... released successfully`. Χρειάστηκε πρώτα upgrade του Firebase project σε **Blaze plan** (pay-as-you-go — Cloud Functions δεν τρέχουν σε Spark). Πρακτικό κόστος: ~0€/μήνα (5 λογαριασμοί, function καλείται σπάνια — πολύ κάτω από το δωρεάν όριο 2εκ. invocations/μήνα). ⚠️ Το πλήρες "email invite" self-service UX (Cloud Function να στέλνει πρόσκληση, να δημιουργεί λογαριασμό) **ΔΕΝ έγινε** — οι 5 λογαριασμοί παραμένουν χειροκίνητα φτιαγμένοι όπως πριν, μόνο το claims/rules κομμάτι αναβαθμίστηκε. Ο περιορισμός device-login+PIN (βλ. σχόλιο στην κορυφή του `database.rules.json`) παραμένει ίδιος — το UI `isMaster` gating είναι ακόμα η πρώτη γραμμή άμυνας.
- ~~Εορτολόγιο μη αξιόπιστο/ελλιπές~~ **✅ Λύθηκε 02/08:** επιμελημένη λίστα ~150 ονομάτων (βλ. πάνω). Αν στην καθημερινή χρήση φανεί ότι λείπει συχνά κάποιο κοινό όνομα, προσθήκη σε επόμενο session — φυσικό QA loop μέσω χρήσης, όχι μπλοκάρισμα.
- ~~i18n EN~~ **✅ Ελέγχθηκε 02/08:** ήδη σχεδόν πλήρες, βρέθηκε+διορθώθηκε το audit trail bug (βλ. πάνω). Λείπει ακόμα μόνο η μετάφραση του σημερινού νέου περιεχομένου (ερωτήσεις/ζωδιακό/μερικά world days) — δεν είναι blocker, χαμηλή προτεραιότητα.
- Συνδρομές/portal/Stripe/store listing — δεν έχει ξεκινήσει.
- Native app packaging (App Store/Google Play) — επιλέχθηκε ρητά να ΜΗΝ γίνει τώρα· τρέχουσα κατεύθυνση είναι PWA (Add to Home Screen) με auto-deploy site, όχι Capacitor build.

## Standing κανόνες (μην τους ξεχνάμε σε νέο chat)

1. Soft-delete + audit trail σε visits/expenses είναι κλειδωμένος κανόνας — η μόνη εξαίρεση είναι το στενά scoped `hardDeleteVisit/Expense` παραπάνω (ίδια μέρα, πριν Ζ). Καμία γενικότερη χαλάρωση χωρίς ρητή νέα έγκριση.
2. Προσωπικό (κατ.2) ΔΕΝ βλέπει ποτέ tips/σύνολα συναδέλφων — μόνο δικά του.
3. `servesClients` καθορίζει attribution eligibility, ΟΧΙ ο ρόλος. Reception δεν πρέπει ΠΟΤΕ να εμφανίζεται ως επιλογή "ποιος εξυπηρέτησε".
4. Καμία αλλαγή/deploy χωρίς ρητή έγκριση του Ανδρέα πριν, ανά session — ισχύει ΑΚΟΜΑ πιο αυστηρά τώρα που το push = live deploy αυτόματα.

## Πώς προσθέτουμε νέο περιεχόμενο (ερωτήσεις/ζωδιακά/world days) χωρίς διπλότυπα

Το `index.html` (πίνακες `QUESTIONS`, `ZODIAC[].traits`, `WORLD_DAYS`, `NAMEDAYS`) είναι η **ΜΟΝΑΔΙΚΗ πηγή αλήθειας** — δεν κρατάμε ξεχωριστό "master αρχείο περιεχομένου" σκόπιμα, γιατί δύο αντίγραφα κάποια στιγμή θα ξεσυγχρονιστούν. Πρωτόκολλο για νέο chat/session που θέλει να προσθέσει περιεχόμενο:

1. Διάβασε τον τρέχοντα πίνακα πρώτα (`grep -n "const QUESTIONS"` κ.λπ. στο `public/index.html`).
2. Τσέκαρε προγραμματιστικά για διπλότυπα πριν προσθέσεις (π.χ. `new Set(QUESTIONS).size === QUESTIONS.length` σε node) — όχι με μάτι.
3. Πρόσθεσε τα νέα, ξανατρέξε το ίδιο τσεκ.
4. Ενημέρωσε τους αριθμούς εδώ στο PROJECT_STATUS.md (πόσες ερωτήσεις/entries τώρα).

Τρέχοντα μεγέθη (25/08/2026): 118 ερωτήσεις, 12 ζώδια × 3 traits (36), 145 ημερομηνίες/152 entries world days, 73 ημερομηνίες/~150 ονόματα namedays, 51 fun facts ζώων (δίγλωσσο), 51 mottos (μόνο EN, βλ. §ΝΕΑ σήμερα).
