// Faithful core ERD — Proxmox Self-Service VM Provisioning Portal
// Verified against DBeaver export (35 tables / 64 FKs). Framework tables omitted.
// Render at https://dbdiagram.io

// ---------- IAM ----------
Table roles {
  id integer [pk]
  role_name varchar
}
Table groups {
  id integer [pk]
  group_name varchar
  manager_user_id integer [ref: > users.id]
}
Table users {
  id integer [pk]
  name varchar
  email varchar
  role_id integer [ref: > roles.id]
  group_id integer [ref: > groups.id]
  status varchar
}

// ---------- Providers + discovered mirror ----------
Table providers {
  id integer [pk]
  provider_name varchar
  provider_type varchar [note: 'proxmox | openstack | olvm']
  endpoint varchar
  status varchar
}
Table provider_nodes {
  id integer [pk]
  provider_id integer [ref: > providers.id]
  node_name varchar
  status varchar
}
Table provider_templates {
  id integer [pk]
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  template_name varchar
}
Table provider_networks {
  id integer [pk]
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  bridge varchar
}
Table provider_datastores {
  id integer [pk]
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  storage varchar
}
Table provider_vms {
  id integer [pk]
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  external_vmid varchar
  power_state varchar
}

// ---------- Published (curated aliases) ----------
Table nodes {
  id integer [pk]
  node_name varchar
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  created_by integer [ref: > users.id]
}
Table catalogs {
  id integer [pk]
  catalog_name varchar
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  provider_template_id integer [ref: > provider_templates.id]
  status varchar
  created_by integer [ref: > users.id]
}
Table networks {
  id integer [pk]
  network_name varchar
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  provider_network_id integer [ref: > provider_networks.id]
  status varchar
  created_by integer [ref: > users.id]
}
Table datastores {
  id integer [pk]
  datastore_name varchar
  provider_id integer [ref: > providers.id]
  provider_node_id integer [ref: > provider_nodes.id]
  provider_datastore_id integer [ref: > provider_datastores.id]
  status varchar
  created_by integer [ref: > users.id]
}
Table catalog_hardening_versions {
  id integer [pk]
  catalog_id integer [ref: > catalogs.id]
  name varchar
  version varchar
  is_active boolean
  created_by integer [ref: > users.id]
}

// ---------- Policy ----------
Table tiers {
  id integer [pk]
  tier_name varchar
  vcpu integer
  ram_mb integer
  disk_gb integer
  created_by integer [ref: > users.id]
}
Table environments {
  id integer [pk]
  environment_name varchar
  expiry_type varchar
  expiry_value integer
  grace_period_type varchar
  grace_period_value integer
  approval_required boolean
  allow_data_disk boolean
  max_data_disks integer
  status varchar
  created_by integer [ref: > users.id]
}
Table environment_provider_rules {
  id integer [pk]
  environment_id integer [ref: > environments.id]
  provider_id integer [ref: > providers.id]
}
Table environment_node_rules {
  id integer [pk]
  environment_id integer [ref: > environments.id]
  node_id integer [ref: > nodes.id]
}
Table environment_tier_rules {
  id integer [pk]
  environment_id integer [ref: > environments.id]
  tier_id integer [ref: > tiers.id]
}

// ---------- Requests + approvals ----------
Table provision_requests {
  id integer [pk]
  requester_id integer [ref: > users.id]
  environment_id integer [ref: > environments.id]
  provider_id integer [ref: > providers.id]
  node_id integer [ref: > nodes.id]
  catalog_id integer [ref: > catalogs.id]
  tier_id integer [ref: > tiers.id]
  network_id integer [ref: > networks.id]
  datastore_id integer [ref: > datastores.id]
  status varchar
}
Table approval_requests {
  id integer [pk]
  request_type varchar [note: 'PROVISION | RESIZE | RENEWAL | DESTROY | ...']
  reference_id integer [note: 'polymorphic: provision_request OR inventory id']
  requester_id integer [ref: > users.id]
  approver_id integer [ref: > users.id]
  group_id integer [ref: > groups.id]
  status varchar
  action_type varchar
  action_reason varchar
  action_date timestamp
  payload jsonb
}

// ---------- Inventory ----------
Table inventory {
  id integer [pk]
  vm_name varchar
  owner_user_id integer [ref: > users.id]
  environment_id integer [ref: > environments.id]
  provider_id integer [ref: > providers.id]
  node_id integer [ref: > nodes.id]
  catalog_id integer [ref: > catalogs.id]
  tier_id integer [ref: > tiers.id]
  network_id integer [ref: > networks.id]
  datastore_id integer [ref: > datastores.id]
  provision_request_id integer [ref: > provision_requests.id]
  hardened_version_id integer [ref: > catalog_hardening_versions.id]
  external_vmid varchar
  status varchar
  expiry_date timestamp
}
Table inventory_disks {
  id integer [pk]
  inventory_id integer [ref: > inventory.id]
  disk_index integer
  size_gb integer
}

// ---------- Audit ----------
Table audit_logs {
  id integer [pk]
  user_id integer [ref: > users.id]
  action_type varchar
  description varchar
  metadata jsonb
  created_at timestamp
}

TableGroup IAM {
  roles
  groups
  users
}
TableGroup Discovered {
  providers
  provider_nodes
  provider_templates
  provider_networks
  provider_datastores
  provider_vms
}
TableGroup Published {
  nodes
  catalogs
  networks
  datastores
  catalog_hardening_versions
}
TableGroup Policy {
  tiers
  environments
  environment_provider_rules
  environment_node_rules
  environment_tier_rules
}
TableGroup Requests {
  provision_requests
  approval_requests
}
TableGroup Inventory {
  inventory
  inventory_disks
}
TableGroup Audit {
  audit_logs
}