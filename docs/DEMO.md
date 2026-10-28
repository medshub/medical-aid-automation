# Live demo script (5–10 minutes)

**URL:** https://medical-aid-automation.vercel.app  
**Showcase page:** https://medical-aid-automation.vercel.app/demo  
**Guide:** https://medical-aid-automation.vercel.app/guide

## Opening (30 sec)

> We replaced Google Forms + spreadsheets with a production platform for **monthly chronic medicine support**. Beneficiaries submit without an account. Staff run a numbered path: Queue → Claims → Pharmacy → EVA → Programs → Refills. Data lives in **Neon Postgres**. Medicine matching uses the **Egyptian catalog** first.

## Act 1 — Beneficiary (2–3 min)

1. Open **Home** → point at three doors: Submit · Status · Profile.  
2. Open **Submit** (`/intake`) — show company, patient, medicine search, optional **EGP estimate**.  
3. Mention **auto-save draft** and **Request ID** after submit.  
4. Open **Status** — paste ID, show **masking** + **Share**.  
5. Open **Profile** (`/me`) — company + employee ID → **2027 renew** before **10 Dec 2026**.

## Act 2 — Staff (3–5 min)

1. Home → **Staff unlock** (Google or PROCESS_SECRET).  
2. Walk the strip: **1 Queue → 2 Claims → 3 Pharmacy → 4 EVA → 5 Programs → 6 Refills**.  
3. Queue: Process waiting → enroll + claim drafts.  
4. Pharmacy / EVA: CSV for warehouse vs external.  
5. Optional: Safety queue, Reports, WhatsApp dry-run.

## Act 3 — Trust & scale (1–2 min)

- `/status` health (Neon, catalog, unlock).  
- `/org/register` for other employers.  
- Privacy: public surface is submit + status + profile only.  
- Optional: WhatsApp, DHIS2, WHO assessment (flags off until management approves).

## Closing line

> Live today: **medical-aid-automation.vercel.app** — try `/demo` or `/guide`. Organizations can register; ops stay locked behind staff auth.

## Sample data note

Use a **test employee ID** from your roster in a non-production window, or walk UI only without submitting real PHI in shared sessions.
