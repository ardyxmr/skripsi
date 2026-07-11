# ============================================================================
# ExoVirt sample hardening — WINDOWS SERVER 2022 — VERSION 1 (simple baseline)
# ============================================================================
# IMPORTANT: The ExoVirt portal "Hardening" button runs Ansible over an SSH KEY
# as `sysuser`. Windows access in ExoVirt is PASSWORD-over-RDP (sshkeys are
# ignored on the Windows image), so this CANNOT run through the portal.
#
# HOW TO RUN: RDP into the VM as `sysuser` (it is in Administrators) →
# open PowerShell as Administrator → run this script. (Or bake it into the
# golden image.) Config-only; no internet needed.
#
# SAFE BY DESIGN: does NOT disable Administrator or sysuser, and does NOT block
# RDP — you keep your access.
# ============================================================================
#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
Write-Host '== ExoVirt Windows hardening v1 (baseline) ==' -ForegroundColor Cyan

# 1) Disable the legacy, insecure SMBv1 protocol.
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
Write-Host '  [ok] SMBv1 disabled'

# 2) Turn the Windows Firewall ON for all profiles.
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True
Write-Host '  [ok] Firewall enabled (all profiles)'

# 3) Require Network Level Authentication (NLA) for RDP.
$rdp = 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp'
Set-ItemProperty -Path $rdp -Name 'UserAuthentication' -Value 1
Write-Host '  [ok] RDP now requires NLA'

# 4) Disable the built-in Guest account (if present + enabled).
$guest = Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue
if ($guest -and $guest.Enabled) { Disable-LocalUser -Name 'Guest'; Write-Host '  [ok] Guest account disabled' }
else { Write-Host '  [skip] Guest account already disabled/absent' }

# 5) Basic password policy: min length 12, remember 5 passwords, max age 90 days.
net accounts /minpwlen:12 /uniquepw:5 /maxpwage:90 | Out-Null
Write-Host '  [ok] Password policy set (len>=12, history=5, maxage=90)'

# 6) Disable AutoRun/AutoPlay on all drives (USB malware vector).
$exp = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer'
if (-not (Test-Path $exp)) { New-Item -Path $exp -Force | Out-Null }
Set-ItemProperty -Path $exp -Name 'NoDriveTypeAutoRun' -Value 255
Write-Host '  [ok] AutoRun disabled'

Write-Host 'v1 baseline hardening complete.' -ForegroundColor Green
