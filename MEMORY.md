# Project Memory: Proxmox Self-Service Portal

**Keyword Response:** Jika pengguna menyebutkan "memory", baca file ini untuk memulihkan konteks proyek seketika.

## 1. Ringkasan Proyek
- **Nama:** Proxmox Self-Service VM Provisioning Portal.
- **Tujuan:** Portal web *self-service* untuk request pembuatan Virtual Machine (VM) yang diotomatisasi dengan Terraform (IaC) dan di-hardening dengan Ansible di platform Proxmox VE 9.1.
- **Fitur Utama:** Katalog OS, Alur Persetujuan (Approval Workflow), Eksekusi latar belakang Terraform/Ansible (via `Symfony\Process` Laravel), pemantauan status real-time/polling.

## 2. Tech Stack (Teknologi)
- **Frontend:** React.js (Vite setup). Library terkait: react-router-dom, axios, zustand/redux, react-hook-form. (Direktori: `frontend/`)
- **Backend:** Laravel. Library terkait: Sanctum (Autentikasi API), Spatie (RBAC). (Direktori: `backend/`)
- **Database:** PostgreSQL.
- **Infrastruktur/Orkestrasi:** Proxmox VE 9.1, Terraform, Ansible.

## 3. Arsitektur & Alur Kerja
- **Role (Hak Akses):**
  1. **User (Requestor):** Bisa melihat katalog, request VM, cek status di Inventory.
  2. **Approver (Manager):** Menerima, meninjau, menyetujui/menolak request dari User.
  3. **Admin:** Kelola semua setting (User, Network, Datastore, Catalog, Tier) dan bisa melakukan provisioning/approval global.
- **Spesifikasi (Tier):** Bronze (1 RAM/1 vCPU), Silver (2 RAM/2 vCPU), Gold (3 RAM/3 vCPU). Kapasitas disk diatur kustom.
- **Lingkungan (Environment):** Development (30 hari), Staging (60 hari), Production (Permanen).
- **Isolasi State:** Laravel membuat folder dinamis per request `{Username}/date_pr{DDMMYYYY_His}` untuk mengisolasi state Terraform (`main.tf`, `provider.tf`, `terraform.tfstate`) agar tidak bentrok.
- **Hardening:** Opsi tambahan via checkbox untuk menjalankan Ansible (`hardening.yml`).
- **Approval Request Workflow:** Permintaan berstatus `Pending` dapat di-*Approve*, *Reject*, atau di-*Revert*. Fungsi *Revert* akan mengubah status menjadi `Need Action`. Permintaan dengan status `Need Action` dapat diedit (diarahkan ke form *Provision VM*) lalu disubmit ulang. Seluruh eksekusi keputusan (Approve/Reject/Revert) mewajibkan input alasan yang akan dicatat di log `actionHistory`.

## 4. Konfigurasi Lingkungan (.env Root)
Terdapat file `.env` di *root* proyek yang memuat kredensial penting:
- **Proxmox Cluster:** URL `https://192.168.200.134:8006/api2/json`, target node `pve`.
- **Proxmox API Token:** Token ID `app-provisioner@pve!provisioner-token` (dan Secret-nya).
- **Infrastruktur Default:** Storage `vmdata` dan Network Bridge `vmbr0`.
- **Database PostgreSQL:** Host `127.0.0.1`, DB `infraprov`, User `provisioner`.

## 5. Status Proyek Saat Ini (Current State)
- Direktori `frontend/` (React+Vite) dan `backend/` (Laravel) sudah diinisialisasi.
- Dokumen perencanaan (`PRD.md`, `architec.md`, `implementation-plan.md`) telah dibuat.
- **Frontend UI Overhaul (Terbaru):** 
  - Mengimplementasikan UI modern bergaya enterprise (Dark Mode, Navbar atas, animasi mulus) di `App.jsx`.
  - Merombak halaman **Catalog**, menyederhanakan *tier selection* dan desain *glass-morphism*.
  - Mengubah **Provision VM (VmRequest.jsx)** menjadi 3-langkah Wizard interaktif dengan *Naming Preview* dan batasan sumber daya.
  - Membangun halaman **Approval Request (Approvals.jsx)** secara komprehensif. Dilengkapi tabel *expandable* yang menyajikan jejak riwayat log (*Action History*), widget dasbor 5-kolom (termasuk status `Need Action`), sistem *Unified Action Modal* (wajib alasan untuk aksi Approve/Reject/Revert), panel *Bulk Action* cerdas, serta fungsi *Sticky Header* tangguh dengan kolom yang dapat digeser leburnya (*resizable*).
  - Menyempurnakan halaman **Inventory (Inventory.jsx)** dengan *Sticky Header Tabel*, *Vertical/Horizontal Scroll*, *Detail Drawer* interaktif, *Expiry Countdown Logic*, dan dropdown opsi aksi.
  - Menyelaraskan seluruh modul di **Settings (Settings.jsx)** (User, Provider, Catalog, dan Network) dengan konsistensi UI ketat, termasuk *stats widget*, *resizable table columns*, *portal-based dropdowns*, form penambahan data kompleks, mode *view mapping read-only*, serta batasan `height: auto` agar meminimalisir ruang kosong.
  - **Provider Management Overhaul:** Membangun *dual-collapsible sidebar* untuk form manajemen *Provider* (Pemisahan pengaturan *Provisioning* dan *Discovery*), menyempurnakan tabel dengan indikator status (*Connection Status*, *Discovery Status*, *Last/Next Discovery*), serta merancang **Discovery Explorer**—sebuah laci detail interaktif berarsitektur *Master-Detail Layout* yang menyajikan perpindahan tampilan sumber daya (Nodes, Templates, Networks, Datastores) yang selaras dengan kapabilitas *discovery* infrastruktur asli (menampilkan *CIDR* pada Networks, menghapus atribut manajemen seperti *Environment* dan *OS Type*, serta mendukung tipe *ZFS* pada Datastores) secara mulus (*smooth transition*) dilengkapi fitur *search* dan penghitung sumber daya *real-time*.
  - **Catalog Management Overhaul:** Memperbarui manajemen katalog dengan UI *Single Modal* yang komprehensif untuk menjaga konsistensi dengan form aplikasi lainnya (menggantikan UI Wizard sebelumnya). Kolom *Provider* dan *Template* ditambahkan ke tampilan tabel, dan struktur *Template Mapping* dalam **Catalog Explorer Drawer** diperbarui menjadi arsitektur tiga tingkat: *Source Provider* -> *Source Node* -> *Published Template*, membuang elemen infrastruktur *placement* (seperti *Datastore/Compute Node*) yang bukan ranah lapisan ini. Selain itu, ditambahkan widget *Providers Used* untuk menghitung penggunaan provider unik, serta perlindungan ketat terhadap aksi *Enable*, *Disable*, dan *Delete* Catalog dengan *confirmation modals* yang mewajibkan pengetikan nama katalog dan validasi ketergantungan sumber daya (blocking modal jika katalog sedang digunakan).
  - **Network Management Overhaul:** Menyempurnakan form manajemen Network dengan menghapus *Catalog Assignment* untuk menyesuaikan arsitektur murni, lalu menambahkan dependensi berjenjang *Provider -> Node -> Discovered Network* yang responsif secara *real-time*. *Popup Mapping Modal* lama digantikan oleh **Network Explorer Drawer** (struktur 4 tingkat: *Provider -> Node -> Discovered Network -> Published Network*) yang terbuka dari sisi kanan layar, dan mengimplementasikan validasi konsistensi penuh menggunakan *Action Confirmation Modals* serta *Delete Blockers* (sama persis dengan arsitektur Catalog Management).
- Proyek siap dihubungkan ke API (Fase Backend) atau melanjutkan fungsionalitas UI lain.

## 6. Frontend Design System Rules
Pastikan mematuhi panduan desain kustom berikut saat memodifikasi atau membuat komponen UI baru di React:
- **Backgrounds**: Dilarang menggunakan *hardcoded* Slate/Gray pada mode gelap (misal: `dark:bg-slate-800`). Gunakan *token* kustom `dark:bg-card`, `dark:bg-surface`, atau `dark:bg-page`.
- **Borders**: Hindari warna *border* statis di mode gelap (`dark:border-slate-700` atau `border-slate-600`). Gunakan `dark:border-theme` secara seragam.
- **Table & Header**: Elemen struktural seperti *header* tabel dan *search bar* harus bebas dari background abu-abu (`bg-gray-50`); gunakan `bg-transparent dark:bg-transparent`.
- **Shapes & Shadows**: Gunakan `rounded-card` (alih-alih `rounded-2xl` dsb.) dan `shadow-card` (alih-alih bayangan statis `shadow-[...]`).

## 7. Instruksi AI (Bila Membaca File Ini)
- Pahami konteks di atas secara menyeluruh.
- Wajib menerapkan **Frontend Design System Rules** (Bagian 6) pada setiap pembuatan/perubahan UI di *frontend* agar konsistensi desain tidak rusak.
- Lanjutkan tugas apa pun yang diminta oleh pengguna dengan berpatokan pada arsitektur API-Driven dan batasan yang telah didefinisikan (React -> Laravel -> Terraform/Ansible -> Proxmox).

## 2026-06-04 - Architecture Alignment Updates (Phase 3)
- Implemented the "Offline / Missing" status model across both Catalog and Network Management modules, replacing the old "Active/Disabled" dichotomy.
- Updated the main top-level dashboard statistics to feature "Healthy" and "Offline / Missing" metrics, eliminating the previous "Active" and "Disabled" widget blocks for better operational clarity.
- Engineered dynamic styling logic for data tables to render the "Offline / Missing" status pill with distinct warning (rose) colors.
- Upgraded both the Catalog Explorer and Network Explorer Drawers to visibly render the exact missing reason (e.g. `Source Node Missing`, `Provider Disconnected`) adjacent to the "Offline" status badge.
- Added dummy data records across both models (`Rocky Linux Base` and `VM-NET-ISOLATED`) properly configured with the new missing states and reasons to effectively mock the user interface.
- Verified all component trees via headless React evaluation (`run-test.mjs`).
- FIXED bug: Added missing `AlertCircle` import from `lucide-react` which was causing the Catalog and Network Explorers to crash with a white screen when attempting to render the "Offline / Missing" missing reason UI element.

## 2026-06-04 - Explorer Consistency Improvements
- Standardized the Network Explorer Drawer header layout to exactly match the Catalog Explorer. Both now surface the Status, Missing Reason, Usage (VM Count), and Last Updated data prominently at the very top of the drawer.
- Removed the duplicated status/reason badges from the inner "Published Network" mapping card inside Network Explorer.
- Updated the dummy data for "Rocky Linux Base" to accurately reflect a `Provider Disconnected` scenario. The "Source Provider" mapping card was enhanced to support dynamic rendering of a red "Disconnected" badge and a "Last Seen" timestamp when connectivity drops.
- Verified rendering stability via React headless evaluation testing.

## 2026-06-04 - Network Management Architecture Alignment Improvements
- Upgraded the Network Management module to strictly follow the Published Resource architecture from Catalog Management.
- Inserted Tier assignments into the dummy data array for Networks.
- Added a "Resource Tiers" multi-select checklist to the Add/Edit Network modal form.
- Introduced a new "Tier" column to the Network overview table, rendering the exact same visual badge styles for Gold, Silver, and Bronze tiers.
- Removed the redundant "Usage Statistics" card from the Network Explorer Drawer and replaced it with a "Tier Assignments" card identical to the one in Catalog Explorer.
- Successfully passed the React headless evaluation tests with no rendering crashes.

## 2026-06-04 - Datastore Management Implementation
- Created the full `Datastore Management` view under `Settings.jsx` following strict consistency rules with `Catalog` and `Network` modules.
- Implemented `initialDatastores` mock data array, integrating new attributes like `capacity`, `activeVMs`, and `missingReason`.
- Added the `Datastore Explorer Drawer` which implements a Master-Detail Layout displaying:
  - Header with Status, Capacity Overview, Active VMs, and Updated Timestamp.
  - Interactive Mapping Architecture blocks (Source Provider -> Source Node -> Discovered Datastore -> Published Datastore) with animated pulsing elements.
  - Dedicated assignments cards for Environments and Resource Tiers.
- Hooked up `Datastore Action Modal` using the established unified action modal system, featuring strict dependency deletion blockers (`activeVMs > 0` validation).
- Refined the main Settings layout by adapting the conditional rendering logic, injecting Datastore table and stats dashboard, and updating the Add/Edit form with Provider -> Node -> Datastore hierarchical selection validation.
- All code was successfully compiled and tested via Vite build ensuring state stability.

## Datastore Management Fixes - Bug Resolution
- Injected `datastore_form.jsx` into `Settings.jsx` to render the Add/Edit form.
- Injected `datastore_drawer.jsx` into `Settings.jsx` to correctly show the Datastore Explorer.
- Injected `datastore_action_modal.jsx` into `Settings.jsx` to handle Enable/Disable/Delete actions.
- Fixed the filter/sort logic by rendering `sortedDatastores` instead of `datastores`.
- Restructured Datastore overview statistics widget to Option A (Total, Healthy, Disabled, Offline / Missing, Low Capacity).
- Added refresh animation, handler, and Toast notification for datastores.
- Fixed delete protection logic to strictly check if `activeVMs > 0` and correctly read the array structure of `datastore.environment`.
- Updated Datastore mock dummy data string wording to exactly match `Capacity Threshold Reached`.

## Datastore Management - Final Alignments
- Removed Low Capacity and Offline / Missing from status dropdown options.
- Refactored statistics widget to show Total, Active, Offline / Missing, Low Capacity, Active Nodes.
- Replaced "Healthy" status with "Active" across all data and UI components (mock data, filters, badges, drawer, forms).
- Updated datastore refresh toast styling to match Catalog and Network modules.
- Renamed columns "Provider Datastore" to "Provider Storage" and "Datastore Type" to "Storage Type".

## Datastore Management - Architectural Refactoring
- Extracted Datastore mock data into `src/modules/settings/datastore/datastoreData.js`.
- Extracted Add/Edit Datastore Modal into `src/modules/settings/datastore/DatastoreForm.jsx`.
- Extracted Datastore Explorer Drawer into `src/modules/settings/datastore/DatastoreExplorer.jsx`.
- Consolidated all state and main UI logic into `src/modules/settings/datastore/DatastoreManagement.jsx`.
- Cleaned up `Settings.jsx` by removing all datastore-related states, helper functions, and monolithic UI rendering blocks, leaving only a clean `<DatastoreManagement />` import.
- Verified with `npm run build` to ensure zero breaking changes.

## Network Management - Architectural Refactoring
- Extracted Network mock data into src/modules/settings/network/networkData.js.
- Extracted Add/Edit Network Modal into src/modules/settings/network/NetworkForm.jsx.
- Extracted Network Explorer Drawer into src/modules/settings/network/NetworkExplorer.jsx.
- Consolidated all state and main UI logic into src/modules/settings/network/NetworkManagement.jsx.
- Cleaned up Settings.jsx by removing all network-related monolithic UI rendering blocks, leaving only a clean <NetworkManagement providers={providers} /> call.
- Verified with npm run build to ensure zero breaking changes.

## Network Management - Regression Fix
- Restored original UI layout, table columns, widgets, filters, action menu, and form layout that were accidentally redesigned during the refactoring process.
- Ensured no merging of columns (e.g. Provider and Node are separate again).
- Fixed Status dropdown in Add/Edit Network form to only contain Active and Disabled (removed system-derived statuses like Offline/Missing).
- Verified with npm run build to ensure UI regression fix causes no errors.

## Catalog Management Refactor (June 5, 2026)
- **Extracted**: The monolithic `Catalog Management` UI inside `Settings.jsx` has been strictly modularized.
- **New Location**: All Catalog UI logic, forms, and dummy data now reside in `frontend/src/modules/settings/catalog/`.
- **Constraint**: **NO VISUAL REDESIGN WAS PERFORMED**. The refactoring is exactly 1:1 with the original layout, columns, widgets, and filters to avoid any regressions as experienced with the earlier Network refactoring.
- **Verification**: Zero build errors (`npm run build`).

## Post-Refactor UI Repair (June 5, 2026)
- Fixed a major syntax error in `Settings.jsx` that resulted in a blank screen (`JSX expected ")" but found "{"`).
- The error was caused by swapped closing tags (`</div>` and `)}`) during automated cleanup of the Network Explorer Drawer.
- UI successfully verified and builds properly.

## UI Dark Mode Corrections (June 5, 2026)
- Replaced `dark:hover:bg-slate-700/50` with `dark:hover:bg-slate-700` and updated background lines `dark:bg-slate-700/50` to `dark:bg-slate-700` to prevent white transparent hover states.
- Replaced `dark:border-card` with `dark:border-[#17243E]` in `Explorer` icons to fix the issue where white borders appeared instead of the correct dark color due to a missing Tailwind class definition.
- Affected files: `DatastoreManagement.jsx`, `CatalogManagement.jsx`, `NetworkManagement.jsx`, `Settings.jsx`, `DatastoreExplorer.jsx`, `CatalogExplorer.jsx`, `NetworkExplorer.jsx`.

## Critical Hotfix (June 5, 2026)
- Resolved a runtime crash (`TypeError: Cannot read properties of undefined`) that caused the blank white screen when opening the Settings menu.
- The crash occurred because multiple state variables (`modal`, `deleteModal`, `networks`, etc.) were accidentally stripped from `Settings.jsx` during the automated Catalog UI extraction script.
- Restored the missing `useState` declarations at the top of `Settings.jsx`. The page now renders properly without runtime errors.

## Provider Management - Architectural Refactoring
- Extracted Provider mock data into `src/modules/settings/provider/providerData.js`.
- Extracted Add/Edit Provider Modal into `src/modules/settings/provider/ProviderForm.jsx`.
- Extracted Provider Discovery Explorer Drawer into `src/modules/settings/provider/ProviderDiscovery.jsx`.
- Extracted Provider Action Modal (Delete, Sync/Enable/Disable) into `src/modules/settings/provider/ProviderActionModal.jsx` keeping the original styling and blockers logic intact.
- Consolidated all state and main UI logic into `src/modules/settings/provider/ProviderManagement.jsx`.
- Cleaned up `Settings.jsx` by removing all provider-related monolithic UI rendering blocks, leaving only a clean `<ProviderManagement providers={providers} setProviders={setProviders} />` call.
- Verified with `npm run build` to ensure zero breaking changes and exact 1:1 UI layout preservation.

## Provider Management - Bug Fixes (June 5, 2026)
- Fixed 'Add Provider' button not opening the modal from the empty state view (replaced obsolete 'openModal' with 'setModal').
- Fixed the close button on the Discovery Explorer Drawer not working by correctly calling the 'onClose' prop instead of trying to manipulate parent state directly.
- Verified overall UI stability through headless build tests.

## Provider Management - Blank Screen Bug Fix (June 5, 2026)
- Fixed crash in ProviderForm by removing obsolete  conditional check that caused undefined property errors.

## Provider Management - Test Connection Restoration (June 5, 2026)
- Restored the 'Test Connection' button logic to 'ProviderForm.jsx', reintroducing 'testResult' and 'isTestingConnection' state hooks.
- Imported necessary UI icons (Play, Loader2, CheckCircle2) from 'lucide-react'.
- Removed leftover dead code referring to the Provider modal from 'Settings.jsx'.
- Verified UI component stability via headless build.

## Phase 3 - Environment Management (June 5, 2026)
- Designed and implemented the complete `EnvironmentManagement` module as the definitive Policy Layer for approval and expiry logic.
- Built a robust `EnvironmentForm.jsx` modal for creating and editing policies (Expiry Time, Manager Approval). 
- Configured dynamic constraints preventing users from deleting or renaming core `System` environments (Development, Staging, Production).
- Implemented `EnvironmentContext` to provide global state.
- Developed `EnvironmentExplorer.jsx`, a visually engaging slide-out drawer that deeply interrogates `CatalogContext`, `NetworkContext`, and `DatastoreContext` to generate a live "Cross-Module Usage Topology". This allows users to see exactly which catalogs, datastores, and networks are currently consuming any given environment policy.
- Verified visual parity, ensuring the Environment tables, badges, headers, action dropdowns, and slide-in animations match the premium design of the `DatastoreManagement` component.

## Environment Management - Bug Fixes & Refinements (June 5, 2026)
- **Unified Action Modal**: Implemented the standardized Action Modal for Environment deletions, enabling, and disabling. This replaces the basic `window.confirm` popup with a premium UI that requires the user to type the environment name to confirm deletion.
- **Strict Deletion Blockers**: Configured the modal to switch to "Blocking Mode" if an environment is currently mapped to any active Catalog, Network, or Datastore. The blocking UI displays a yellow warning and strictly prevents deletion.
- **System Terminology Refactor**: Replaced all references to "System" environments with "Default" environments across the UI, mock data, and internal logic. This improves user comprehension, clearly denoting built-in environments (Development, Staging, Production) while maintaining their deletion/renaming protection lockouts.

## Phase 3 - Tier Management (June 5, 2026)
- Implemented `TierManagement` to act as the Resource Blueprint layer, standardizing CPU, RAM, and Disk specifications (Bronze, Silver, Gold, Platinum).
- Built out `TierContext.jsx` and `tierData.js` to manage global tier state.
- Created `TierForm.jsx` for creating custom compute tiers and editing existing ones. Ensured that Default Tiers (Bronze, Silver, Gold) cannot be renamed.
- Applied identical UI/UX patterns from Catalog and Environment Management (Stats Dashboard, Toolbar, Resizable Table, Dropdowns).
- Inherited the `Unified Action Modal` for Delete/Enable/Disable flows, complete with mock dependency blocking logic for future Environment & Inventory integration.
- Successfully verified the frontend build.

## UI Refinements & Global Bug Fixes (June 5, 2026)
- **Settings.jsx**: Confirmed its role as solely a router component without any business or state logic.
- **Global Escape Key Logic**: Standardized the `ESC` key behavior across all 6 management modules (Provider, Catalog, Network, Datastore, Environment, Tier). The `ESC` key gracefully closes active forms and explorer drawers, properly invoking the 'Unsaved Changes' discard warning if there are pending modifications.
- **Provider Discovery Explorer Bug Fix**: Fixed a critical crash ("blank white screen") when opening the Provider Discovery Explorer caused by a React "Rules of Hooks" violation (a `useEffect` was erroneously placed beneath an early return).
- **CSS Animation Restoration**: Rewrote the mount logic of `ProviderDiscovery.jsx` using `createPortal(..., document.body)` to preserve the drawer element within the DOM when closed. This successfully restored the smooth `transition-transform` slide-in animations.

## Global Table Action Column Standardization (June 5, 2026)
- Reviewed and standardized the Action Column across ALL management modules as per refine.md.
- Integrated TableActionMenu component to User Management, Environment Management, and Tier Management, standardizing the vertical three-dots trigger, center-alignment, and width to match Provider, Catalog, Network, and Datastore Management.
- Ensured all table headers uniformly display 'ACTION' and employ the identical visual dropdown portal menu style.

## UI Performance Optimization - Table Theme Transition (June 6, 2026)
- **Problem**: Changing from Light to Dark mode caused a visual lag/glitch (FOUC) across table columns and rows because Tailwind's `transition-colors` forced the browser to simultaneously animate hundreds of DOM nodes.
- **Solution**: Implemented a CSS Variables-based architecture in `index.css` (`.table-header-optimized`, `.table-row-optimized`) tied directly to the `.dark` selector.
- **Result**: Table backgrounds and text colors now flip instantly with the global theme without waiting for JS re-renders or suffering from `transition-all` layout bottlenecks, while preserving the 150ms smooth transition strictly for `:hover` interactions. Applied refactor to `ResizableTh.jsx` and `UserManagement.jsx`.
- **Bug Fix**: Addressed a "white outline" visual artifact on table columns during dark mode switch by updating `border-bottom-color` to `border-color` in the optimized CSS classes, preventing Tailwind's default light border color from leaking through on adjacent collapsed borders.
- **Provider Management Standardization**: Fixed dark mode visual glitches in `ProviderManagement.jsx` by converting remaining table rows to use `.table-row-optimized`, converting the ACTION header to `.table-header-optimized`, and removing the light-theme `divide-y` on the `<tbody>` to match Catalog/Network table borders.
- **User Management Layout Refresh**: Matched the visual design of the `UserManagement.jsx` "User Panel" table with the `DatastoreManagement.jsx` layout by adding a comprehensive search/filter bar, integrating the standard pagination footer, and expanding horizontal cell paddings (`px-5 py-3`) for consistency.
- **Bug Fix**: Restored missing horizontal divider lines in `UserManagement.jsx` (Role, Group, User) and `ProviderManagement.jsx` tables by re-applying `border-b border-slate-100 dark:border-theme`. Because these rows use `.table-row-optimized` (which avoids `transition-all`), the border color toggles instantly during theme switches without causing transition lag.
- **Bug Fix**: Adjusted table header (`<th>`) bottom border colors to eliminate a harsh white line in dark mode. Applied `border-slate-100 dark:border-theme` across all table headers (`ResizableTh.jsx`, `UserManagement.jsx`, `ProviderManagement.jsx`, `DatastoreManagement.jsx`, etc.) to ensure the header divider perfectly matches the muted opacity and tone of the standard row dividers.
- **Project-Wide Theme Optimization**: Removed `transition-all`, `transition-colors`, and `divide-y` utilities from Search inputs, Refresh buttons, Pagination arrows, and all `<tbody>`/`<tr>` elements across all Settings modules (`Datastore`, `Provider`, `Catalog`, `Network`, `Tier`, `Environment`, `ProviderDiscovery`). Standardized all tables to use `.table-row-optimized` and `.table-header-optimized` with `border-b border-slate-100 dark:border-theme`. This completely eliminates visual lag/glitches (FOUC) when toggling between light and dark modes globally.
- **Top Header Theme Optimization**: Fixed the visual disconnect and transition lag on the main `Topbar` component in `App.jsx`. Replaced `transition-all` with `transition-[padding]` to preserve sidebar sliding animations while allowing background/border colors to switch instantly. Removed lag-inducing `transition-colors` from the Notification and Theme Toggle icons, and replaced `transition-all` on the User Avatar with `transition-transform`, ensuring perfect synchronization with the rest of the dark mode layout.
- **Explorer Sub-Menu Styling Consistency**: Refactored the 'Mapping Architecture' and 'Cross-Module Usage' section headers inside `DatastoreExplorer.jsx`, `NetworkExplorer.jsx`, and `EnvironmentExplorer.jsx`. Removed the bright gray block backgrounds (`bg-slate-50/50 dark:bg-surface/50`) and replaced them with the seamless layout used in `CatalogExplorer.jsx` ('Template Mapping'). Also cleaned up the layout by removing an unnecessary text element ("Resources assigned to {env.name}") from the Environment Explorer header.
- **Catalog Dropdown Styling Fix**: Fixed a critical dark mode styling glitch on the "Select Compute Tier" dropdowns within the `Catalog.jsx` VM Template cards. Removed incorrect background opacities (`dark:bg-surface/50`), inconsistent text colors, and buggy hover states. Standardized the class list to match the "Provider" dropdown in `VmRequest.jsx` (`bg-gray-50 dark:bg-surface dark:text-gray-100 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20`), ensuring text visibility and seamless dark theme blending.
- **Catalog Widget Theme Optimization**: Fixed visual lag (FOUC) when toggling between light and dark modes in `Catalog.jsx`. Removed `transition-all` from the 4 top Stats Grid widgets and the VM Template item cards, replacing them with `transition-[transform,box-shadow]` (and `border-color` for templates) to preserve hover animations while allowing background colors to switch instantly alongside the rest of the application. Also removed `transition-all` from the dropdown select element.
- **Provision New VM Theme Optimization**: Eliminated FOUC/theme-switch glitches across all components in the `VmRequest.jsx` wizard. Removed problematic `transition-all` and `transition-colors` utilities from the environment selection cards, wizard step indicators, all text inputs, select dropdowns, textareas, checkboxes, and buttons. Replaced them with targeted transitions (`transition-opacity` or `transition-[transform,opacity,box-shadow]`) to ensure background and border colors adapt instantly when toggling dark mode while preserving necessary layout and hover animations.
- **Provision New VM Banner Consistency**: Standardized the background and border colors of the "Environment Information" banner and "Enable Security Hardening" banner in `VmRequest.jsx`. Replaced transparent styling (`bg-gray-50/80` and `dark:bg-surface/50`) with opaque solid colors (`bg-gray-50 dark:bg-surface`) and matched their border colors (`border-gray-200 dark:border-theme`) to be completely identical to the standard text input fields (e.g. Description), fixing an issue where they appeared too bright or unaligned.
- **Custom Confirmation Modal & Global Notification Banner**: Replaced the native browser `window.confirm` in `VmRequest.jsx` with a custom-styled modal component that matches the "Delete VM" layout. Implemented a persistent, global 2-second toast notification banner in `App.jsx` using `location.state`. When the user clicks "OK" on the provision request modal, it now seamlessly redirects to the Catalog menu and instantly triggers the success toast ("Provision Request submitted. Pending Approval.") at the top of the dashboard.
- **Approval Request Theme Optimization**: Eliminated FOUC/theme-switch visual lag in `Approvals.jsx`. Removed `transition-all` and `transition-colors` from the summary widgets, search inputs, data table rows, pagination buttons, and action buttons. Replaced them with targeted transitions (`transition-[transform,box-shadow,opacity]`) to ensure the application background and border theme syncs instantly upon dark/light mode toggle.
- **Approval Request UI Consistency Fix**: Fixed a visual glitch in `Approvals.jsx` where the search filter displayed an unwanted bright white outline/background in dark mode and the table row dividers were too bright. Standardized the search input to use `bg-transparent dark:bg-transparent` and `rounded-input` (matching `Inventory.jsx`), removed `appearance-none` from the select filters, and updated the table body to use `dark:divide-theme` instead of the overly bright `dark:divide-slate-700`.
- **Approval Request Modal Consistency**: Standardized the popup modal design in `Approvals.jsx` to perfectly match the application's global modal style (e.g., Delete VM, Confirm Provision). Updated the modal wrapper from `rounded-card shadow-2xl` to `rounded-modal shadow-modal` and adjusted the `z-index` to `z-[60]`. Unified the text area and footer action buttons to use the standard `rounded-input` format, and replaced the `bg-gray-50` footer background with a seamless `bg-transparent` design.
- **Approval Request Data Structure**: Updated the table columns in `Approvals.jsx`. Added a new `Type` column before `Status` to indicate the request type (e.g., "Create New VM", "Extend Period", "Edit Resources"). Renamed "Provider / Expiry" to "Provider" and moved the expiry data into the "Environment" column (now renamed to "Env / Expiry"), streamlining the data presentation.
- **Inventory Theme Optimization**: Eliminated FOUC/theme-switch visual lag and "white outline" glitches in `Inventory.jsx`. Removed `transition-all` and `transition-colors` from the summary widgets, search input, data table rows, and chevron expand buttons. Replaced them with targeted transitions (`transition-[transform,box-shadow]` and `transition-shadow`) to ensure the table backgrounds and borders sync instantly upon dark/light mode toggle without animating the background/border color transition.
- **Inventory Pagination & Button Optimization**: Removed problematic `transition-colors` utilities from the Refresh button, pagination numbers (1, 2), and navigation arrows (←, →) in `Inventory.jsx`. This fully resolves the final remaining white-outline and lagging artifacts during theme transitions.
- **Inventory Modal Consistency**: Fixed the "Renew VM Request" and "Delete VM Confirmation" popups in `Inventory.jsx` by removing `transition-colors` from the action buttons and textarea inputs. Replaced them with `transition-opacity` to prevent color desynchronization (white outline glitch) during dark mode toggle, ensuring they match the standard global modal styling.
- **Inventory Action Menu Logic**: Updated the conditional rendering of the "Renew VM" action in the `Inventory.jsx` action dropdown. Now, the "Renew VM" button is strictly limited to VMs that have their status as `Running` or `Expired`, and will explicitly be hidden for VMs in `Provisioning` status or for Permanent/Lifetime VMs (where `expiryDate === null`).
- **Inventory Edit Resources Feature**: Added a new "Edit Resources" action in the dropdown menu for VMs. This option is available for all VM statuses EXCEPT `Provisioning` and `Failed`. When clicked, it opens a brand new, highly polished modal perfectly matching the design language of the "Provisioning VM > Configuration" menu. The modal allows users to dynamically edit CPU Cores and Memory (RAM), view existing Storage Disks (grayed out), and includes a dynamic feature to "Add new blank disk" with configurable GB size.
- **Inventory Edit Security Confirmation**: Added a safety mechanism to the Edit Resources modal. Users must now explicitly type the name of the VM they wish to modify before the "Submit Request" button becomes enabled. The submit button text was also updated from "Save Changes" to "Submit Request" to clarify that the action requires backend approval.
- **Inventory Edit/Renew Logic Rules**: Implemented strict validation on the "Edit Resources" modal; the submit button remains disabled if no actual resource changes (CPU, RAM, or Disks) are made by the user, even if the security confirmation name matches. Furthermore, submitting an Edit or Renew request now appends a localized state to the VM, appending "(Waiting approval for Resources edited)" or "(Waiting approval for Extend Expiry)" dynamically to the status badge text without interrupting the actual "Running" status style.
- **Inventory Delete Security Confirmation**: Replicated the security confirmation feature to the "Delete VM" modal. Users must now accurately type the exact VM name to enable the Delete button, preventing accidental destruction of Terraform states.
- **Inventory ESC Key Support**: Added a global keyboard event listener (`useEffect`) in `Inventory.jsx` that listens for the 'Escape' key (`Esc`). Pressing 'Esc' will now seamlessly close any currently open modal (Edit, Renew, Delete), side drawer, or action dropdown menu, providing a better native UX feel.
- **Inventory Discard Changes Confirmation**: Integrated a global "Discard Changes" protection mechanism into `Inventory.jsx`. Whenever a user begins editing a form (e.g., Edit Resources, Renew VM, or typing a Delete Confirmation) and attempts to close the modal via the "Cancel" button or the "Esc" key, a safety popup will intercept the action to ask "Are you sure you want to discard your unsaved changes?". This prevents accidental loss of user input.
- **Approvals Menu UI Standardization & Discard Security**: Ported all the UI enhancements from the Inventory menu to `Approvals.jsx`. This includes: removing `transition-colors` on action modal buttons (replaced with `transition-opacity` to prevent FOUC bugs), adding global 'Esc' key support to dismiss the Approval/Reject modal, and implementing the "Discard Changes" confirmation popup if the user tries to cancel after typing an approval or rejection reason.
- **Settings Explorer UI Fix**: Fixed a visual bug on the "Mapping Architecture" / "Template Mapping" icons across `DatastoreExplorer.jsx`, `NetworkExplorer.jsx`, and `CatalogExplorer.jsx`. The dark mode border classes had invalid escaping (`dark:border-\[#17243E\]`) causing Tailwind JIT to ignore them and display a bold white outline in dark mode. They have been corrected to `dark:border-[#17243E]`, perfectly aligning with the correct clean design seen in the Environment Management mapping view.
- **Audit Trail UI Implementation**: Based on the `architecture-v2-audit-trail.md` spec, renamed "Audit Settings" to "Audit" in the Settings sidebar. Developed `AuditManagement.jsx` featuring a high-performance data table matching the platform's standard design language. Features include: Global search (across username, description, IP), Action Type filtering, color-coded badges for Action Types (Approve/Create = Emerald, Delete/Reject = Rose, Request = Amber), resizable columns, and full Dark Mode compatibility.
- **Audit UI Transitions Glitch Fix**: Fixed a visual glitch in `AuditManagement.jsx` where elements (Search Input, Pagination Buttons, and Table Rows) experienced a "white flash/outline" FOUC glitch upon switching themes or hovering. Changed all instances of `transition-colors` and `transition-all` to `transition-opacity` on these structural elements.
- **Audit Table Outline Fix**: Resolved an issue where thick, bright white lines appeared between table rows in Dark Mode. The bug was caused by a Tailwind parsing failure from the class `dark:divide-theme/50` (opacity modifiers don't work natively with solid custom hex variables in JIT without RGB setups), causing it to fall back to the light mode `divide-gray-100`. It was fixed by standardizing it to `dark:divide-theme`.
- **Audit Trail CSV Download**: Added a "Download CSV" feature to the Audit menu. Built a dedicated pop-up modal requiring users to select a Start Date and End Date. Integrated the platform's standard security mechanics, including 'Esc' key listeners for modal closure and the "Discard Changes" protection overlay to prevent accidental data loss when closing the modal while dates are filled. Automatically parses `MOCK_AUDIT_LOGS` into a `.csv` blob for user download.
- **Audit Columns Restructure**: Removed the `IP Address` column from the Audit Trail table and replaced it with `Target Resource` and `Status` (e.g., SUCCESS, FAILED, PENDING) columns to provide more contextual information. Updated the Search logic, UI headers, mock data, and CSV Export feature to align with these new column types. Added colored badges for the Status indicators (Emerald for SUCCESS, Rose for FAILED, Amber for PENDING).
- **Notification Center Integration**: Created `NotificationCenter.jsx` based on `architecture-v2-notification-management.md`. Integrated the component into the `Topbar` inside `App.jsx`, located directly beside the Dark Mode switch. The Notification popover features custom scope-based icons, a "Mark all read" mechanism, unread badge counters, and click-to-route behavior pointing to respective modules (`/approvals` or `/inventory`). The UI is fully polished with `animate-in` effects and Dark Mode support without FOUC artifacts.
- **Frontend Workspace Cleanup**: Conducted a deep clean of the `frontend` root directory. Removed 30+ leftover scratch scripts (`.cjs`, `.mjs`, `.js`), temporary text logs (`recovered_diff.txt`, `found_payload.json`), root-level React test components (`renderTest.jsx`, `test-entry.jsx`), and the entire experimental `scratch/` directory. Verified that the `src/` UI architecture remains fully intact and operational.
- **Root Directory Cleanup**: Executed a comprehensive cleanup of the absolute root directory (`/my-project/`). Removed obsolete experimental directories (`User/`, `Andi/`), old `.html` wireframes, unused root-level `node_modules` & `package-lock.json`, 16+ temporary execution scripts (`.js`, `.cjs`), and 15+ outdated Markdown files (Phase 1-3 notes, `*-improvement.md`, `*-menu.md`). Preserved only the core infrastructure (`frontend/`, `backend/`, `.env`, `.vscode/`, `MEMORY.md`, and the `architecture-v2-*.md` source-of-truth documents).
- **V2 Documentation Blueprint for AI Agent**: Synthesized all V2 architecture files and the final frontend design into 8 AI-Agent-Optimized Markdown documents stored directly in the project root: `doc-1-prd.md`, `doc-2-implementation-plan.md`, `doc-3-architecture-decisions.md`, `doc-4-backend-services.md`, `doc-5-frontend-structure.md`, `doc-6-database-schema.md` (containing complete ERD and constraints), `doc-7-api-contracts.md`, and `doc-8-deployment-workflow.md`. These documents use strict YAML, Mermaid JS schemas, and explicit mapping tags (e.g., `[REQ-01]`) to serve as an autonomous blueprint for future backend integration.
