# scripts/admin — χειροκίνητα admin εργαλεία (ΟΧΙ Cloud Functions)

Μεταφέρθηκαν εδώ από το `functions/` (24/10/2026) ώστε να μην ανέβουν ποτέ κατά λάθος
με `firebase deploy --only functions`. Τρέχουν **τοπικά** με το service-account key
(`firebase-key.json` στη ρίζα του repo, gitignored) και έχουν **πλήρη πρόσβαση** στη βάση.

| Script | Τι κάνει | Αγγίζει |
|---|---|---|
| `setupDemoShop.js` | Στήνει το `demo-shop` tenant (staff, seed flag, claims) | `tenants/demo-shop/*`, `_seeded/tenants/demo-shop/*`, claims του `demo.master@glamager.test` |
| `fixDemoShopStaff.js` | Διόρθωση staff εγγραφών του demo-shop | `tenants/demo-shop/staff` |
| `fixMissingPins.js` | Δίνει αρχικό PIN σε όποιον δεν έχει | `tenants/demo-shop/pins` |
| `checkDemoAccount.js` | Read-only έλεγχος του demo λογαριασμού | τίποτα (μόνο ανάγνωση) |

Χρήση (από τη ρίζα του repo, χρειάζεται `functions/node_modules` εγκατεστημένο — `cd functions && npm ci`):

```bash
node scripts/admin/checkDemoAccount.js
```

Κανόνας: κάθε script δηλώνει στην κορυφή του **ακριβώς** ποια paths αγγίζει. Ποτέ script εδώ μέσα
χωρίς αυτή τη δήλωση, και ποτέ script που αγγίζει `tenants/hair-corner/*`.
