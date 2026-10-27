# Glamager

PWA διαχείρισης κομμωτηρίου: ταμείο και Ζ, έξοδα και ΦΠΑ, πελατολόγιο, προσωπικό και βάρδιες, αναφορές.
Multi-tenant πάνω σε Firebase. Σε καθημερινή χρήση από το Hair Corner.

## Πού ξεκινάς
| Αρχείο | Για τι |
|---|---|
| `PROJECT_STATUS.md` | Τρέχουσα κατάσταση, εκκρεμότητες, ιστορικό αποφάσεων — **διάβασέ το πρώτο** |
| `CLAUDE.md` | Κανόνες δουλειάς, αρχιτεκτονική, design system, παγίδες (το διαβάζει αυτόματα το Claude Code) |
| `AGENTS.md` | Δείκτης για Codex/ChatGPT: παραπέμπει στα `PROJECT_STATUS.md` και `CLAUDE.md` |
| `src/README.md` | Τα κομμάτια του app έξω από το `index.src.html` (κείμενα, εορτολόγιο, demo seeds) |
| `scripts/admin/README.md` | Χειροκίνητα admin scripts (demo-shop) |
| `reference/` | Spec, roadmap, ιστορικό αποφάσεων |

## Build και deploy
```bash
npm ci
npm run build
```
- Πηγή: `public/index.src.html` + `src/*.js` → παράγεται το `public/index.html` (μην το επεξεργάζεσαι με το χέρι).
- **Push/merge στο `main` = αυτόματο deploy live** στο Firebase Hosting (GitHub Actions). Κάθε PR ανεβαίνει
  σε προσωρινό preview.
- Cloud Functions και database rules ανεβαίνουν μόνο χειροκίνητα (`firebase deploy --only functions|database`).

## Κανόνες με μια ματιά
Αλλαγές μόνο μέσω branch + PR, δοκιμές μόνο στο `demo-shop`, ποτέ πρόσβαση σε δεδομένα του Hair Corner.
Λεπτομέρειες στο `CLAUDE.md`.
