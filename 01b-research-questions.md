# Research Questions and Traceability
## Proxmox Self-Service VM Provisioning Portal

This document defines the study's research questions (RQs) and the matching research objectives
(ROs), and threads them — through the design mechanisms (Chapter 3) and evaluation methods — to
the evidence that answers them (Chapter 4). It is the connective spine of the thesis: it makes
explicit *how each question is answered* and *what would count as a positive answer*. RQs and ROs
are Chapter 1 content; the mechanism and method columns are Chapter 3; the success criteria sit at
the Chapter 3/4 boundary; the evidence is reported in Chapter 4.

The study is framed by Peffers' Design Science Research Methodology (see
`11-chapter3-methodology.md`); the RQs are co-equal (no single umbrella question).

---

## 1. Research questions

- **RQ1 — Design & Abstraction.** How can an open-source web self-service portal be designed to
  abstract Terraform/Ansible and CLI complexity into a guided VM-provisioning workflow on
  Proxmox VE, while preserving Infrastructure-as-Code's reproducibility and statefulness?
- **RQ2 — Governance & Security.** How can the portal enforce governance (authorization,
  approval, lifecycle/expiry, resource quotas) and security (automated hardening, auditing) so
  that self-service provisioning remains safe and auditable?
- **RQ3 — Operational Efficiency.** To what extent does the portal reduce human operational
  effort and configuration inconsistency compared with the native Proxmox web UI, including for
  batch provisioning?
- **RQ4 — Perceived Usability.** How do operators perceive the usability of the portal relative
  to the native Proxmox web UI?

## 2. Research objectives

- **RO1.** To design and implement a self-service web portal that abstracts IaC/CLI complexity
  into a guided Proxmox VE workflow, preserving IaC reproducibility and statefulness.
- **RO2.** To design and evaluate governance and security controls (authorization, approval,
  lifecycle, quotas, automated hardening, auditing) that keep self-service safe and auditable.
- **RO3.** To measure the portal's effect on human operational effort and configuration
  consistency relative to the native Proxmox web UI, including batch provisioning.
- **RO4.** To assess operators' perceived usability of the portal relative to the native
  Proxmox web UI.

## 3. Traceability matrix

Each row threads one question from its objective, through the design mechanism and evaluation
method, to the success criterion and the evidence that answers it.

| RQ | Objective | Design mechanism (Ch. 3) | Evaluation method | Success criterion (expected positive answer) | Evidence (Ch. 4) |
|---|---|---|---|---|---|
| **RQ1** | RO1 | Discovery + Publishing **anti-corruption layer** (§3.3.2); **Tier** abstraction (§3.3.3); **per-VM Terraform workspace/state** (ADR-08); provider driver abstraction (§3.3.1) | Functional verification (§3.6.1) **+ qualitative CLI-vs-portal cognitive walkthrough** (§4) | A non-expert completes an end-to-end provision selecting only published menu items, authoring **zero HCL/CLI**; the walkthrough shows reduced prerequisite knowledge and authored artifacts vs. raw Terraform; the functional suite confirms the abstracted workflow is correct | Working artifact; **walkthrough comparison table**; 68 tests (workflow correctness) |
| **RQ2** | RO2 | **Environment policy-as-configuration** — five-way allow-list (provider/node/tier/network/datastore), node-anchored (§3.3.4); approval engine; RBAC; **append-only audit trail**; Ansible hardening (Stage 8) | Functional/regression tests (§3.6.1) **+ STRIDE threat model** (§3.6.4) | Out-of-policy and unauthorized requests are rejected; the approval gate is honored; caps/expiry are enforced; **every state change is audited**; each identified STRIDE threat has a mapped, test-backed control with residual risk itemized | 68 tests incl. **6 regression guards**, `ApprovalWorkflowTest`, `AuditTrailTest`; `12-security-threat-model.md` |
| **RQ3** | RO3 | Batch fan-out; single guided form; **IaC-deterministic** output | Comparative efficiency benchmark (§3.6.2): N ∈ {1, 5, 10}, ≥ 3 repetitions | Action count scales **O(1) vs. O(N)**; lower mean hands-on time at **N ≥ 5**; configuration error rate **≈ 0** for the portal *(descriptive)* | Benchmark results tables + scaling plots |
| **RQ4** | RO4 | Guided wizard; abstracted menus; live status visibility | Comparative **System Usability Scale** (§3.6.3): both methods, n ≥ 5 | Portal mean SUS **> native-UI mean SUS**, and portal SUS **above the ≈ 68** norm *(descriptive/indicative)* | SUS score tables (per-method mean ± SD) |

> **Reporting-honesty commitment.** Chapter 4 reports the raw means for every benchmark/SUS cell,
> including any that do not meet a success criterion (e.g. if single-VM hands-on time favors the
> native GUI because of Terraform's plan/apply overhead). Pre-committing to report unfavorable
> cells supports construct validity and pre-empts cherry-picking concerns.

## 4. RQ1 — CLI-abstraction walkthrough design

RQ1's abstraction claim is evidenced by a **structured cognitive walkthrough**, not anecdote. The
functional test suite proves the abstracted workflow is *correct*; the walkthrough proves it
*removes the CLI knowledge burden*. A single canonical task is performed both ways and compared
across three dimensions — with **prerequisite knowledge** (not step count) as the primary measure,
because the CLI barrier is what the operator must already understand.

**Canonical task:** *provision one Rocky Linux VM (2 vCPU / 4 GB) on a chosen network and
datastore, powered on.*

| Dimension | Raw Terraform CLI path | Portal path |
|---|---|---|
| **Prerequisite knowledge** (concepts the operator must hold) | HCL syntax; provider & auth configuration; resource schema; variables; Terraform state; the `init` → `plan` → `apply` lifecycle; Proxmox identifiers (node, `vmbr*` bridge, storage pool, template ID) | Recognize the published menu items (catalog / network / datastore / tier aliases) |
| **Artifacts the operator must author** | `main.tf`, `provider.tf`, `variables.tf`, `terraform.tfvars`; manage state | None (form selections only) |
| **Discrete steps** | Install tooling → author files → `init` → `plan` → `apply` → verify (enumerate at write-up) | Open wizard → select menu items → submit → [approval] → running (enumerate at write-up) |

The contrast in the first two rows — concepts required and artifacts authored — is the direct,
defensible answer to the "CLI complexity" research gap.
