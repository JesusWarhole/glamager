# src/ — κομμάτια του app που ενώνονται στο build

Το app παραμένει **ένα** script μέσα στο `public/index.html`. Από 24/10/2026 (Cleanup #4) τρία μεγάλα,
καθαρά-δεδομένα blocks ζουν σε δικά τους αρχεία εδώ και ενώνονται από το `scripts/build.js`
(`npm run build`) στο σημείο όπου το `public/index.src.html` έχει τη γραμμή `// @include src/<file>.js`.

| Αρχείο | Περιεχόμενο | Πότε το αγγίζεις |
|---|---|---|
| `strings.js` | `LANG`, `applyLang()`, `STRINGS` (EL/EN), `t()` | νέο/αλλαγμένο κείμενο UI, μετάφραση |
| `happy-content.js` | εορτολόγιο, παγκόσμιες ημέρες, ερώτηση ημέρας, ζώδια, fun facts, mottos + lookup helpers | προσθήκη ονόματος/ημέρας/ερώτησης |
| `demo-data.js` | `DEMO_*` seeds (defaults των `useFirebaseState`) | αλλαγή αρχικού καταλόγου/templates για νέο tenant |

Κανόνες:
- **Δεν είναι ES modules.** Ό,τι δηλώνεται εδώ είναι top-level `const`/`let` στο ίδιο scope με το υπόλοιπο app,
  ακριβώς όπως όταν ήταν μέσα στο `index.src.html`. Καμία `export`/`import`.
- **Σειρά = σειρά των markers.** Κάθε αρχείο μπορεί να χρησιμοποιεί μόνο ό,τι ορίζεται ΠΡΙΝ το marker του
  στο `index.src.html` (βλ. «Εξαρτήσεις» στο header κάθε αρχείου).
- **Δεν σερβίρονται.** Ο φάκελος είναι έξω από το `public/`, άρα το Firebase Hosting δεν τον βλέπει.
- Μετά από κάθε αλλαγή: `npm run build` (τρέχει και αυτόματα στο GitHub Actions πριν το deploy).
- Αν το esbuild δείξει σφάλμα με αριθμό γραμμής, η γραμμή αναφέρεται στο **ενωμένο** source, όχι στο
  `index.src.html` — ψάξε με το κείμενο της γραμμής.
