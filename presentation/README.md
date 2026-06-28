# Presentation examples: Terraform and Ansible

Two files back the "Infrastructure as Code" slide:

- `main.tf` - the full provisioning contract in one file (provider, variables,
  the `proxmox_vm_qemu` resource, outputs).
- `hardening.yml` - the Ansible playbook that configures a VM after Terraform
  builds it.

Both come straight from the running system. `terraform fmt` and
`ansible-playbook --syntax-check` pass on them.

## The platform runs on one Terraform resource

Every VM is a `proxmox_vm_qemu` cloned from a golden cloud-init template. The
thesis contribution is not the resource count. It is how the portal drives that
one resource safely, per VM, at scale. Each point below carries a `[n]` tag in
`main.tf`.

| # | Challenge | Where to look | What to say |
|---|-----------|---------------|-------------|
| 1 | Provider pinning | `terraform { required_providers }` | Pin one provider version and freeze the locked plugin into each workspace, so a provider upgrade never re-plans older VMs (ADR-18). |
| 2 | State isolation | one resource per rendered workspace | One VM per state file. A failed clone in a batch of ten leaves the other nine untouched. A single monolithic state would strand the whole batch. |
| 3 | Variable-driven | `variable` blocks | `main.tf` stays identical across every VM. The portal writes a new `terraform.tfvars` and re-applies. A resize edits values, not code. |
| 4 | Clone plus cloud-init | `clone`, `ciuser`, `ipconfig0` | Clone the template, then cloud-init sets hostname, user, key, and grows the boot disk on first boot. |
| 5 | Structured disks | `disks { scsi { ... } }` | The old Telmate `disk` list reorders in state and plans phantom changes. Named slots stay put. |
| 6 | Dynamic data disks | `dynamic "scsi1"` | Data disks attach one at a time through an approval-gated action. The wired slot count is a hard ceiling. |
| 7 | Live hotplug | `automatic_reboot`, `hotplug`, `numa`, `balloon` | Resize CPU, RAM, and disk on a running VM with no reboot. Growing is live; shrinking RAM still needs one. |
| 8 | Drift control | `lifecycle { ignore_changes }` | Discovery owns runtime state. Terraform ignores the DHCP lease and key rotation, so they never cause a re-plan. |
| 9 | Serial console | `serial { id = 0 }` | Telmate drops the template serial device on clone, which breaks the console. Re-declaring it restores noVNC and `qm terminal`. |
| 10 | Outputs | `output "vmid"`, `output "default_ipv4"` | The provisioning job reads these back to fill the Inventory row. |

## Then Ansible takes over

Terraform builds the VM. `hardening.yml` configures it. The portal connects as
the cloud-init user with the SSH key Terraform injected, escalates with sudo,
and runs ten idempotent, config-only tasks (SSH lockdown, sysctl, banner,
shadow permissions, and more). No passwords travel with the run. Every run keeps
its own workspace, inventory, and execution log for the audit trail.

This is the two-tool split worth stating out loud: Terraform owns the VM
lifecycle, Ansible owns in-guest configuration.
