# PGW1 Regression Checklist (10-minute smoke test)

Goal: prevent re-breaking Builder/Vault/Share/Passcode.

Run this checklist after:
- schema/migration changes
- any change to share APIs or vault UI
- deployment to production

## A) Builder → Vault
1) Open **Builder**.
2) Create a doc from a template (any simple prompt).
3) Confirm it creates successfully and redirects/returns a doc reference.
4) Open **Vault** and confirm the new doc appears.

## B) Share (no passcode)
5) In Vault, click **Share** and create a share link with **no passcode**.
6) Open the share link in an incognito/private window.
7) Confirm the doc renders (title + content).

## C) Share (passcode)
8) Create another share link, this time with a **passcode** set.
9) Open the share link in an incognito/private window.
10) Confirm you get a **Passcode required** gate.
11) Enter a WRONG passcode → confirm you get **invalid passcode**.
12) Enter the RIGHT passcode → confirm it unlocks and renders.
13) Refresh the share page → confirm it stays unlocked (cookie/session works).

## D) Expiry + revoke (if UI supports it)
14) Create a share link with a short expiry, wait until after expiry → confirm **404/Expired**.
15) Revoke a share link → confirm it no longer renders.

## E) Counters + logging (best-effort)
16) Confirm view_count increments OR events/activity log records a view.

## Pass criteria
- No console errors in the share page
- Wrong passcode never unlocks
- Right passcode unlocks reliably
- Builder creates docs and Vault lists them

