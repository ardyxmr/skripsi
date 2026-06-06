# Proxmox Self-Service Portal - Design System

This document outlines the standard Design System used across the application to ensure UI consistency, especially for Dark Mode support and scalable component design.

## Core Principles
- **3-Layer Hierarchy**: The application utilizes a depth-based hierarchy (`page` -> `card` -> `surface`) to distinguish between the background, content containers, and interactive elements.
- **Variable-Driven**: All colors, borders, typography, radius, and shadows are defined as CSS variables in `src/index.css`. DO NOT hardcode colors (e.g., avoid `bg-slate-800` or `shadow-[0_2px...]`).

## Design Tokens (Tailwind Classes)

### Backgrounds
- **`bg-page`**: The lowest level. Used strictly for the main application background.
  - Light: `#f8fafc`
  - Dark: `#08132B`
- **`bg-card`**: The middle level. Used for content containers (Widgets, Tables, Modals, Dropdowns).
  - Light: `#ffffff`
  - Dark: `#17243E`
- **`bg-surface`**: The highest level. Used for elements sitting on top of cards (Table Headers, Hover States, Inputs).
  - Light: `#f1f5f9`
  - Dark: `#24324D`

### Borders
- **`border-border-theme`**: Used for all standard container outlines.
  - Light: `#e5e7eb`
  - Dark: `rgba(255,255,255,0.08)`

### Typography
- **`text-primary`**: Used for standard text and headings.
  - Light: `#111827`
  - Dark: `#f8fafc`
- **`text-secondary`**: Used for descriptions, labels, and minor text.
  - Light: `#6b7280`
  - Dark: `#94a3b8`

### Border Radius
- **`rounded-card`**: (16px) Used for main content blocks, widgets, and layout panels.
- **`rounded-input`**: (12px) Used for text inputs, selects, and buttons.
- **`rounded-modal`**: (20px) Used exclusively for Popups and Modals to establish prominence.

### Shadows
- **`shadow-card`**: Used to lift `bg-card` elements off the `bg-page`.
- **`shadow-modal`**: Used to heavily emphasize overlapping modals over the main UI.

## Component Standards

### 1. Tables
- Containers must use `bg-card` and `rounded-card`.
- Headers must use `bg-surface`.
- Rows must implement `hover:bg-surface/40` on desktop resolutions.

### 2. Modals
- Container must use `bg-card`, `rounded-modal`, and `shadow-modal`.
- Inputs inside the modal must use `bg-surface` and `rounded-input`.
- Borders around the modal or header/footer separators must use `border-border-theme`.

### 3. Dropdowns
- Menus must use `bg-card` and `shadow-card`.
- Items must implement `hover:bg-surface/40`.

### 4. Empty States
Empty states (No Data, 0 Items) must never be just a blank string. They must follow a standardized format:
- A prominent but muted icon.
- A bold title (e.g., "No Roles Found").
- A descriptive sub-title ("Create your first role to get started.").
- An actionable CTA button (e.g., `[ + Add Role ]`).

### 5. Toasts and Notifications
Must be presented with `bg-card` as the base, overlaid with standard contextual semantic colors:
- **Success**: Emerald/Green
- **Warning**: Amber/Yellow
- **Danger**: Rose/Red
