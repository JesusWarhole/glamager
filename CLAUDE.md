# Glamager — οδηγίες για κάθε συνεδρία Claude / συνεργάτη

> Διάβασε πρώτα το `PROJECT_STATUS.md` (τρέχουσα κατάσταση, εκκρεμότητες, ιστορικό). Αυτό εδώ είναι οι
> **κανόνες δουλειάς** και ό,τι πρέπει να ξέρεις πριν αγγίξεις κώδικα. Τελευταία ενημέρωση: 25/10/2026.

## Τι είναι
PWA διαχείρισης κομμωτηρίου (ταμείο, έξοδα, πελατολόγιο, προσωπικό/βάρδιες, αναφορές, ΦΠΑ). Multi-tenant πάνω
σε Firebase (project `glamager-hair-corner`, RTDB `europe-west1`). **Είναι σε καθημερινή πραγματική χρήση από
το Hair Corner** — κάθε λάθος στο live κοστίζει σε πραγματικό μαγαζί.

## Κανόνες δουλειάς (απαράβατοι)
1. **Ποτέ αλλαγές απευθείας στο `main` ή στον φάκελο `C:\Users\andwa\Glamager`.** Δουλεύουμε στο worktree
   `C:\Users\andwa\Glamager-lab` σε branch, **ένα commit ανά εγκεκριμένη αλλαγή**, μετά PR προς `main`.
2. **Push/merge στο `main` = αυτόματο deploy live** (GitHub Actions, μόνο Hosting). Το merge το πατάει ο Ανδρέας.
   Μετά το merge: έλεγχος του Actions run και σύγκριση byte-προς-byte του live `index.html` με το `main`.
3. **Δοκιμές μόνο στο tenant `demo-shop`** (`demo.master@glamager.test`). **Ποτέ ανάγνωση ή εγγραφή δεδομένων
   του Hair Corner** — ούτε για «έλεγχο». Ούτε admin scripts που αγγίζουν `tenants/hair-corner/*`.
4. Πρώτα αναφορά του τι θα γίνει, μετά υλοποίηση. Κάθε οπτική αλλαγή με screenshots πριν/μετά.
5. Ο Ανδρέας γράφει ελληνικά· το τερματικό του είναι **PowerShell** (όχι `/c/...` διαδρομές Git Bash).
6. `firebase-key.json` (service account) μένει πάντα gitignored. Functions και database rules **δεν** ανεβαίνουν
   με το Actions — χειροκίνητα `firebase deploy --only functions|database`, μόνο με ρητή έγκριση.

## Αρχιτεκτονική κώδικα
- Η εφαρμογή είναι **ένα** React 18 script. Πηγή: `public/index.src.html` + `src/*.js` (κείμενα, εορτολόγιο,
  demo seeds — βλ. `src/README.md`). **`npm run build`** (`scripts/build.js`, esbuild) τα ενώνει μέσω
  `// @include src/<file>.js` και γράφει το `public/index.html`. **Ποτέ χειροκίνητη επεξεργασία του
  `public/index.html`** — είναι παραγόμενο (το Actions κάνει build ξανά πριν το deploy).
- Tailwind από CDN (δυναμικές κλάσεις επιτρέπονται), React/Babel/Firebase compat SDK από CDN.
- Όλα τα δεδομένα: `tenants/{tenantId}/...` μέσω του hook `useFirebaseState(path, seed, enabled)`
  (whole-array `.set()`, `_seeded/<path>` flag για «έχει αρχικοποιηθεί»).
- **Το seed ενός `useFirebaseState` παραμένει ΙΔΙΑ reference μέχρι το πρώτο snapshot.** Έτσι ξέρουμε αν
  φόρτωσαν τα δεδομένα: `staffLoaded = staff !== NO_STAFF && pins !== NO_PINS`, `settingsLoaded =
  settings !== DEMO_SETTINGS`. Το «Ποιος είσαι;» περιμένει και τα δύο (αλλιώς τρεμόπαιγμα).
- **Ποτέ σκληροκωδικοποιημένα δεδομένα συγκεκριμένου μαγαζιού** (ονόματα, emails, PIN) στον κώδικα — η
  σελίδα είναι δημόσια. Νέα μαγαζιά στήνονται με `scripts/admin/` (βλ. `scripts/admin/README.md`).
- Admin scripts: `scripts/admin/` (όχι στο `functions/`, για να μην ανέβουν ποτέ ως Cloud Functions).

## Design system (από το σχεδιαστικό πέρασμα 24–25/10, impeccable polish)
- **Χρώματα = CSS tokens** στο `:root` (light) και `html.dark` (dark): `--danger*`, `--warn*`, `--info`,
  `--ok*`, `--gold*`, `--festive*`, `--st-<status>` (+`-bg`, `-bd`) για τις 9 καταστάσεις ημερολογίου,
  `--day-*`. Όχι hardcoded hex σε νέο κώδικα.
- Accent ανά μαγαζί: `applyAccent()` γράφει inline `--accent*`· σε dark τα `--accent-50/-100` αφαιρούνται
  (ισχύει το `html.dark`). Το `applyTheme()` ξανατρέχει το `applyAccent()`. «Αυτόματα» ακούει `matchMedia`.
- Header/hero/login σε dark: πιο σκούρο πράσινο με `color-mix` (`html.dark .hdr/.hero`).
- **Γράμματα:** `font-black` ΜΟΝΟ σε ποσά (`.amt`), μεγέθη ≥16px και τίτλους· όλα τα άλλα `font-bold`.
  **Κανένα κείμενο κάτω από 12px** (`text-xs`).
- **Εικονίδια:** μόνο το σετ `paths`/`<Ic n="…"/>` (24px, stroke 2). Όχι emoji στη θέση εικονιδίων σε νέα UI.
- **Ποσά:** πάντα `fmt(v)` → αρνητικά `−€106,45` (τυπογραφικό μείον + U+2060 ώστε να μη σπάει γραμμή).
  Ποτέ `'-'+fmt(x)` με το χέρι. Μηδέν δεν βάφεται κόκκινο.
- **Πεδία χρημάτων:** `<CInput … decimal/>` (δέχεται κόμμα και τελεία ως υποδιαστολή). Ακέραια πεδία
  (λεπτά, ΦΠΑ %, απόθεμα) μένουν `type="number"`. Νέα πεδία ποσών ΠΑΝΤΑ με `decimal`.
- Στόχοι αφής ≥44px, `aria-label` σε κουμπιά-εικονίδια. Οριζόντιες λωρίδες κύλισης: κλάση `hscroll`.
- Shared components: `Sheet`, `CloseBtn`, `SaveCancel`, `reportSaveError`, `ClientAvatar`, `BrandMark`
  (λευκό σήμα — εμφανίζεται μόνο πάνω σε πράσινο).
- Κείμενα UI μόνο μέσω `t('key')` στο `src/strings.js` (ελληνικά + αγγλικά). Όχι αγγλικά ή «developer»
  κείμενα στο ελληνικό UI (λεξιλόγιο του χώρου όπως tips/POS μένει).

## Εργαλεία / παγίδες
- Τοπικά: `glamager-lab-demo` στο `.claude/launch.json` σερβίρει το `Glamager-lab/public` στο `localhost:5003`
  (το API key δέχεται localhost· τα preview URLs των PR **δεν** κάνουν login — 403 referrer).
- Στο Windows worktree τα αρχεία μπορεί να είναι CRLF — τα scripts επεξεργασίας να το χειρίζονται.
- Screenshots: το Browser pane κόβει την εικόνα σε DPR 2· αξιόπιστη λήψη μέσα από τη σελίδα με
  modern-screenshot (βλ. `shot-helper` στο launch.json) με απενεργοποιημένα animations.
- Επαναφορά αν κάτι πάει στραβά: (1) Firebase Console → Hosting → Release history → Rollback (άμεσο),
  (2) Revert του PR στο GitHub ώστε να μη ξαναβγεί με το επόμενο push. Κανένα από τα δύο δεν αγγίζει δεδομένα.
  Backup tag της έκδοσης πριν το cleanup: `backup/main-pre-cleanup-2026-10-25` (= `4e5118a`).
