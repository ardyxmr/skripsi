#!/usr/bin/env bash
#
# check-provider-compat.sh — Pre-upgrade gate for the Terraform provider version (ADR-18).
#
# Validates the master provisioning stub against a CANDIDATE provider version BEFORE you bump
# providers.terraform_provider_version in the DB. Catches schema/syntax breaks offline in ~30s
# (e.g. a future Telmate release dropping the legacy `disk` list block we rely on) WITHOUT
# touching any existing VM workspace — existing VMs stay pinned to their own provider via their
# per-workspace .terraform.lock.hcl (ADR-08/09), so this probe can never disturb them.
#
# Usage:
#   scripts/check-provider-compat.sh <version> [source] [variant]
#   scripts/check-provider-compat.sh 3.0.2-rc04
#   scripts/check-provider-compat.sh 3.0.1-rc6 Telmate/proxmox structured
#   scripts/check-provider-compat.sh 3.0.2-rc04 Telmate/proxmox legacy
#
# variant: which stub to validate — 'structured' (default, the active one) or 'legacy'.
# Exit codes: 0 = PASS (stub validates) · 1 = FAIL (init/validate failed) · 2 = usage/setup error.
set -euo pipefail

VERSION="${1:-}"
SOURCE="${2:-Telmate/proxmox}"
VARIANT="${3:-structured}"
if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <provider-version> [source=Telmate/proxmox] [variant=structured|legacy]" >&2
  exit 2
fi

case "$VARIANT" in
  structured) STUB_REL="master-provisioning/terraform-structured" ;;
  legacy)     STUB_REL="master-provisioning/terraform" ;;
  *) echo "ERROR: variant must be 'structured' or 'legacy'" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUB_DIR="$SCRIPT_DIR/../storage/app/$STUB_REL"
[[ -f "$STUB_DIR/main.tf" ]] || { echo "ERROR: stub not found at $STUB_DIR" >&2; exit 2; }
command -v terraform >/dev/null || { echo "ERROR: terraform not on PATH" >&2; exit 2; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$STUB_DIR/main.tf" "$STUB_DIR/variables.tf" "$WORK/"

# provider.tf pinned to the CANDIDATE version (mirrors TerraformRenderer::providerTf).
cat > "$WORK/provider.tf" <<HCL
terraform {
  required_providers {
    proxmox = {
      source  = "$SOURCE"
      version = "$VERSION"
    }
  }
}

provider "proxmox" {
  pm_tls_insecure = true
}
HCL

# Sample tfvars that exercises the data_disks dynamic block (the add-disk path, ADR-16).
cat > "$WORK/terraform.tfvars" <<HCL
vm_name      = "compat-probe"
target_node  = "probe"
template     = "probe-template"
network      = "vmbr0"
storage      = "probe-store"
cores        = 2
memory       = 4096
disk_size_gb = 40
data_disks   = [{ slot = "scsi1", size = 10, storage = "probe-store" }]
HCL

# The proxmox provider validates its endpoint at `validate` time but does NOT connect to the
# server, so dummy creds make this a safe OFFLINE schema gate.
export PM_API_URL="https://127.0.0.1:8006/api2/json"
export PM_API_TOKEN_ID="probe@pam!probe"
export PM_API_TOKEN_SECRET="00000000-0000-0000-0000-000000000000"
export PM_TLS_INSECURE="true"

echo "==> Probing ${SOURCE} @ ${VERSION} against the ${VARIANT} stub"

echo "--- terraform init -upgrade (download candidate provider) ---"
if ! terraform -chdir="$WORK" init -upgrade -input=false -no-color; then
  echo
  echo "RESULT: FAIL — could not initialise ${SOURCE}@${VERSION} (download / registry error)."
  exit 1
fi

echo "--- terraform validate (schema gate) ---"
if ! terraform -chdir="$WORK" validate -no-color; then
  echo
  echo "RESULT: FAIL — the master stub does NOT validate against ${SOURCE}@${VERSION}."
  echo "        Likely a schema change (e.g. the legacy 'disk' list block was removed)."
  echo "        Do NOT bump providers.terraform_provider_version until the stub is updated (ADR-18)."
  exit 1
fi

LOCKED="$(grep -oE 'version[[:space:]]*=[[:space:]]*"[^"]+"' "$WORK/.terraform.lock.hcl" 2>/dev/null | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || true)"
cat <<EOF

RESULT: PASS — master stub validates against ${SOURCE}@${LOCKED:-$VERSION}.

NEXT (manual, recommended before rollout): provision ONE test VM through the portal with this
version on a throwaway environment, then run add-disk + resize + destroy and confirm a clean
re-plan. Only after that smoke test should you bump providers.terraform_provider_version for
real workloads. Existing VMs are unaffected either way — they keep their own pinned provider.
EOF
