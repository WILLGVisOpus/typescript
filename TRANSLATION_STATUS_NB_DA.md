# Translation status: nb (Norwegian Bokmål) + da (Danish)

This branch (`i18n/add-nb-da`) **scaffolds** the two new locales but is **not** ready for upstream PR submission yet — it needs native-speaker review and completion.

## What this branch does

- Adds `locales/nb.json` — full key parity with `en.json` (269 user-visible strings).  10 keys (~4%) carry draft Norwegian Bokmål translations from the VisOpus team's initial contribution; the remaining 259 keys hold their English source as a runtime-safe fallback.
- Adds `locales/da.json` — same structure for Danish.
- Registers both locales in `src/lib/i18n.ts` (`LANGS` array) so they appear in the language switcher.
- The translated subset covers: common (back/next/etc.), loginname, password (incl. set/verification), passkey, otp, register, verify, errors, success.

## Why incomplete

Producing all 269 strings without a native speaker risks low-quality translations that hurt the user experience.  The VisOpus migration plan's D2 commits to **English fallback at launch + open upstream PR** — the fallback is what's running in production while we coordinate the proper translation effort.

## What's needed before opening the upstream PR

1. **Native-speaker review of the existing 10 translated keys** — verify the OTP / verification / login terminology matches what real Norwegian / Danish users expect.  Notable terminology choices made:
   - Norwegian: "verifiseringskode" (alt: "engangskode")
   - Danish: "verifikationskode" (alt: "engangskode")
   - Both: "passnøkkel" / "adgangsnøgle" for "passkey"
2. **Complete the remaining 259 keys** for both locales.  Suggested workflow:
   - Diff `locales/nb.json` against `locales/en.json` — every value still in English needs a translation.
   - Same for `da.json`.
3. **Smoke test in `pnpm dev`** at `?ui_locales=nb` and `?ui_locales=da` to confirm no missing-key warnings.

## When ready

```bash
# from a clone of this fork
git checkout i18n/add-nb-da
# complete translations in locales/nb.json and locales/da.json
# smoke test
pnpm install && pnpm dev
# commit & push
git commit -am "i18n: complete Norwegian and Danish translations"
git push origin i18n/add-nb-da
gh pr create --repo zitadel/typescript --title "feat(i18n): add Norwegian Bokmål (nb) and Danish (da)" \
  --body "$(cat ../zitadel-i18n-pr-draft/PR-BODY.md)"
```

(Adjust the PR body path to wherever you keep the original draft.)
