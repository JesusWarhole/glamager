#!/usr/bin/env node
'use strict';
/* 29/08/2026 (fix #3 — Babel/slow-reload) — αντικαθιστά το babel-standalone runtime transform
   (γινόταν ΜΕΣΑ στον browser, σε ΚΑΘΕ άνοιγμα της εφαρμογής, ~20-30" σε πραγματικό tablet/κινητό)
   με ένα ΜΙΑ φορά build step, εδώ, πριν το deploy. Τρέχει esbuild πάνω στο ίδιο ακριβώς JSX που
   υπήρχε πριν — καμία αλλαγή λογικής, μόνο ΠΟΤΕ γίνεται η μεταγλώττιση (build time, όχι runtime).

   Πηγή αλήθειας πλέον: public/index.src.html (εκεί γίνονται όλες οι μελλοντικές αλλαγές κώδικα).
   public/index.html είναι το ΠΑΡΑΓΟΜΕΝΟ αρχείο (αυτό που πραγματικά σερβίρει το Firebase Hosting)
   — ξαναγράφεται πλήρως από αυτό το script, ΠΟΤΕ να μην επεξεργαστεί κανείς με το χέρι.

   Χρήση: `npm run build` (τοπικά, πριν testing στο localhost) — ΚΑΙ τρέχει αυτόματα στο GitHub
   Actions πριν από κάθε deploy (βλ. .github/workflows/firebase-hosting-merge.yml), ώστε το
   deployed αρχείο να είναι ΠΑΝΤΑ φρέσκο ακόμα κι αν κάποιος ξεχάσει να τρέξει build τοπικά. */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const SRC = path.join(__dirname, '..', 'public', 'index.src.html');
const OUT = path.join(__dirname, '..', 'public', 'index.html');

const BABEL_CDN_LINE_RE = /^[ \t]*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone\/[^"]+"><\/script>\n/m;
const APP_SCRIPT_RE = /<script type="text\/babel">\n([\s\S]*?)\n<\/script>/;

function build() {
  const html = fs.readFileSync(SRC, 'utf8');

  const babelCdnMatch = html.match(BABEL_CDN_LINE_RE);
  if (!babelCdnMatch) {
    throw new Error('[build] Δεν βρέθηκε το babel-standalone CDN <script> tag στο ' + SRC + ' — έλεγξε τη δομή του αρχείου.');
  }

  const appMatch = html.match(APP_SCRIPT_RE);
  if (!appMatch) {
    throw new Error('[build] Δεν βρέθηκε το <script type="text/babel"> block στο ' + SRC + ' — έλεγξε τη δομή του αρχείου.');
  }
  const jsxSource = appMatch[1];

  const { code, warnings } = esbuild.transformSync(jsxSource, {
    loader: 'jsx',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'es2019',
    minify: false,
  });
  warnings.forEach(w => console.warn('[build] esbuild warning:', w.text));

  let out = html.replace(BABEL_CDN_LINE_RE, '');
  out = out.replace(APP_SCRIPT_RE, `<script>\n${code}\n</script>`);

  if (out.includes('babel-standalone') || out.includes('text/babel')) {
    throw new Error('[build] Sanity check FAILED: το παραγόμενο αρχείο ακόμα αναφέρει babel-standalone/text/babel.');
  }
  if (!/ReactDOM\.createRoot\(document\.getElementById\((['"])root\1\)\)\.render\(/.test(out)) {
    throw new Error('[build] Sanity check FAILED: δεν βρέθηκε το ReactDOM.createRoot(...) render call στο παραγόμενο αρχείο.');
  }

  fs.writeFileSync(OUT, out);
  console.log(`[build] OK: ${path.relative(process.cwd(), SRC)} -> ${path.relative(process.cwd(), OUT)} (${code.length} chars compiled JS, ${warnings.length} warnings)`);
}

build();
