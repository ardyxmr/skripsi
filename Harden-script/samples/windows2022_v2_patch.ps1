# ============================================================================
# ExoVirt sample hardening — WINDOWS SERVER 2022 — VERSION 2 (baseline + patching)
# ============================================================================
# Everything in v1, PLUS Windows Update patching. NEEDS INTERNET.
# Run manually as Administrator over RDP (see the v1 note about why the portal
# Hardening button cannot reach Windows). A reboot may be required afterwards.
# ============================================================================
#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
Write-Host '== ExoVirt Windows hardening v2 (baseline + patching) ==' -ForegroundColor Cyan

# ---- v1 baseline (repeated so v2 is a complete superset) ----
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -Name 'UserAuthentication' -Value 1
$guest = Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue
if ($guest -and $guest.Enabled) { Disable-LocalUser -Name 'Guest' }
net accounts /minpwlen:12 /uniquepw:5 /maxpwage:90 | Out-Null
Write-Host '  [ok] v1 baseline re-applied'

# ---- v2: patching / package install ----

# 1) Enable automatic updates (auto-download + scheduled install).
$au = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update'
if (-not (Test-Path $au)) { New-Item -Path $au -Force | Out-Null }
Set-ItemProperty -Path $au -Name 'NoAutoUpdate' -Value 0
Set-ItemProperty -Path $au -Name 'AUOptions'   -Value 4   # 4 = auto download + schedule the install
Write-Host '  [ok] Automatic Windows Updates enabled'

# 2) Install + run all pending Windows Updates now (via the PSWindowsUpdate module).
if (-not (Get-Module -ListAvailable -Name PSWindowsUpdate)) {
    Write-Host '  [..] Installing PSWindowsUpdate module (first run only)'
    Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force | Out-Null
    Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
    Install-Module -Name PSWindowsUpdate -Force -Scope AllUsers
}
Import-Module PSWindowsUpdate
Write-Host '  [..] Downloading + installing updates (this can take a while)'
Get-WindowsUpdate -AcceptAll -Install -IgnoreReboot -Verbose

Write-Host 'v2 hardening + patching complete. Reboot to finish pending updates.' -ForegroundColor Green
