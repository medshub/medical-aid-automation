# Production readiness assessment

**Date:** 2026-10-28  
**App:** https://medical-aid-automation.vercel.app/

## Verdict

**Production-grade for core chronic medicine support**, with multi-org isolation, audit trail, abuse protections, and a consistent **Aida** design system (cream paper, forest green CTAs, Fraunces/Manrope, `aid-display` titles).

**Staff monthly path is complete end-to-end:**  
**1 Queue → 2 Claims → 3 Pharmacy → 4 EVA split → 5 Programs → 6 Refills**  
(FlowSteps on ops pages · AppNav · mobile staff bar · Guide · Status checklist).

## Hardening completed

- [x] **Claims list scoped** by org
- [x] **Pharmacy pick-list** requires ops auth + org scope
- [x] **Rate limits** on public intake and request-status
- [x] **Org backfill** API + seeded orgs (`ARMANIOUS`, `EVA`, `TAGMEEL`, `DEFAULT`)
- [x] Company → org matching via code / name / `settings.aliases`
- [x] **Audit events** (intake, enroll, claim, pharmacy, org approval)
- [x] **Admin audit panel** with action + org filters
- [x] **Org registration** public page + Admin approve/reject flow
- [x] **Smoke workflow** health + public pages (every 6h + push)
- [x] **Expanded smoke** — search_med (≥1 hit), estimate, status shape, anon 401, `/submit`, health asserts neon + egyptian_catalog + formulary + intake + process_secret
- [x] **Optional staff smoke** — when GitHub secret `SMOKE_PROCESS_SECRET` is set (= Vercel `PROCESS_SECRET`), hits `/api/admin/org-stats`, `/api/admin/audit`, and staff pages `/pharmacy` `/programs` `/refills` `/status` with `x-process-secret`
- [x] Staff session `org_scope` + memberships
- [x] **Aida identity UX** — cream paper, forest green, serif titles on public surfaces
- [x] **Aida staff/tool titles** — Queue → Pharmacy → EVA → Programs → Refills, Reports, WhatsApp, Status, Admin, Safety, Dry-run, Inventory, PSP, Care Line, Documents, Roles, Review, Submit, DDInter, Health sync, PMS, Synonyms, Formulary, Requests, Refill safety, OCR, Analytics, Combinations, Visualize
- [x] **6-step FlowSteps** on Queue, Claims, Pharmacy, EVA, Programs, Refills
- [x] **AppNav + mobile staff bar** numbered 1–6 including EVA
- [x] **Programs / Refills** responsive cards (mobile) + data tables (desktop)
- [x] Detail pages keep **mono program codes** (`/programs/[id]`, `/refills/[id]`) by design
- [x] **Three-door model** documented (`docs/schema/006_identity_data_flow.md`): public / employee / staff
- [x] **Employee portal** privacy gate + staff message reply threads
- [x] **Request status** optional verification unlocks full names; others masked; **Share / Copy link**
- [x] **Org register** data-boundary copy + multi-tenant isolation messaging
- [x] **Staff sign-in** three-doors map + Google CTA (when Neon Auth configured)
- [x] **Health checks** for Neon Auth + staff access (`/api/health`)
- [x] **Intake cost estimate** from Egyptian catalog (~25k meds) + price disclaimer
- [x] **Intake drafts** auto-save, last-request link, renew prefill
- [x] **Admin access card** shows Google vs PROCESS_SECRET readiness
- [x] **Home** surfaces estimate + share hints
- [x] **Guide** covers estimate, share, and six staff steps (Arabic + English)
- [x] **Status** monthly ops checklist numbered 1–6
- [x] **Neon** system of record · Egyptian drug catalog primary · MSH fallback
- [x] Soft **DHIS2** hooks (optional HMIS)
- [x] Feature flags: WHO assessment + AI adherence coach **off until management enables**

## Optional next (env / ops — not code blockers)

- [ ] Set `NEON_AUTH_BASE_URL` + `OPS_ALLOWED_EMAILS` + `NEON_AUTH_COOKIE_SECRET` for Google staff (see `docs/NEON_AUTH.md`)
- [ ] Set `ORG_REGISTRATION_MODE=approval` when open registration should require review
- [ ] Staging environment (Vercel Preview + Neon branch) — see `docs/STAGING.md`
- [ ] Live WhatsApp credentials (Meta or Twilio) when outreach goes live
- [ ] Enable staff smoke: GitHub → Settings → Secrets → `SMOKE_PROCESS_SECRET` (= production `PROCESS_SECRET`)
- [ ] Row-level Neon policies if multi-tenant strictness is required beyond app filters

## Live health snapshot (typical)

| Check | Expectation |
|-------|-------------|
| `/api/health` | `ok: true` |
| Neon | Connected · chronic programs populated |
| Egyptian catalog | ~25k drugs · MSH fallback |
| Staff access | `PROCESS_SECRET` unlock (Google when Neon Auth set) |
| WhatsApp | `mode=none` until provider env is set |

## Multi-org quick reference

| Surface | Path |
|---------|------|
| Register org | `/org/register` |
| Pending requests | Admin → Organization requests |
| Active orgs | Admin → Organizations |
| Audit | Admin → Audit log |
| Env gate | `ORG_REGISTRATION_MODE=approval` |
| Staff Google setup | `docs/NEON_AUTH.md` |
| Staging setup | `docs/STAGING.md` |
| Staff smoke | Secret `SMOKE_PROCESS_SECRET` |
