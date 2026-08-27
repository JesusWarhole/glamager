> Master plan μόνο — checklist. Καθημερινές λεπτομέρειες/decisions ζουν στο `SESSION_DECISIONS.md`, τρέχον status στο `PROJECT_STATUS.md`, τρέχουσα βάρδια στο `HANDOFF/latest.md`. Ενημέρωση: 27/08/2026.

# GLAMAGER — Commercial Roadmap

## P0 — Θεμέλιο (μπλοκάρει το "δεύτερο πραγματικό μαγαζί")

- [x] 1. Backup/export — ενεργοποίηση Firebase Backups tab (⚠️ ΑΚΟΜΑ δεν έχει γίνει, χρειάζεται πριν Σεπτέμβριο)
- [x] 2. Multi-tenant architecture — tenant model, ολοκληρώθηκε 27/08 (`tenants/hair-corner/...`)
- [ ] 3. Auth / memberships / roles — επόμενο βήμα, **περιμένουμε ρητά τον Ανδρέα να ξεκινήσει**
- [~] 4. Firebase Security Rules — μερικώς έγιναν μαζί με το #2 (tenant paths, `pins` master-only), θέλει ξανά δουλειά μαζί με το #3
- [ ] 5. Per-record data model (αντικατάσταση whole-array `.set()` με `/visits/{id}` + `update()`)

## P1 — Αξιοπιστία

- [ ] 6. Migration (export→transform→validate→cutover) — πιθανότατα ΠΕΡΙΤΤΟ αν τα P0 κλείσουν πριν αρχίσει πραγματική χρήση· fallback μόνο
- [ ] 7. Multi-device / atomic operations
- [ ] 8. Offline + sync
- [ ] 9. Testing / hardening

## P2 — Εμπορικό επίπεδο

- [ ] 10. Commercial onboarding (νέο μαγαζί self-service)
- [ ] 11. Trial + subscription + billing (Stripe)
- [ ] 12. Hair Corner → Tenant #001 (πραγματική έναρξη, στόχος αρχές Σεπτεμβρίου 2026)
- [ ] 13. First external salon (ο πρώτος πελάτης εκτός Hair Corner)

## P3 — Αργότερα, μόνο αν χρειαστεί πραγματικά

- [ ] 14. Vite/React refactor (ΤΕΛΕΥΤΑΙΟ — μόνο αν 2ος developer/πραγματικό perf πρόβλημα, όχι blocker για launch)
- [ ] 15. Scale (πέρα από τα πρώτα λίγα μαγαζιά)

## Το ορόσημο που μετράει

> "Μπορώ να δημιουργήσω αύριο ένα δεύτερο salon και να είμαι 100% σίγουρος ότι τα δεδομένα του δεν μπορούν να μπλεχτούν με του Hair Corner;"

Όχι ακόμα (P0 #3-#5 ανοιχτά) — αλλά πολύ πιο κοντά μετά το #2.
