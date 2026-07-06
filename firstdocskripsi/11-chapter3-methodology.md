# Chapter 3 — Research Methodology
## Proxmox Self-Service VM Provisioning Portal

This chapter sets out the research methodology used to design, develop, and evaluate the
artifact: an open-source web self-service portal that abstracts Terraform and Ansible into a
governed "click-and-deploy" provisioning workflow for Proxmox VE. The work is framed with
**Peffers' Design Science Research Methodology (DSRM)**; development proceeds **iteratively**
in resumable stages with **security-by-design** as a cross-cutting concern; and evaluation
triangulates functional verification, a comparative efficiency benchmark, perceived usability,
and a security threat model. Detailed design rationale lives in the supporting documents
(`03-architectural-decisions.md`, `06-database-schema.md`, `07-api-contract.md`); evaluation
results are reported in `10-evaluation.md` and `12-security-threat-model.md`. Appendix A
reproduces the related-tools gap analysis (Chapter 2) for traceability.

> **Scope note on "open-source."** In the thesis title, *open-source* qualifies the
> virtualization platform — Proxmox VE and the underlying KVM hypervisor, both OSI/GPL
> open-source — while *Infrastructure as Code* denotes the method/toolset. The IaC engine
> (Terraform) is *source-available* under the BSL since 2023, with OpenTofu as the OSI-licensed
> fork (see Appendix A); this does not affect the title's open-source claim, which concerns the
> VM platform, not the IaC tool.

---

## 3.1 Research approach: Design Science Research

This study follows Design Science Research (DSR), which produces and evaluates a purposeful
**artifact** to solve a real problem and, in doing so, yields transferable design knowledge.
DSR is appropriate because the research question is constructive ("design and develop…") rather
than purely explanatory, and because the contribution is an instantiation plus the principle it
embodies. Peffers' DSRM provides the six-activity process used to structure the work (§3.2).

**Design principle (the transferable contribution).** Beyond the instance, the work advances a
reusable design principle:

> *Abstract Infrastructure-as-Code behind a policy-bound, human-in-the-loop self-service layer
> so that safe, auditable VM provisioning becomes accessible to operators without IaC/CLI
> expertise.*

Stating the principle explicitly elevates the contribution from a single application to design
knowledge that other open-source virtualization contexts can reuse.

## 3.2 Research stages (DSRM mapping)

| DSRM activity | Instantiation in this study | Where |
|---|---|---|
| 1. Problem identification & motivation | Manual, slow, inconsistent, ungoverned VM provisioning; CLI/IaC learning curve for SMEs; enterprise CMPs costly | Ch. 1, Appendix A |
| 2. Objectives of a solution | Self-service + IaC orchestration + RBAC/approval governance + automated hardening + open-source + SME-appropriate | `01-PRD.md` |
| 3. Design & development | Architecture + iterative build (Stages 0–8) with security-by-design | §3.3–3.4, `03/06/07/09` |
| 4. Demonstration | End-to-end provisioning on a real Proxmox cluster | §3.5, `08-deployment-workflow.md` |
| 5. Evaluation | Functional tests + efficiency benchmark + SUS + STRIDE | §3.6, `10`, `12` |
| 6. Communication | This thesis | — |

## 3.3 System design (DSRM 3a)

The artifact is built entirely on an open-source stack — **Laravel** (API), **React** (SPA),
**PostgreSQL**, **Redis/Reverb** (sessions + real-time), orchestrating **Proxmox VE** via
**Terraform** (provisioning) and **Ansible** (hardening). The design directly targets the
research gap: it **abstracts IaC/CLI complexity** (§3.3.2–3.3.3) behind a **policy-bound,
governed** self-service layer (§3.3.4) that is **portable across providers** (§3.3.1). Three
load-bearing architectural decisions underpin it — the **node-centric policy model (ADR-17)**,
realized as a three-way environment allow-list (provider/node/tier) anchored on
the node (see §3.3.4), a **per-VM Terraform workspace/state (ADR-08)** for isolation and a safe
retryable failure path, and **cookie-based Sanctum SPA authentication (ADR-24)**. Full design detail:
`03-architectural-decisions.md`, `06-database-schema.md`, `07-api-contract.md`.

### 3.3.1 Multi-provider orchestration and provider-agnostic extensibility

A **Provider** is a registered hypervisor endpoint; the portal is a **centralized control plane**
that orchestrates provisioning across many providers from one interface. All provider access is
mediated by a driver abstraction: a `ProviderDriver` **interface** (the read contract:
connection test, cluster resources, node network, VM config, guest interfaces), resolved by a
`ProviderFactory` that dispatches on `provider_type`, with `ProxmoxProvider` as the **reference
implementation**. By invariant (ADR-01/ADR-10), no other layer talks to the hypervisor — all
provider traffic flows through a driver.

This yields a precise, defensible extensibility claim, stated with its boundaries:

- **Multi-provider / multi-cluster — demonstrated.** Multiple Proxmox clusters are managed
  concurrently through the same code path (evaluated in §3.6; see the wiring procedure in
  Appendix B).
- **Provider-agnostic extensibility — an architectural contribution.** The read seam is clean
  and proven by one concrete driver; adding a new backend requires implementing the same
  `ProviderDriver` contract, with **no change** to the orchestration, policy, approval, or
  lifecycle layers. Provisioning is **data-driven** (each provider stores its own
  `terraform_provider_source`/`version`); a new hypervisor additionally requires a per-type
  Terraform module. **This dependency on a per-type IaC module is by design, not a limitation:**
  the thesis adopts Infrastructure-as-Code (Terraform) as its stated orchestration *method*, so a
  declarative per-provider module is the intended extension mechanism.
- **Multi-hypervisor (e.g. OpenStack, oVirt/OLVM) — future work,** with the exact extension point
  named above; the schema already admits these `provider_type` values.
- **Tenancy.** Access is governed by **role- and group-scoped RBAC**, not hard tenant isolation;
  true multi-tenancy is out of scope and noted as future work (§3.8).

### 3.3.2 Resource abstraction — the discovery and publishing layer

This layer is the primary mechanism that resolves the **CLI-complexity** gap. The Provider is the
**single source of truth**: a discovery process mirrors raw backend objects (nodes, templates,
VMs, networks, datastores) into the system. A **publishing** step then maps each raw object to a
**human-friendly alias**, hiding backend identifiers from non-technical users:

| Published entity | Aliases (hides) | Example |
|---|---|---|
| **Catalog** | a provider template | `rocky-golden` → **`rocky-linux-8`** |
| **Network** | a raw bridge/interface | `vmbr0` → **`VLAN-DEV`** |
| **Datastore** | a raw storage pool | `local-lvm` → **`Disk-ssd-dev`** |

Each published row binds to a specific node, carries an **Active/Inactive status gate**, and is
kept current by a node-content sync that reflects backend specs (IP, power state, CPU/RAM) into
the Inventory. The net effect: a user **composes a VM from readable menu items** and never
touches HCL, bridge IDs, or storage-pool names — the abstraction the research gap calls for.

### 3.3.3 Standardized sizing — the Tier (T-shirt) menu

Sizing is **decoupled from the provider** via a Tier menu offering standardized "T-shirt" sizes
(e.g. Bronze/Silver/Gold) that encapsulate CPU/RAM/disk allocations. Users select a *size* rather
than entering raw core/memory figures, and tiers are reusable across providers and environments —
further reducing the cognitive load of provisioning.

### 3.3.4 Policy and governance engine — the Environment

The **Environment** is the business-policy unit and the heart of the governance model. It is a
**policy-as-configuration** unit that explicitly **allow-lists three resource types** via dedicated
rule tables: `environment_provider_rules`, `environment_node_rules`, and `environment_tier_rules`.
Networks, datastores, and catalogs are admitted implicitly by **node residency** (their published
row must sit on an allow-listed node) rather than a dedicated rule table. When a user selects an
environment during provisioning, they therefore see **only the providers, nodes, and tiers the
environment permits, plus the catalogs, networks, and datastores that reside on the allowed
nodes**, with the bound node as the routing anchor (the node-centric invariant, ADR-17) that
doubles as a least-privilege guardrail. Each environment also carries independent policy levers:

- **Approval gate (`approval_required`)** — toggles whether provisioning/lifecycle in this
  environment routes through human approval or applies immediately. This is what makes the
  approval engine *policy-driven* rather than global, and is the central governance control.
- **Expiry & grace** (`expiry_type`/`expiry_value`, `grace_period_type`/`grace_period_value`) —
  e.g. *Dev* expires in 30 days with a grace window; *Prod* is permanent.
- **Resource caps** (`allow_data_disk`, `max_data_disks`) — e.g. *Dev* permits at most 2 data
  disks, *Prod* at most 4.
- **Lifecycle status** (`status` Active/Inactive, `display_order`) — controls availability and
  ordering in the wizard.

*Planned extension:* binding VM power control (start/stop) and dashboard visibility to the
environment as well, so operational actions inherit the same policy boundary.

## 3.4 Iterative development and security-by-design (DSRM 3b)

Development proceeded in nine resumable increments (Stages 0–8), each unlocking a slice of
user-facing capability and verified against a real Proxmox cluster before the next began.
Security was introduced **incrementally with each increment** (a Secure SDLC posture), not
appended afterward. Table 3.1 maps each stage to its capability, its specific security-by-design
activity, the STRIDE category it mitigates, and the verifiable evidence.

**Table 3.1 — Stage 0–8 development × security-by-design matrix.** Legend: STRIDE = Spoofing,
Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.

| Stage | Functional increment (capability unlocked) | Security-by-design activity | STRIDE addressed | Evidence |
|---|---|---|---|---|
| **0** | Environment & scaffold | Encryption foundation (`APP_KEY`, credential cipher cast); secret-free repository; isolated test database | Information disclosure | Encrypted casts; `.env` excluded |
| **1** | Foundation & IAM — login, User/Role/Group | Cookie-based Sanctum SPA auth (HttpOnly, no client token); RBAC middleware; brute-force throttle + failed-login audit; session regeneration; idle auto-logout | Spoofing, Elevation, DoS | `AuthTest`, `RbacTest` |
| **2** | Provider (Proxmox) discovery | Provider API secrets encrypted at rest + hidden from serialization; documented TLS trust boundary to hypervisor | Information disclosure, Tampering | `Provider` casts / hidden attrs |
| **3** | Published abstraction (catalog/network/datastore/node) | Input & data integrity: case-insensitive functional unique indexes; one-discovered-to-one-published binding (no spoofed duplicates) | Tampering, Spoofing | `LOWER()` unique-index migration |
| **4** | Policy layer (tiers + environments) | Least-privilege guardrails: allow-list rule tables + per-environment quotas/caps bound what any user may request | Elevation, DoS | Policy tables; environment caps |
| **5** | Provision request + approval engine | Human-in-the-loop authorization: mandatory approval gate, mandatory decision reason, role-gated approve/reject, explicit + audited privileged bypass | Elevation, Repudiation | `ApprovalWorkflowTest` (12) |
| **6** | Provisioning & Terraform execution | Infrastructure-boundary hardening: DNS-label `vm_name` validation (path-traversal / `${}` interpolation blocked); per-VM workspace isolation (ADR-08); per-VM encrypted credentials | Tampering, Information disclosure | `ProvisionRequestTest` (vm_name) |
| **7** | Inventory & day-2 lifecycle | Record-level RBAC scoping; exact name-confirmation on destructive ops; retention window; audited credential reveal (secret never logged); six regression guards | Elevation, Tampering, Repudiation | `LifecycleTest` (15), `AuditTrailTest` (12) |
| **8** | Automated Ansible hardening | Key-based automation (private key never leaves the server; public key via cloud-init); catalog-bound playbooks; approval-gated, on-demand hardening | Spoofing, Information disclosure | ADR-14; live-verified |
| **X-cut** | (all stages ≥ 1) | Append-only audit trail keyed on the never-reused `inventory_id`, `jsonb`-indexed | Repudiation | `AuditService`; `AuditTrailTest` |

## 3.5 Demonstration (DSRM 4)

Feasibility was demonstrated by exercising the full workflow against a live Proxmox cluster:
self-service request → approval → Terraform provisioning → optional Ansible hardening → day-2
lifecycle (renew/resize/add-disk/destroy) → audited deletion. The deployment topology, run-set,
and operational procedure are documented in `08-deployment-workflow.md`.

## 3.6 Evaluation design (DSRM 5)

Evaluation triangulates four complementary methods so that objective and subjective evidence
corroborate one another: functional verification (§3.6.1), a comparative efficiency benchmark
(§3.6.2), perceived usability (§3.6.3), and a security threat model (§3.6.4).

### 3.6.1 Functional verification — automated testing

Correctness of the application logic is verified by an automated **feature/integration** test
suite exercising the real HTTP stack (routing, middleware, RBAC, validation, services, database)
against a dedicated PostgreSQL instance. Side-effecting work is isolated with **`Bus::fake()`**,
so no test invokes Terraform or Ansible while still allowing assertions that the correct job was
dispatched with the correct arguments. A reusable data-builder constructs a policy-valid
scenario from which a single field is mutated to drive each failure path. The suite comprises
**68 tests / 259 assertions**, including six explicit **regression guards** that pin previously
fixed defects. Full breakdown: `10-evaluation.md` §2.

### 3.6.2 Comparative efficiency benchmark (Web App vs. raw Proxmox UI)

**Objective.** Quantify the *human operational efficiency* of provisioning VMs via the artifact
versus the native Proxmox VE web UI. This is explicitly **not** a hypervisor-throughput
comparison: both paths ultimately invoke the same Proxmox API, so the contribution lies in
operator effort, consistency, and batch scaling.

**Hypotheses.**
- **H1 (effort):** operator action count scales **O(1)** with batch size *N* for the artifact
  versus **O(N)** for the manual UI.
- **H2 (time):** mean hands-on operator time per batch is lower for the artifact at *N* ≥ 5.
- **H3 (consistency):** configuration error/variance rate is lower (≈ 0) for the artifact, due
  to IaC determinism.

**Variables.**

| Type | Variable |
|---|---|
| Independent | Method (Web App / Proxmox UI); batch size **N ∈ {1, 5, 10}** |
| Dependent | (a) action count, (b) hands-on time (s), (c) consistency/error rate |
| Controlled | Same template, node, specs (vCPU/RAM/disk), network; single trained operator; warm template cache; idle cluster; identical target configuration |

**Metrics & instruments.**
- **Action count** — discrete operator interactions per the rubric below, tallied post-hoc from
  a screen recording.
- **Hands-on time** — *active* operator time (mouse/keyboard), measured from the recording;
  **excludes** unattended provider apply/clone wait, isolating the human cost.
- **Consistency** — count of resulting VMs deviating from the target spec (wrong
  cores/RAM/disk/name/network) ÷ *N*.

**Action-count rubric (defined once, applied uniformly).** One action = one discrete intentional
interaction: a click/button press, a single field entry (one focus + type), a navigation/screen
transition, or a confirmation. (Artifact batch: one form ≈ fixed fields + one submit + zero/one
approval. Manual: per-VM clone → rename → set cores → RAM → disk → network → start.)

**Procedure.**
1. Reset to baseline (template available; no residual VMs).
2. For each Method × *N* cell, run **3 repetitions**; randomize cell order; rest between runs to
   limit fatigue/learning bias.
3. Screen-record every run; tally action count and hands-on time post-hoc (avoids
   live-measurement error).
4. After each run, audit the *N* VMs against the target spec for the consistency metric, then
   tear down.

**Data-collection template (Table 3.2).**

| Method | N | Rep | Action count | Hands-on time (s) | Spec deviations | Notes |
|---|---|---|---|---|---|---|
| Web App | 1 | 1 | | | | |
| … | | | | | | |
| Proxmox UI | 10 | 3 | | | | |

**Analysis.** Report mean ± SD per cell; plot action count and hands-on time against *N* to show
the scaling difference (O(1) vs. O(N)). Given small samples, rely on descriptive statistics and
effect direction; optionally apply a non-parametric **Mann–Whitney U** per *N* level without
over-claiming significance at *n* = 3.

**Honest scope.** Single-VM wall-clock may favor the manual UI because of Terraform
init/plan/apply overhead; this is reported rather than hidden. The artifact's advantage is
operator effort, consistency, and scaling at *N* > 1.

### 3.6.3 Usability evaluation — System Usability Scale (SUS)

To substantiate the usability contribution, the **validated 10-item System Usability Scale** is
administered immediately after each provisioning method; administering it to both the artifact
and the native Proxmox UI yields a **comparative** usability score.

**Instrument — 5-point Likert (1 = Strongly Disagree … 5 = Strongly Agree).**

| # | Item ("system" = the provisioning interface) | Polarity |
|---|---|:--:|
| Q1 | I think that I would like to use this system frequently. | + |
| Q2 | I found the system unnecessarily complex. | − |
| Q3 | I thought the system was easy to use. | + |
| Q4 | I think I would need the support of a technical person to be able to use this system. | − |
| Q5 | I found the various functions in this system were well integrated. | + |
| Q6 | I thought there was too much inconsistency in this system. | − |
| Q7 | I would imagine that most people would learn to use this system very quickly. | + |
| Q8 | I found the system very cumbersome to use. | − |
| Q9 | I felt very confident using the system. | + |
| Q10 | I needed to learn a lot of things before I could get going with this system. | − |

**Scoring.** Odd items: (response − 1). Even items: (5 − response). Sum the ten contributions
(0–40) and multiply by **2.5** → SUS score **0–100**. Report mean ± SD per method.

**Interpretation.** ~68 = average; > 68 above average (Sauro & Lewis normative data); a SUS score
is **not** a percentage. Optionally map to the Bangor et al. adjective scale / Sauro–Lewis curved
grades.

**Administration.** Immediately after each method's benchmark tasks, before debrief; anonymous;
same operators as §3.6.2; administered for **both** methods. Report *n* explicitly; *n* ≥ 5 gives
a more stable mean.

**Analysis.** Mean ± SD per method; for the comparison use a paired **Wilcoxon signed-rank** test
(same operators rate both) — treated as indicative at small *n*. SUS measures *perceived*
usability and complements the objective effort/consistency metrics of §3.6.2; triangulating the
two is a deliberate methodological strength.

*Shorter validated alternative under operator-time constraints: UMUX-Lite (4 items), which
correlates strongly with SUS; the full SUS remains the preferred, better-recognized choice.*

### 3.6.4 Security evaluation — STRIDE threat model

Security is evaluated against a **STRIDE** threat model that enumerates assets and trust
boundaries, maps each threat to its implemented control, and tags each control with code and
test evidence, then records residual risk as a deferred-hardening checklist. Full analysis:
`12-security-threat-model.md`.

## 3.7 Tools and research environment

| Concern | Selection |
|---|---|
| Hypervisor | Proxmox VE (KVM) — open-source |
| IaC provisioning | Terraform (BSL; OpenTofu-compatible — see Appendix A) |
| Configuration / hardening | Ansible (key-based) |
| Backend / frontend | Laravel · React |
| Data / realtime | PostgreSQL · Redis · Laravel Reverb (WebSocket) |
| Testing | PHPUnit feature/integration; `Bus::fake()`; dedicated test database |

*Record exact versions, the cluster hardware specification, and the test-database configuration
when finalizing, so the environment is reproducible.*

## 3.8 Validity and limitations

- **Testing is integration-level, by design.** The suite targets the high-value behavioral seams
  (policy, approval, lifecycle, audit, RBAC); pure-unit coverage of helpers (e.g. expiry-cap
  arithmetic) is implicit through those tests. (Construct/coverage validity.)
- **The infrastructure boundary is verified manually, not in CI.** Terraform/Ansible execution is
  `Bus::fake()`d in the suite (slow, stateful, requires a live hypervisor); live verification was
  performed by hand. A staging cluster with a nightly end-to-end job would close this gap.
- **Benchmark construct.** The study measures human operational effort and consistency, not
  hypervisor speed; a single operator and a single cluster limit internal/external validity —
  declared, with 2–3 operators recommended for stronger generalization.
- **Deferred production hardening** (configuration, not missing features) is itemized in
  `08-deployment-workflow.md` Part D and `12-security-threat-model.md` §5.
- **Scope boundary / future work.** Multi-provider, multi-*cluster* Proxmox orchestration is
  in scope and demonstrated; **multi-hypervisor** backends (OpenStack, oVirt/OLVM — via a new
  `ProviderDriver` + per-type Terraform module) and **hard multi-tenancy** (beyond role/group
  RBAC) are deliberately out of scope and identified as future work.

---

## Appendix A — Related-tools gap analysis (Chapter 2 cross-reference)

Reproduced here for traceability; in the thesis this analysis belongs in the literature review
(Chapter 2). It substantiates the research gap by evaluating representative open-source and
commercial tools against the criteria that define the target artifact.

**Criteria.** C1 Open-source / no licensing cost (SME affordability) · C2 Proxmox VE native
integration · C3 Terraform (IaC provisioning) · C4 Ansible (config + hardening) · C5 Approval
workflow (governance) · C6 Automated security hardening · C7 **CLI-abstracting self-service**
(no IaC/code skills required — the core usability value) · C8 SME-appropriate (low operating
cost/complexity).

**Legend:** ✔ Full · ◑ Partial / via plugin / paid tier · ✘ None.

| Tool | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Proxmox VE native UI** | ✔ | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ | ◑ |
| **HCP Terraform (Terraform Cloud)** | ✘ | ◑ | ✔ | ✘ | ◑ | ✘ | ✘ | ◑ |
| **AWX / Ansible Automation Platform** | ◑ | ✘ | ✘ | ✔ | ✔ | ◑ | ◑ | ◑ |
| **Foreman / Katello** | ✔ | ◑ | ✘ | ◑ | ✘ | ◑ | ◑ | ◑ |
| **OpenStack (Horizon)** | ✔ | ✘ | ◑ | ✘ | ✘ | ✘ | ✔ | ✘ |
| **Apache CloudStack** | ✔ | ✘ | ◑ | ✘ | ✘ | ✘ | ✔ | ✘ |
| **Commercial CMP (Morpheus / VMware Aria)** | ✘ | ◑ | ✔ | ✔ | ✔ | ◑ | ✔ | ✘ |
| **This work** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

**Cell notes (cite when finalizing; versions/dates as assessed June 2026).**
- *Terraform Cloud — C1 ✘:* the Terraform CLI is **BSL (source-available) since Aug 2023**;
  **OpenTofu** is the MPL-2.0 OSI fork under the Linux Foundation (CNCF-accepted Apr 2025). The
  hosted platform is proprietary; it does not abstract HCL authoring (C7 ✘).
- *AWX / AAP — C1 ◑:* **AWX** is free, community-supported, and the upstream of the automation
  controller in **Ansible Automation Platform**, which is a paid Red Hat subscription. Workflow
  approval nodes exist in both (C5 ✔).
- *Foreman — C2 ◑:* Proxmox support is an **official `theforeman` add-on plugin**
  (`foreman_fog_proxmox`, not core), requiring Proxmox VE 6.2+.
- *Commercial CMP — C2 ◑:* Morpheus supports Proxmox VE via the **HPE Morpheus Proxmox plugin**
  (HPE acquired Morpheus, Aug 2023); current integration uses SSH user/password node auth (SSH
  keys on the roadmap).

**Gap conclusion.** Tools that abstract complexity behind a self-service portal (OpenStack,
CloudStack, commercial CMPs) are either non-Proxmox, operationally heavy, or proprietary and
costly — unsuitable for resource-constrained SMEs. The only natively Proxmox tool (the VE UI)
offers no IaC orchestration, no governance, and no self-service abstraction. IaC orchestrators
such as Terraform Cloud still require authoring HCL, leaving the CLI/code learning curve — the
barrier this study targets — intact. No single open-source solution simultaneously satisfies
C2–C7 at an SME-appropriate cost (C1, C8). This intersection is the gap the present work
addresses.

**Sources (Appendix A).**
- OpenTofu — *OpenTofu announces fork of Terraform*: https://opentofu.org/blog/opentofu-announces-fork-of-terraform/
- Spacelift — *Terraform license change (BSL)*: https://spacelift.io/blog/terraform-license-change
- Red Hat — *Compare AWX vs Ansible Automation Platform*: https://www.redhat.com/en/technologies/management/ansible/compare-awx-vs-ansible-automation-platform
- The Foreman — *theforeman/foreman_fog_proxmox*: https://github.com/theforeman/foreman_fog_proxmox
- Hewlett Packard Enterprise — *morpheus-proxmox-ve-plugin*: https://github.com/HewlettPackard/morpheus-proxmox-ve-plugin
- TechTarget — *HPE adds Morpheus Data to KVM hypervisor*: https://www.techtarget.com/searchcloudcomputing/news/366623936/HPE-adds-Morpheus-Data-to-KVM-hypervisor-for-enterprises

---

## Appendix B — Wiring a second Proxmox provider (multi-cluster proof)

This procedure produces the evidence for the **multi-provider / multi-cluster** claim (§3.3.1,
Evidence Level 2). It registers a second Proxmox endpoint and provisions into it through the
*same* code path, with **no code changes** — exercising the data-driven provider model and the
`ProviderDriver`/`ProviderFactory` abstraction.

**Prerequisites.**
- A second Proxmox VE endpoint reachable from the application host (a separate cluster, a
  standalone node, or — if hardware is limited — a **nested** Proxmox installed inside a VM;
  enable nested KVM and keep guest VMs small).
- On that endpoint, create API tokens for both roles used by the portal (discovery token and
  provision token), mirroring the first provider's setup.

**Steps.**
1. **Add the provider.** Settings → Providers → *Add Provider*: `provider_type = proxmox`,
   `endpoint = https://<pve2>:8006/api2/json`, set the discovery + provision token credentials and
   the per-provider `terraform_provider_source`/`version`. Run **Test Connection** (exercises
   `ProxmoxProvider::testConnection`).
2. **Discover.** Trigger discovery (or wait for the auto-discovery interval); confirm the second
   endpoint's nodes, templates, networks, datastores, and VMs appear in the discovery explorer.
3. **Publish.** Publish at least one of each from the second cluster: a node, a catalog
   (template), a network, and a datastore — each becomes a friendly alias (§3.3.2).
4. **Policy.** Create (or reuse) a Tier, and create an **Environment bound to the second
   cluster's node** (via the environment→node rule). This routes the wizard to PVE2.
5. **Provision.** Submit a provision request selecting the PVE2 environment; approve it (or use an
   immediate-apply environment); confirm the VM is created on the **second cluster**.

**Evidence to capture (figures for the chapter).**
- The Providers list showing **two `Connected` providers** (two clusters under one control plane).
- The Inventory listing VMs originating from **both** clusters.
- The provisioning wizard showing environment-driven routing to the **PVE2** node.
- (Optional) The per-VM Terraform workspace using PVE2's stored provider source/token — concrete
  proof that the multi-provider path is data-driven, not hardcoded.
