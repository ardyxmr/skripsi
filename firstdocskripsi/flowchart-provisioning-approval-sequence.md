%%{init: {'theme':'neutral'}}%%
sequenceDiagram
  actor U as User (SPA)
  participant API as Laravel API
  participant POL as ProvisionRequestService
  participant DB as PostgreSQL
  actor APR as Approver
  participant Q as Queue / Worker
  participant TF as TerraformRunner
  participant PVE as Proxmox VE
  participant RV as Reverb (WS)

  U->>API: POST /api/provision-requests
  API->>POL: validate against Environment allow-lists
  POL->>DB: check provider/node/tier/network/datastore rules + caps
  alt approval required & not privileged
    API->>DB: create ApprovalRequest (Pending) + audit
    API-->>U: 201 awaiting approval
    APR->>API: POST /api/approvals/{id}/approve
    API->>Q: dispatch ProvisionVmJob
  else immediate (privileged / no-approval env)
    API->>Q: dispatch ProvisionVmJob
    API-->>U: 201 queued
  end
  Q->>TF: render per-VM workspace + apply
  TF->>PVE: clone template → create VM
  PVE-->>TF: vmid / IP
  Q->>DB: Inventory = Active (+ audit)
  Q->>RV: VmStateChanged event
  RV-->>U: live status update
  opt hardening enabled
    Q->>PVE: Ansible playbook (SSH, key-based)
  end