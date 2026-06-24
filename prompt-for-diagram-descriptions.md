Your task is to write detailed, thesis-grade explanations, narratives, and flow descriptions for all the diagrams, flowcharts, and the Entity Relationship Diagram (ERD) you implemented. These narratives will be integrated into **Bab III (Chapter 3 — Metodologi Penelitian)** of the undergraduate thesis (skripsi) in the draft file `existing-ch-3-v2.md`.

---

### **Mapping & Structure (from README.md)**
Refer to `README.md` for the exact final mapping of diagrams to Chapter 3 sections and figure numbers:

1. **§3.5.1 Arsitektur Sistem**
   - **Gambar 3.2 Arsitektur Sistem** $\rightarrow$ `flowchart-system-architecture.md` (Note: This is *not* a UML diagram).
2. **§3.5.2 Pemodelan UML**
   - **Gambar 3.3 Use Case Diagram** $\rightarrow$ `diagram-3-3-use-case.md`
   - **Gambar 3.4 Activity Diagram: Provisioning Mesin Virtual** $\rightarrow$ `diagram-3-4-activity-provisioning.md`
   - **Gambar 3.5 Activity Diagram: Approval Request** $\rightarrow$ `diagram-3-5-activity-approval.md`
   - **Gambar 3.6 Activity Diagram: Inventory Mesin Virtual** $\rightarrow$ `diagram-3-6-activity-inventory.md`
   - **Gambar 3.7 Sequence Diagram: Provisioning Mesin Virtual** $\rightarrow$ `diagram-3-7-sequence-provisioning.md`
   - **Gambar 3.8 Sequence Diagram: Approval Request** $\rightarrow$ `diagram-3-8-sequence-approval.md`
   - **Gambar 3.9 Sequence Diagram: Eksekusi Terraform ke Proxmox VE** $\rightarrow$ `diagram-3-9-sequence-terraform-proxmox.md`
   - **Gambar 3.10 Class Diagram** $\rightarrow$ `diagram-3-10-class.md`
   - *(Note: `flowchart-provisioning-approval-sequence.md` is replaced by the three separate sequence diagrams above. Use it only as a high-level context overview; do not count it as a separate figure in §3.5.2).*
3. **§3.5.3 Perancangan Basis Data dan ERD**
   - **Gambar 3.11 Entity Relationship Diagram** $\rightarrow$ `Database-relation.md` (written in DBML syntax).
4. **§3.5.4 Lapisan Abstraksi dan Kebijakan**
   - **Gambar 3.12 Diagram Aliran Data Lapisan Abstraksi** $\rightarrow$ `flowchart-provider-discovery.md` (Note: This is *not* a UML diagram).

---

### **Critical Writing Guidelines: Academic Indonesian & Stop-Slop Rule**
Your writing must follow strict academic standards for an Indonesian thesis. You must adhere to the **stop-slop** rules:
- **Write in formal academic Indonesian** (Bahasa Indonesia ilmiah/baku).
- **No Em-Dashes**: Do not use the em-dash (`—`) character in text or captions. Use standard formatting (e.g. colons, parentheses, or simple dashes `-`).
- **Remove Intensifiers & Adverbs**: Strip out non-analytical intensifiers and filler adverbs. Avoid words like:
  - *sangat*
  - *cukup*
  - *tentu saja*
  - *sebenarnya*
  - *secara langsung*
  - *secara otomatis* (use *otomatis* or reformulate)
  - *saja*
  - *terlalu*
- **Use Direct & Active Language (Kalimat Langsung)**: Keep the sentences direct, clear, objective, and active where possible to ensure high readability and academic rigor.
***For extra tools you can use "stop-slop skills"

---

### **What Each Narrative Must Contain**

For each diagram, write a comprehensive section containing:
- **An introductory explanation** of the diagram's scope.
- **Detailed role descriptions** of all actors, classes, tables, or sub-components involved.
- **A step-by-step walk-through of the process flow**, highlighting the "story" (what triggers the event, how the Laravel API handles it, what Redis jobs are dispatched, what database changes occur, how Terraform/Ansible interact with Proxmox, and how real-time notifications are sent via Reverb WebSocket).

#### **Key Points to Cover:**
- **Gambar 3.2 (Architecture)**: Explain the flow from SPA through Nginx to the Laravel API/Reverb, the async job scheduling in Redis, and how workers run Terraform/Ansible.
- **Gambar 3.3 (Use Case)**: Elaborate on the actors (User, Approver, Admin), their generalization structure, and every use case.
- **Gambar 3.4, 3.5, 3.6 (Activities)**: Walk through swimlanes (Pengguna, Sistem, Approver) and decision nodes (e.g., validation rules, conditional approval gates, synchronous/asynchronous lifecycle processing).
- **Gambar 3.7, 3.8, 3.9 (Sequences)**: Explain the chronological flow of messages, isolated Terraform workspaces, job dispatching, and state changes.
- **Gambar 3.10 (Class Diagram)**: Describe domain models grouped by layers (IAM, Provider Mirror, Published Alias, Policies, Requests/Approvals, Inventory, and Audit).
- **Gambar 3.11 (ERD)**: Systematically detail the database schema, foreign key relationships, table groups, and design decisions.
- **Gambar 3.12 (Lapisan Abstraksi)**: Explain how raw Proxmox resources are discovered/mirrored, how they are published as user-friendly aliases, how environment policies filter options on the provisioning wizard.

---

### **Expected Output Format**
Provide the descriptions in a clean Markdown format. Structure them with clear headings matching the section hierarchy of `existing-ch-3-v2.md` so that they can be easily inserted into the placeholders.
