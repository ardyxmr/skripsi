# Chapter 4 — Results and Discussion
## Proxmox Self-Service VM Provisioning Portal

This chapter reports the evaluation results and answers each research question against the
success criteria defined in the traceability matrix (`01b-research-questions.md` §3). It is
organized one section per research question (§4.2–4.5), followed by the multi-cluster
demonstration (§4.6) and a consolidated summary (§4.7). Methods are defined in
`11-chapter3-methodology.md`; this chapter presents their outcomes.

> **Placeholder convention.** Cells/figures marked **[pending — practical phase]** are completed
> after the live demonstration, benchmark, and usability sessions. Results already produced by the
> automated suite and the threat model are filled in. Per the reporting-honesty commitment
> (`01b` §3), every benchmark/SUS cell is reported — including any that do not meet a criterion.

---

## 4.1 Results overview

| RQ | Success criterion (abbrev.) | Result section | Verdict |
|---|---|---|---|
| RQ1 | Zero-HCL end-to-end provision; reduced knowledge burden; workflow correct | §4.2 | **[pending]** |
| RQ2 | Policy/authz enforced; all changes audited; STRIDE threats mitigated | §4.3 | **[pending]** |
| RQ3 | Action count O(1) vs O(N); lower hands-on time at N≥5; ≈0 inconsistency | §4.4 | **[pending]** |
| RQ4 | Portal SUS > native-UI SUS, and above the ≈68 norm | §4.5 | **[pending]** |

---

## 4.2 RQ1 — Design and abstraction

### 4.2.1 The realized artifact

*Narrative walkthrough of the delivered portal, with figures.*

- **Figure 4.1 —** *[Screenshot: provisioning wizard — environment/tier/catalog selection]* — pending.
- **Figure 4.2 —** *[Screenshot: published Catalog/Network/Datastore menus showing friendly aliases]* — pending.
- **Figure 4.3 —** *[Screenshot: Inventory list with live status/IP/specs]* — pending.

### 4.2.2 Functional verification (workflow correctness)

The abstracted workflow is verified by an automated feature/integration suite exercising the real
HTTP stack against PostgreSQL, with `Bus::fake()` isolating Terraform/Ansible (see
`10-evaluation.md` §2). **Result: the full suite passes — 68 tests, 259 assertions.**

**Table 4.1 — Functional verification results.**

| Test area | Tests | Focus |
|---|---:|---|
| Authentication & RBAC | 11 | Login/throttle/audit; role-gated endpoints |
| Provision & approval | 26 | Node-centric policy; approval routing; batch fan-out |
| Lifecycle & regression guards | 15 | renew/resize/add-disk/delete/retry; 6 regression guards |
| Audit trail | 12 | Action logging; credential-reveal; admin-only audit API |
| Smoke / scaffold | 4 | Health + framework sanity |
| **Total** | **68** | **259 assertions; all passing** |

### 4.2.3 CLI-abstraction cognitive walkthrough

Canonical task: *provision one Rocky Linux VM (2 vCPU / 4 GB) on a chosen network and datastore,
powered on.* The portal path is compared to the raw Terraform CLI path (method: `01b` §4).

**Table 4.2 — CLI vs. portal abstraction comparison.**

| Dimension | Raw Terraform CLI path | Portal path |
|---|---|---|
| Prerequisite knowledge (concepts required) | HCL; provider/auth config; resource schema; variables; state; `init`/`plan`/`apply`; Proxmox identifiers (node, `vmbr*`, storage pool, template ID) | Recognize published menu aliases |
| Artifacts authored | `main.tf`, `provider.tf`, `variables.tf`, `terraform.tfvars`; state management | None (form selections) |
| Discrete steps (count) | **[pending — enumerate]** | **[pending — enumerate]** |

### 4.2.4 RQ1 verdict

**[pending]** — *State whether a non-expert completed the provision authoring zero HCL/CLI, and
summarize the knowledge-burden reduction (Table 4.2) and workflow correctness (Table 4.1).*

---

## 4.3 RQ2 — Governance and security

### 4.3.1 Governance enforcement

Policy and authorization controls are verified by the functional suite. **Result: enforcement
confirmed** by the following representative cases (see `10-evaluation.md` §2):

**Table 4.3 — Governance enforcement results.**

| Control | Test evidence | Outcome |
|---|---|---|
| Out-of-policy request rejected (provider/node/tier/network/datastore allow-lists) | `ProvisionRequestTest` policy cases | Pass |
| Approval gate honored (per-environment `approval_required`) | `ApprovalWorkflowTest` | Pass |
| Privileged bypass explicit + audited | `ProvisionRequestTest` | Pass |
| Resource caps enforced incl. in-flight approvals | `LifecycleTest` regression guard | Pass |
| Expiry/grace lifecycle | `LifecycleTest` | Pass |
| Record-level RBAC scoping | `LifecycleTest`, `RbacTest` | Pass |

### 4.3.2 Audit trail

**Result: every state-changing action is audited**, including credential reveal (without leaking
the secret), with structured metadata keyed on `inventory_id` (`AuditTrailTest`, 12 tests).

### 4.3.3 STRIDE threat-model outcome

Security is evaluated against the STRIDE model in `12-security-threat-model.md`. Each threat maps
to an implemented, where-applicable test-backed control; residual risk is itemized as the deferred
production-hardening checklist.

**Table 4.4 — STRIDE control coverage (summary).**

| STRIDE category | Controls implemented | Residual / deferred |
|---|---|---|
| Spoofing | Cookie auth, throttle, session regen, idle logout | — |
| Tampering | DNS-label `vm_name` validation, CSRF, node-centric policy, name-confirmation | — |
| Repudiation | Append-only audit + structured metadata | — |
| Information disclosure | Encrypted secrets, audited reveal, RBAC, debug-gated errors | — |
| Denial of service | Login throttle, sync circuit-breaker, bounded batches | Global API rate limit (nginx) |
| Elevation of privilege | Route RBAC, audited bypass, record-level scoping | — |
| *Deferred hardening (config)* | — | `APP_DEBUG=false`, Reverb origins, CA pinning, secret rotation, Redis pass, nginx HSTS/CSP |

### 4.3.4 RQ2 verdict

**[pending]** — *Conclude that governance is enforced and auditable and that identified STRIDE
threats are mitigated, with residual risk confined to deployment-time configuration.*

---

## 4.4 RQ3 — Operational efficiency

Method: comparative benchmark (`11-chapter3-methodology.md` §3.6.2), Web App vs. native Proxmox
UI, N ∈ {1, 5, 10}, ≥ 3 repetitions; metrics = action count, hands-on time (s), spec deviations.

### 4.4.1 Benchmark data

**Table 4.5 — Benchmark results (mean ± SD over 3 repetitions).** **[pending — practical phase]**

| Method | N | Action count | Hands-on time (s) | Spec deviations | 
|---|---:|---:|---:|---:|
| Web App | 1 | — | — | — |
| Web App | 5 | — | — | — |
| Web App | 10 | — | — | — |
| Proxmox UI | 1 | — | — | — |
| Proxmox UI | 5 | — | — | — |
| Proxmox UI | 10 | — | — | — |

### 4.4.2 Scaling analysis

- **Figure 4.4 —** *[Plot: action count vs. N — expected O(1) portal vs. O(N) UI]* — pending.
- **Figure 4.5 —** *[Plot: hands-on time vs. N]* — pending.

*Narrative: confirm/deny each H1 (effort), H2 (time at N≥5), H3 (consistency); report raw means
even where a criterion is not met (e.g. single-VM time may favor the GUI due to Terraform
overhead).* **[pending]**

### 4.4.3 RQ3 verdict

**[pending]** — *Answer the extent of effort/consistency improvement against the success
criterion.*

### 4.4.4 Provisioning throughput and worker scaling (backend efficiency)

The operator-effort comparison (§4.4.1) measures human cost; this subsection measures the
backend's own throughput under concurrent batch load. Each requested VM provisions as an
asynchronous Redis-queued job (`ProvisionVmJob`), one per instance, so the concurrency ceiling
equals the number of queue workers.

**Table 4.6 — Batch provisioning throughput (one live run per configuration).**

| Configuration | Batch | Concurrency | Per-VM apply | Total wall time | Throughput |
|---|---:|---:|---:|---:|---:|
| 2 workers, shared queue | 6 VMs | 2 | ~2 min | ~6 m 13 s | ~0.96 VM/min |
| 4 workers + `system`-queue split | 12 VMs | 4 | ~1 m 15 s | ~4 m 10 s | ~2.9 VM/min |

Two compounding changes produced the ~3× throughput gain. Doubling the worker pool raised
concurrent Terraform applies from two to four. Isolating the lightweight jobs (status broadcasts,
fact-sync) onto a dedicated `system` queue stopped them interrupting the provisioning workers,
which cut per-VM apply time from ~2 min to ~1 m 15 s.

Proxmox node pressure was captured during the four-concurrent-clone batch: IO delay ~1%, IO
pressure (some/full) ~8% / ~1%, CPU usage ~31% peak, CPU pressure (some) ~10%, memory pressure
negligible. Every spike was brief and decayed within one to two minutes. Storage was not the
limiting resource; CPU loads first as concurrency rises. No resource saturated at four workers, so
four is adopted as a conservative concurrency cap with measured headroom for further scaling.

A caveat on scope: these are single live runs against one Proxmox node at differing batch sizes,
not repeated controlled trials, so the figures characterise the realised prototype rather than a
statistical performance claim. Laravel Horizon auto-scaling and per-user fair queuing are recorded
as future work.

---

## 4.5 RQ4 — Perceived usability

Method: comparative System Usability Scale (`11-chapter3-methodology.md` §3.6.3), both methods,
n ≥ 5 operators; scoring per the SUS procedure.

### 4.5.1 SUS scores

**Table 4.6 — SUS results.** **[pending — practical phase]**

| Method | n | Mean SUS | SD | Adjective/grade |
|---|---:|---:|---:|---|
| Web App | — | — | — | — |
| Proxmox UI | — | — | — | — |

- **Figure 4.6 —** *[Chart: SUS distribution per method, with the ≈68 reference line]* — pending.

### 4.5.2 RQ4 verdict

**[pending]** — *Compare portal vs. native-UI means and position against the ≈68 norm
(descriptive/indicative; note small n).*

---

## 4.6 Multi-cluster demonstration (extensibility evidence)

Demonstration of the multi-provider / multi-cluster claim (`11-chapter3-methodology.md` §3.3.1,
Appendix B) — evidence that the provider-agnostic driver path operates across two Proxmox
endpoints with no code change.

- **Figure 4.7 —** *[Screenshot: Providers list — two Connected providers]* — pending.
- **Figure 4.8 —** *[Screenshot: Inventory showing VMs from both clusters]* — pending.
- **Figure 4.9 —** *[Screenshot: wizard routing to the second cluster's node]* — pending.

*Narrative: confirm provisioning into the second cluster via the same code path, supporting the
provider-agnostic extensibility argument (RQ1 design portability).* **[pending]**

---

## 4.7 Summary of findings

**Table 4.7 — Research questions answered.** **[verdicts pending where marked]**

| RQ | Key evidence | Criterion met? |
|---|---|---|
| RQ1 — Abstraction | Working artifact; 68 tests; CLI walkthrough (Table 4.2) | **[pending]** |
| RQ2 — Governance & security | Tables 4.3–4.4; `12-security-threat-model.md` | **[pending]** |
| RQ3 — Efficiency | Table 4.5; Figures 4.4–4.5 | **[pending]** |
| RQ4 — Usability | Table 4.6; Figure 4.6 | **[pending]** |

*Concluding paragraph: synthesize how the four answers, taken together, address the research gap —
governed, secure, CLI-abstracting self-service VM provisioning on open-source infrastructure.*
**[pending]**
