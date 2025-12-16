# Beta User Invite Checklist (First 3–5 Users)

This checklist is for inviting the first small set of Beta users to Harmonyk.  
The goal is to keep the experience controlled, predictable, and easy to debug.

---

## 1. Pre-invite checks

- [ ] Run through the golden path yourself (Dashboard → Workbench → Builder → Vault → Activity → Mono) and confirm no P0 issues.

- [ ] Verify `/dev/health` shows:

  - App version set or "dev-local" is acceptable.

  - `NEXT_PUBLIC_SUPABASE_URL` present.

  - Feature flags in the expected states for Beta.

- [ ] Review `docs/BETA_CHECKLIST.md` and confirm all items marked DONE are truly satisfied.

- [ ] Scan `docs/W6_ISSUES.md` to ensure:

  - No open P0 issues.

  - Remaining issues are clearly labeled P1/P2.



---

## 2. Choose initial Beta users

- [ ] Identify 3–5 people who:

  - Fit the target persona (founders, operators, doc-heavy workflows).

  - Are comfortable with early-stage software and giving blunt feedback.

- [ ] For each user, record:

  - Name

  - Email

  - How you know them

  - What kind of docs/workflows they'll likely test



---

## 3. Setup & access

For each Beta user:



- [ ] Create or confirm their account in Supabase / auth system.

- [ ] Confirm they can log in and reach the Dashboard.

- [ ] Optionally pre-load:

  - 1–2 example docs into their Vault for quick testing (if appropriate).

  - A short note or example Activity entry.



---

## 4. Guidance & expectations

- [ ] Send them the **Beta invite blurb** (in `BETA_INVITE_BLURB.md`) customized with:

  - Their name

  - Any specific docs/workflows you'd like them to focus on

- [ ] Include a very short "ask":

  - Run the golden path once (Analyze → Builder → Vault → Activity → Mono).

  - Send you 3–5 bullets on:

    - What was confusing.

    - What felt slow or broken.

    - What they'd want to see next.



---

## 5. After they test

For each Beta user:



- [ ] Capture their feedback in a simple doc or note.

- [ ] Translate feedback into:

  - New items in `W6_ISSUES.md` (or Week 7+ issue doc) with severities.

  - Potential Playbooks/automation ideas for future weeks.

- [ ] Decide whether to:

  - Keep them in the Beta for ongoing feedback.

  - Pause access if the product changes direction significantly.



---

## 6. When ready to scale beyond 3–5 users

- [ ] Re-run this checklist for a second wave of users.

- [ ] Confirm any new P0s from the first cohort are resolved.

- [ ] Consider adding a lightweight feedback form or in-app survey.

