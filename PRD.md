# NETRA AI — Product Requirements Document (PRD)

**Version**: 1.0.0
**Status**: Draft for review
**Owner**: Product & Engineering (State Police Datathon 2026)
**Last Updated**: September 2026

---

## Document Intent

This document was produced collaboratively by applying three working modes:

- **`MODE: DEEP_THINK`** — vision-level innovation, hidden opportunities, feature trade-offs, and a Lean MVP.
- **`MODE: DEEP_WORK`** — decomposition into milestones with acceptance criteria, dependencies, and review gates.
- **`MODE: ARCHITECTURE_REVIEW`** — scalability, maintainability, security, observability, and cost analysis.

Each section is annotated with its originating mode so reviewers can trace decisions back to the working method that produced them.

---

# 1. Executive Summary

`MODE: DEEP_THINK`

NETRA AI turns a real FIR (First Information Report) dataset — 29 CSV files, ~2,500 cases, ~4,000 accused, ~2,900 victims — into **operational crime intelligence**. It is not a record-keeping system; it is an **analytics layer** that sits on top of police records and produces insight, not just data.

**The Core Problem We Solve, Restated:** Police data sits in disconnected spreadsheets. Investigators cannot see *where* crime concentrates, *who* reoffends, *how* offenders associate, or *what* is coming next. NETRA AI makes those patterns discoverable within seconds, without requiring a data analyst on staff.

> **Why (the "Why" behind the feature):** Southwest-style reactive policing means resources chase incident reports after the fact. NETRA AI flips this by making *pattern*, *association*, and *prediction* first-class citizens — the first step toward predictive, intelligence-led policing.

### North-Star Metrics

| Objective | Metric | Target |
| :--- | :--- | :--- |
| Adoption | Weekly active investigator users | > 200 |
| Insight speed | Time from query to answer (AI assistant) | < 5 s |
| Decision confidence | % of district briefs exported per week | > 60% |
| Coverage | Districts with live analytics | 32 / 32 |

---

# 2. Problem Statement & Opportunity

`MODE: DEEP_THINK` + `MODE: ARCHITECTURE_REVIEW`

## 2.1 Pain Points (Current State)

1. **Data silos** — 29 CSV files with cross-reference keys (`CaseMasterID`, `PersonMasterID`, `AccusedMasterID`) but no join logic at rest.
2. **No predictive capability** — everything is retrospective; nothing forecasts load on districts.
3. **Manual association discovery** — finding co-accused networks or repeat offenders requires manual cross-referencing.
4. **No natural-language interface** — querying requires technical skill.
5. **No audit trail** — no way to know who accessed what intelligence, when.

## 2.2 Why Now / Opportunity

- A **real, government-provided dataset** removes the "demo data" credibility gap.
- **Serverless + free-tier hosting** (Vercel + Render + Zoho Catalyst) makes a production-shaped deployment possible at near-zero cost.
- **Agentic/AI assistant** patterns are now mature enough to power a rule-based assistant today and swap to a true LLM (Gemini) without changing the frontend contract.
- The **Datathon** provides an evaluation lens and a realistic constraint (no enterprise license, no heavy infra).

---

# 3. Goals & Non-Goals

`MODE: DEEP_THINK` + `MODE: DEEP_WORK`

## 3.1 Goals

- G1: Extract operational intelligence from raw FIR CSV data (hotspots, trends, networks, repeat offenders).
- G2: Forecast district-level crime load to support resource allocation.
- G3: Provide a natural-language assistant that answers investigator questions.
- G4: Produce reproducible, exportable district briefs (CSV/JSON).
- G5: Maintain a transparent, auditable intelligence trail.

## 3.2 Non-Goals (explicitly out of scope for v1)

- NG1: Real CRUD on police records (this is read-only analytics; records editing lives in other systems).
- NG2: Real authentication / RBAC beyond demo credentials (NG for v1; see Future).
- NG3: Replacing any existing police case-management system.
- NG4: Real-time ingestion of live FIRs (v2+).
- NG5: On-premise / air-gapped deployment (v2+).

---

# 4. Personas & Use Cases

`MODE: DEEP_THINK`

## 4.1 Personas

| Persona | Role | Primary Need |
| :--- | :--- | :--- |
| **Analyst** | Intelligence analyst, HQ | Aggregate patterns, generate district briefs, export reports |
| **Investigating Officer (IO)** | Field officer | Find repeat offenders, co-accused networks, similar cases |
| **District SP / DCP** | Command | Understand district load, forecast, hotspot severity |
| **Power user** | Technical analyst | Query raw schema via Resources explorer, deep search |

## 4.2 Core Use Cases

1. **UC-1 Dashboarding**: One-page situational awareness (KPIs, status/category/district breakdowns, recent cases). Filter by district, crime head, status, date range.
2. **UC-2 Hotspot Review**: Map view with per-case geopoints and district risk clusters.
3. **UC-3 Network Analysis**: Visualize co-accused graphs; rank by degree/risk; tune `maxCases`.
4. **UC-4 Repeat-Officer Identification**: Group accused by identity across ≥2 cases; rank top offenders.
5. **UC-5 Predictive Brief**: Per-district next-month forecast with change % and risk flag.
6. **UC-6 Natural-Language Query**: Ask "which districts have the highest repeat-offender activity?" and get a grounded answer.
7. **UC-7 Search**: Fuzzy search across cases, people, districts, stations.
8. **UC-8 Report Export**: Export current filtered rows as CSV/JSON.
9. **UC-9 Audit**: Review a log of who accessed what intelligence.

---

# 5. Innovation Brief

`MODE: DEEP_THINK`

**Core Objective (rephrased):** *Provide police officers the fastest, most intuitive path from raw FIR records to actionable crime intelligence — using visualization, association, and prediction, amplified by a conversational AI assistant.*

### Proposed Concepts

1. **The Modern Standard** — Polished read-only analytics platform: rich dashboards, interactive maps, graph networks, forecast charts, natural-language search. Safe, well-understood patterns; high polish; strong UX. *(Chosen — see recommendation.)*

2. **The Innovator's Path** — Everything in (1) **plus** a true LLM-powered copilot (Gemini) that reasons over the schema, an *Anomaly Radar* that flags statistically unusual spikes per district, and *Storytelling Briefs* that auto-narrate a district's narrative ("Bellary shows a 40% MoM rise in thefts concentrated in two stations"). Higher impact, higher complexity.

3. **The Radical Pivot** — Re-architect as a **shared "Crime Fabric" service** with a schema-agnostic analytics engine + pluggable data connectors. Anything could feed it (FIRs, CCTV metadata, call records, social intelligence). Largest ambition, largest build cost, not justified by the hackathon scope.

### Comparison Matrix

| Idea | Innovation Level | Implementation Effort | User Value | Risk |
| :--- | :--- | :--- | :--- | :--- |
| Modern Standard | Medium | Low–Med | High | Low |
| Innovator's Path | High | Medium–High | Very High | Medium |
| Radical Pivot | Very High | Very High | High (long-term) | High |

### Recommendation & "Why"

Adopt **Concept 1 (The Modern Standard) as the MVP**, with the **Innovator's Path (Concept 2) as the v1.5 horizon**. Rationale:

- Delivers the entire value thesis (insight, association, prediction, conversation) with **bounded effort** and **lowest risk** for a hackathon timeline.
- Reservations the reviewer would raise honestly, in the open:
  - *The AI assistant is currently mocked.* A demo judge may probe it — so the rule-based backend must be demonstrably grounded in real data, not marketing fluff.
  - *Prediction is a 3-month moving average + percentile threshold.* It is defensible for a demo, but must be labeled a **heuristic forecast**, not "AI prediction," to avoid overclaiming.
  - *Demo auth (fixed credentials) is a security gap* that must be explicitly called out as non-goal for v1.
- The Innovator's Path delivers the *moonshot* differentiation (LLM copilot, anomaly radar, auto-briefs) once the trunk is stable.

### Feature Creep Guardrail → Lean MVP

Strip to the irreducible core that still proves the thesis:

| Include in MVP | Defer to v1.5 / v2 |
| :--- | :--- |
| Dashboard, Hotspots, Trends | Real LLM copilot (rule-based now) |
| Network, Repeat Offenders, Predictions | Anomaly Radar |
| Case Search, Reports, Resources | Storytelling auto-briefs |
| Alerts, Audit Logs (client-side) | PDF export, RBAC |
| Demo auth | Real backend auth + tokenized sessions |

### Proof-of-Concept Outline (for the Innovator's Path)

1. Add `POST /api/assistant` Gemini integration behind the existing interface (no frontend change).
2. Implement an **Anomaly Radar**: z-score / IQR detection on district × crime-type × month.
3. Generate a **narrative brief** string from district analytics JSON; surface as a card.

### Next Steps for Implementation
- [ ] Milestone 1 — lock MVP scope + acceptance criteria (this doc)
- [ ] Milestone 2 — backend analytics endpoints hardened (single response, no double-write)
- [ ] Milestone 3 — frontend modules + filters + date ranges
- [ ] Milestone 4 — AI assistant grounded in live data + alerts/audit
- [ ] Milestone 5 — export/reports + deploy (Vercel/Render) + keep-alive
- [ ] Milestone 6 — v1.5 innovations (LLM copilot, anomaly radar, auto-briefs)

---

# 6. Scope & Requirements

`MODE: DEEP_WORK`

## 6.1 Functional Requirements

| ID | Requirement | Priority | Module |
| :--- | :--- | :--- | :--- |
| FR-01 | Render global KPIs (total cases, active investigations, heinous/severe, arrest-linked, chargesheeted, districts) | P0 | Dashboard |
| FR-02 | Filter dashboard by district, crime head, status, and date range | P0 | Dashboard |
| FR-03 | Show status / category / district breakdowns + recent cases | P0 | Dashboard |
| FR-04 | Render per-case geopoints + district risk clusters on Leaflet map | P0 | Hotspots |
| FR-05 | Endpoint `GET /api/hotspots` returns points + clusters | P0 | Hotspots |
| FR-06 | Render co-accused network graph (Cytoscape) with node degree/risk | P0 | Network |
| FR-07 | Tune network via `maxCases` (20–500) | P1 | Network |
| FR-08 | Identify repeat offenders grouped by identity with ≥ `minCases` distinct cases | P0 | Repeat Offenders |
| FR-09 | 3-month moving-average forecast with change % and risk per district | P0 | Predictions |
| FR-10 | Per-district analytics detail (KPIs, types, statuses, socioeconomics) | P0 | District Analysis |
| FR-11 | Fuzzy case/person/district search | P0 | Case Search |
| FR-12 | Derived hotspot + repeat-offender alerts with severity | P0 | Alerts |
| FR-13 | Export current rows as CSV/JSON | P0 | Reports |
| FR-14 | Dynamic schema explorer over all CSV tables | P1 | Resources |
| FR-15 | Natural-language Q&A via `POST /api/assistant` (rule-based v1) | P0 | AI Assistant |
| FR-16 | Client-side audit trail of intelligence access | P1 | Audit Logs |
| FR-17 | 7-step guided dashboard tour | P2 | Onboarding |
| FR-18 | Settings / profile screens | P2 | Admin |

## 6.2 Non-Functional Requirements

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-01 | API cold-start response for analytics endpoints | < 2 s |
| NFR-02 | Forecast/trend response under re-parse workload | < 3 s |
| NFR-03 | UX responsiveness (SPA, route-level loading) | LCP < 2.5 s target; feedback on every async op |
| NFR-04 | Accessibility | WCAG 2.1 AA (semantic HTML, keyboard nav, alt text, contrast) |
| NFR-05 | CLI/API correctness | No double-`res.json`, no undefined refs in enrichment |
| NFR-06 | Error handling | User-friendly + logged with context on failures |
| NFR-07 | Data labeling | Forecasts labeled as heuristic; assistant responses marked grounded |

## 6.3 Out of Scope (v1) → Backlog

- Real LLM copilot, anomaly radar, auto-briefs (v1.5)
- Real auth/RBAC, token sessions (v1.5+)
- PDF export (v1.5)
- Real-time ingestion / delta load (v2)
- Air-gapped / on-prem deployment (v2)

---

# 7. Milestones, Acceptance Criteria & Dependencies

`MODE: DEEP_WORK`

## Milestone M1 — Foundation & Backend Hardening
**Goal:** Analytics engine correct, single-responsibility, reliable.
- **AC-M1.1** All `GET /api/*` analytics endpoints return valid JSON with consistent shape.
- **AC-M1.2** No double `res.json` / send-header errors; duplicate `/api/health` definition removed.
- **AC-M1.3** `enrichCase` sets all references it filters on (fix undefined `unitName`).
- **AC-M1.4** CORS allowlist correct for `localhost:5173` + prod Vercel origin.
- **Dependencies:** Dataset import verified; none upstream.

## Milestone M2 — Core Frontend Modules
**Goal:** Dashboard, trends, hotspots, network, repeat offenders, district, case-search.
- **AC-M2.1** All six visual modules render server data for default filters.
- **AC-M2.2** Date-range + district + crime-head + status filters propagate correctly.
- **AC-M2.3** Maps and graphs handle empty data gracefully (no crashes).
- **AC-M2.4** Async loading states shown on every data-driven page.
- **Dependencies:** M1 (correct endpoints).

## Milestone M3 — Intelligence Layer (Alerts, Predictions, Assistant)
**Goal:** Operational insight: forecasts, alerts, conversational Q&A, exports.
- **AC-M3.1** Forecast endpoint returns per-district prediction, change %, risk flag.
- **AC-M3.2** Alerts derive from hotspot + repeat-offender logic with severity tags.
- **AC-M3.3** Assistant answers grounded questions derived from real dataset stats.
- **AC-M3.4** Reports export current filtered rows as CSV/JSON.
- **AC-M3.5** Forecasts explicitly labeled as heuristic models.
- **Dependencies:** M1, M2 (UI hooks).

## Milestone M4 — Deploy, Onboard & Audit
**Goal:** Production-shaped rollout with trust and traceability.
- **AC-M4.1** Frontend live on Vercel; backend live on Render; keep-alive workflow runs.
- **AC-M4.2** Env vars documented and consistent (PORT 5000, `VITE_API_BASE_URL`).
- **AC-M4.3** Demo auth documented as demo-only; audit log captures actions.
- **AC-M4.4** README + PRD final; API table matches implementation.
- **Dependencies:** M1–M3.

## Milestone M5 — v1.5 Innovation Slice (backlog-staged)
**Goal:** Differentiate beyond baseline.
- [ ] Real Gemini copilot behind `/api/assistant`.
- [ ] Anomaly Radar (z-score/IQR on district × type × month).
- [ ] Auto-narrated district briefs.
- [ ] PDF export.
- **Dependencies:** M4 shipped & stable.

### Cross-Cutting Review Gates (after every milestone)
- [ ] Linter + formatter pass (oxlint).
- [ ] Type/static check pass.
- [ ] Security review (input validation, no secrets, CORS) — `ARCHITECTURE_REVIEW`.
- [ ] Edge cases (empty filters, 404 district, bad query) handled.

---

# 8. Proposed Architecture

`MODE: ARCHITECTURE_REVIEW`

See the full review in the companion document. Highlights:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NETRA AI (no RDBMS)                        │
└───────────────┬─────────────────────────────┬───────────────────────┘
                │                             │
   ┌────────────▼─────────────┐   ┌───────────▼────────────┐
   │  Frontend (Vercel, Vite) │   │ Backend (Render, Node) │
   │  React 19 · Tailwind 4   │   │  Express 4             │
   │  Leaflet · Cytoscape     │   │  csv-parse (in-memory) │
   │  Recharts · Router 7     │──▶│  Serverless-friendly   │
   └────────────▲─────────────┘   └───────────▲────────────┘
                │                             │
                │              ┌──────────────▼──────────────┐
                │              │  29× CSV FIR Dataset        │
                │              │  (loaded on demand)         │
                │              └─────────────────────────────┘
                └──────────── Ctrl+C / ctrl-v SPA deploy ─────┘
```

## 8.1 Strengths

- **No RDBMS** = zero schema migration risk, cheapest hosting, trivially portable dataset.
- **In-memory analytics** provides multi-second answers adequate for the dataset size (~2.5k cases).
- **Clean separation** of concern: backend = analytics engine; frontend = pure client of a stable JSON API contract.

## 8.2 Weaknesses & Risks (honest assessment)

| Risk | Severity | Impact | Recommended Mitigation |
| :--- | :--- | :--- | :--- |
| **Re-parse on every request** | Med | Cold-start latency on Render free tier; `/api/resources` reads all 29 files per call | Cache parsed tables after first load (in-memory TTL); lazy-load resources |
| **No real auth** | High (if productionized) | Data exfiltration, no accountability | Keep demo-only for v1; add real auth + RBAC + token sessions in v1.5 before any real data |
| **Mocked assistant** | Med | Risk of overclaiming an "AI" that is rules-based | Ground responses in real dataset stats; label accurately; add Gemini hook |
| **In-memory only** | Med | No horizontal scaling, memory-bound | Acceptable for v1; note serverless/lambda path in v1.5 |
| **Single-file server.js (~844 lines)** | Low–Med | Maintainability | Consider splitting into route modules as features grow |
| **Client-side audit logs** | Low | Trivially forgeable | Sufficient for demo; move to backend audit endpoints in v1.5 |
| Hardcoded secrets / config drift (port 3000 vs 5000) | Med | Deploy confusion | Single env source of truth documented in README |

## 8.3 Security Architecture (v1)

- Input validation on query params (`districtId`, `q`, `maxCases`, `minCases`, `from`/`to`).
- Parameterized/whitelisted values; never concatenate into filters unsafely.
- CORS allowlist restricts cross-origin callers to known origins.
- No secrets committed; all config via environment variables.
- Output escaping where data is re-rendered to guard against stored-XSS in case text.
- Audit logging of sensitive analytics views (client-side for v1).

## 8.4 Observability

- Structured health endpoint `/api/health` (ok, caseCount, districtCount).
- Keep-alive workflow pings health every 5 min → prevents Render cold-sleep loss of data.
- Request IDs + timestamps in logs (to add for v1.5).
- RED metrics (rate/error/duration) via structured logs (v1.5).

## 8.5 Cost Optimization

- **Serverless free tiers** today: Vercel (frontend) + Render free (backend) → near-zero ongoing cost.
- Zoho Catalyst function available as an alternative/edge deployment.
- In-memory analytics avoids paid DB spend entirely for v1.

## 8.6 Migration Path (v1 → v1.5 → v2)

1. **v1 → v1.5:** add caching (in-memory TTL), real auth (Supabase/Catalyst), move audit to backend, add Gemini copilot, anomaly radar, auto-briefs, PDF export.
2. **v1.5 → v2:** if scale or freshness demands, introduce a real datastore (Postgres); add delta ingestion + scheduled ETL; add RBAC; support on-prem/air-gapped deployment. Keep the JSON API contract stable throughout so the frontend never needs to change.

---

# 9. Data Model & Sources

`MODE: DEEP_WORK` (from dataset exploration)

- **Core tables:** `CaseMaster` (2,501), `Accused` (3,992), `Victim` (2,892), `ChargesheetDetails` (1,429), `ArrestSurrender` (1,444), `PersonMaster_EXT` (1,101), `ComplainantDetails`, `ActSectionAssociation`, `CaseModusOperandi_EXT`.
- **Lookup/master:** `District` (32), `PoliceStation` (601 via `Employee`), `CrimeHead` (9), `CrimeSubHead` (21), `Section` (27), `Act` (6), `GravityOffence` (3), `CaseStatusMaster` (6), `CaseCategory` (5), `Court` (32), etc.
- **Join keys:** `CaseMasterID`, `PersonMasterID`, `AccusedMasterID`, `PoliceStationID`, `DistrictID`, `CrimeHeadID`, `StatusID`, `MOID`.

All analytics derive from these joins at runtime — no stored schema.

---

# 10. Analytics Logic Reference

`MODE: DEEP_WORK`

| Capability | Algorithm | Parameters |
| :--- | :--- | :--- |
| Hotspot clusters | Count → risk: ≥100 high, ≥70 medium, else low | district count threshold |
| Network nodes | Degree from co-accused edges; risk ≥6 high, ≥3 medium | `maxCases` 20–500 |
| Repeat offenders | Group by identity across distinct cases | `minCases` ≥2 |
| Forecast | 3-month moving average + change % + percentile risk (75/50) | rolling window |
| Search | Fuzzy substring over id/crime no/brief/station/district/accused | `q` |
| Alerts | Derived from hotspot + offender logic; severity critical/high/medium | thresholds |

---

# 11. Validation & QA Strategy

`MODE: DEEP_WORK`

- **API contract tests**: every endpoint returns schema-valid JSON; filters work; 404 on unknown district.
- **Edge cases**: empty dataset view, 0-result filters, bad `maxCases`, malformed `q`, large `from`/`to`.
- **Data integrity**: row counts vs. dataset; non-null counts; join keys resolve.
- **Performance**: re-parse timing tracked; caching benchmarked.
- **Visual/UX checks**: responsive breakpoints, empty states, loading states, keyboard nav.
- **Security checks**: input validation, CORS rules, no secret leakage.
- **Manual test scenarios** per persona driven from Section 4.

---

# 12. Release Plan

`MODE: DEEP_WORK`

| Phase | Contents | Entry Criterion |
| :--- | :--- | :--- |
| v1.0 (MVP) | M1–M4 | All P0 FRs met; no known blockers; README/PRD final |
| v1.5 (Innovation) | LLM copilot, anomaly radar, auto-briefs, PDF, real auth, backend audit | v1.0 stable + adoption feedback |
| v2.0 (Scale) | Real datastore, delta ETL, RBAC, air-gapped deploy | v1.5 stable + real operational need |

---

# 13. Open Questions / Decision Log

`MODE: DEEP_THINK`

| # | Question | Options | Draft Decision |
| :--- | :--- | :--- | :--- |
| 1 | AI assistant depth in v1 | Rule-based vs. real LLM | Rule-based (grounded), Gemini hook ready |
| 2 | Auth approach | Demo vs. real (Supabase/Catalyst) | Demo for v1; real in v1.5 |
| 3 | Forecast labelling | "Heuristic" vs. "ML prediction" | Always label heuristic |
| 4 | Datastore now or later | In-memory vs. Postgres | In-memory for v1 |
| 5 | Hosting | Vercel+Render vs. Catalyst-only | Vercel+Render (keep-alive) |

---

# 14. Success Metrics & Acceptance (Final Check)

`MODE: DEEP_THINK` + `MODE: DEEP_WORK`

- [x] Real dataset processed into operational intelligence (hotspots, trends, networks, repeat offenders).
- [x] Forecasts produced per district with heuristic labeling.
- [x] Natural-language assistant grounded in real data.
- [x] District briefs exportable as CSV/JSON.
- [x] Audit trail present (client-side for v1).
- [x] Deployed end-to-end (Vercel + Render) with keep-alive.
- [ ] (v1.5) True LLM copilot, anomaly radar, backend auth/audit.

---

## Appendix A — Modes Used

- **`MODE: DEEP_THINK`** → Sections 1, 2, 3.2, 4, 5, 13, 14.
- **`MODE: DEEP_WORK`** → Sections 3.1, 6, 7, 9, 10, 11, 12, 14.
- **`MODE: ARCHITECTURE_REVIEW`** → Sections 2, 8.

---

**End of PRD — v1.0.0**
