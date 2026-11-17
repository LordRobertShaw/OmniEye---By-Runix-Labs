# OmniEye — Sovereign Network Resilience, Tunnel Optimization & Self-Tuning Control Plane

**OmniEye** is a full-stack interactive network resilience, tunnel configuration, hardware self-tuning, and outage recovery workbench built with **React 19**, **Vite**, **Express**, **Cloud SQL (PostgreSQL + Drizzle ORM)**, **Firebase Authentication / Firestore**, and **PWA WebAPK** support. It unifies real-time transport diagnostics, WireGuard/SSH/Yggdrasil/Cloudflare configuration synthesis, hardware-aware kernel & MTU optimization (`device_encyclopedia`), multi-region Geo-IP firewall enforcement, and hands-free Web Speech voice control inside a Material You–inspired responsive interface.

---

## 1. Architecture & Persistence Scope

- **Frontend (`src/App.tsx`, `vite.config.ts`)**: Single-page React application with lazy-loaded workspace tabs (`Map` / Command, `Keep` Vault, `Contacts` Alerts, and `Expansion` / Sentinel), fixed Material You Android bottom navigation bar (`Command`, `Self-Tune`, `Android UI`, `Keep Vault`, `Sentinel`), offline IndexedDB/localStorage survival cache, and `vite-plugin-pwa` service worker + native Android WebAPK home-screen shortcuts.
- **Backend Server (`server.ts`)**: Express + Vite middleware server (port `3000`) providing live TCP/TLS/HTTP socket diagnostics, Curve25519 X25519 cryptographic key generation, signed bootstrap verification (`SHA-256`), Prometheus `/api/metrics` scraping, pull-based node command queues, webhook delivery with exponential backoff, and Gemini-powered network diagnostics with Google Search/Maps grounding and tool execution.
- **Database Layer (`src/db/index.ts`, `src/db/schema.ts`, `src/db/repositories.ts`)**: Cloud SQL PostgreSQL backed by Drizzle ORM with `keepAlive` + idle-connection recovery (`idleTimeoutMillis: 20000`) storing:
  - `tunnel_profiles` (endpoints, MTU, keepalive, Geo-IP regional lock, failover hierarchy, maintenance windows, live Rx/Tx bytes)
  - `probe_logs` & `sla_rollups` (RTT, jitter, packet loss, hourly uptime rollups, retention compaction)
  - `tunnel_auth_logs` & `blocked_ips` (wire-level auth audit events and automated firewall IP bans)
  - `node_commands`, `config_revisions`, `audit_ledger` (SHA-256 hash-chained immutable governance log)
  - `device_encyclopedia` (`vquery`-searchable hardware taxonomy mapping USB/PCIe IDs, NIC drivers, CPU architectures, optimal MTUs, keepalives, and kernel sysctl quirks)
- **Authentication & Cloud Vault (`src/firebase.ts`, `src/middleware/auth.ts`)**: Firebase Auth ID-token verification for protected API routes alongside client-side WebCrypto AES-GCM encrypted Wi-Fi/SSH vaults synced to Firestore and Cloud SQL.

---

## 2. Complete Component Inventory & Scope

### Core Navigation, Power & Mobile Experience
- **`Top Header Navbar` (`src/App.tsx`)**: Hosts workspace tab switching, Firebase user session controls, global uptime telemetry, **Command Palette (`Ctrl/Cmd + K`)**, **8-character Alphanumeric Security PIN Lock**, real-time **Battery Status API Indicator** (automatically activates `< 20%` Eco-Power Mode to dim the UI color scheme, pause animations, and throttle background polling 2x), and **PWA Install Button**.
- **`AndroidQuickActionDeck` (`src/components/AndroidQuickActionDeck.tsx`)**: Material You touch-first control deck featuring 4 quick-settings tiles (**Hardware Scan**, **10s Self-Tune Test**, **Region Geo-Lock**, **1.1.1.3 Fast-Path**), an interactive **6-Choice Performance, Efficiency & Value Accelerator (`OPT-A` through `OPT-F`)**, a **Streamlined Android View** toggle, and one-tap **Export Android `.conf`** generator.
- **`PwaControls` (`src/components/PwaControls.tsx`)**: `usePWAInstall`, `PWAInstallButton` (with Chromium `beforeinstallprompt` + Android WebAPK & iOS Safari installation guide modal), and `OfflineIndicator` banner for offline emergency recovery mode.

### Telemetry Visualization & Tunnel Diagnostics
- **`NetworkOverviewDashboard` (`src/components/NetworkDashboardExpansion.tsx`)**: Displays active tunnel health metrics, a **real-time dual-series Incoming/Outgoing Bandwidth Sparkline**, **Recent Tunnel Activity** log stream with time-stamped connection state transitions and errors, and **Download Logs** CSV export.
- **`FleetGeoMap` (`src/components/FleetGeoMap.tsx`)**: Interactive Google Maps Platform (`@vis.gl/react-google-maps`) visualization of fleet tunnel nodes, coordinates, RTT pins, and graceful quota fallback.
- **`FleetSlaTelemetryPanel` (`src/components/FleetSlaTelemetryPanel.tsx`)**: Aggregates real-time SLA uptime percentages, P95 RTT latency, jitter, hourly rollups, visibility-aware & battery-throttled auto-polling controls (`Off`, `30s`, `60s`), and one-click `curl` heartbeat snippets.
- **`FailoverAndDeliveryPanel` (`src/components/FailoverAndDeliveryPanel.tsx`)**: Central operations console for **`vquery -> device_encyclopedia`** hardware discovery & verification (`/api/vquery/verify`, `/api/vquery/device-encyclopedia`), automated failover hysteresis (`primary`/`backup`/`standalone`), maintenance windows, canary config rollouts, pull-based node command queue, live DoH resolver audit, adaptive PMTUD sweep, Prometheus `/api/metrics` preview, and 4-stage Game-Day Chaos Drill.
- **`SelfTuningBenchmarkModule` (`src/components/SelfTuningBenchmarkModule.tsx`)**: Captures baseline `MTU_SIZE` & `KEEPALIVE_INTERVAL`, applies recommended settings from `device_encyclopedia`, and executes a live **10-second throughput & framing benchmark** (`POST /api/hardware/self-tune-benchmark`) with a dual-line SVG comparison chart showing `+XX.X%` performance gain, goodput efficiency, and RTT delta.
- **`YggdrasilMatrixBridgePanel` (`src/components/YggdrasilMatrixBridgePanel.tsx`)**: Full **Yggdrasil IPv6 Mesh (`0200::/7`) + Matrix Federation Bridge (`:8448`)** monitor with spanning-tree hop counts, live TLS peer RTT probes (`/api/yggdrasil/matrix-bridge/probe`), Eco-Power throttle badge awareness, and one-click loading into the Tunnel Blueprint Workbench.

### Configuration Synthesis, Security & Governance
- **`Tunnel Blueprint Workbench` (`src/App.tsx`, `src/types.ts`)**: Multi-OS (`Linux`, `Windows`, `macOS`, `Android`, `iOS`, `RouterOS`) configuration compiler supporting **WireGuard**, **SSH / AutoSSH**, **Watchdog**, **MTU Sweep**, **USB Tether**, **Cloudflare Tunnel**, and **Yggdrasil Matrix** blueprints. Includes:
  - **Restrict Traffic to Region** toggle auto-injecting RIR Geo-IP `iptables`/`nftables`/Windows Firewall rules.
  - **Device-Specific Hardware Self-Tuning** selector powered by WebAssembly + Browser Navigator hardware scanning (`runLocalHardwareWasmScan`), with the **`Recommended for this hardware`** badge.
  - **Pre-Flight Fleet Conflict Linter**, **X25519 Keygen**, **SSH Keypair Generator**, **Encrypted ZIP Backup**, and **QR Code Exporter/Camera Scanner**.
- **`TunnelAuthHistorySection` (`src/components/TunnelAuthHistorySection.tsx`)**: Displays connection authentication events across protocols (`WireGuard`, `SSH`, `Yggdrasil`, etc.), failure counters, and 1-click IP blocking.
- **`SecurityEnforcementAndLifecyclePanel` (`src/components/SecurityEnforcementAndLifecyclePanel.tsx`)**: Manages active IP blocklists, SHA-256 config drift detection, key rotation tracking, ingest token rotation, and revision snapshot rollbacks.

### AI Voice Terminal & Auxiliary Workspaces
- **`SovereignChatDrawer` (`src/components/SovereignChatDrawer.tsx`)**: Streaming Gemini AI terminal with Google Search & Maps grounding plus a **Web Speech API `Voice Command` button** that triggers `lockGeoIpRegion`, `rotateTunnelKeys`, `restartTunnelFailover`, `runHardwareScan`, and `runSelfTuneBenchmark` directly from spoken commands or quick-voice chips.
- **`CommandPaletteModal` (`src/components/CommandPaletteModal.tsx`)**: Keyboard-first (`Cmd/Ctrl + K`) launcher for jumping across nodes, tabs, probes, key generation, and backups.
- **`KeepNotesWorkspace` (`src/components/KeepNotesWorkspace.tsx`)**: Google Workspace–integrated note-taking and credential runbook scratchpad with search and creation tools.
- **`ContactsAlertsWorkspace` (`src/components/ContactsAlertsWorkspace.tsx`)**: Google Contacts directory + Webhook alerting target manager (Discord/Slack/PagerDuty/Custom) with rate-limited cooldowns.
- **`NetworkDashboardExpansion` Aux Modules & `OmniBrandLogoLaboratory` (`src/components/OmniBrandLogoLaboratory.tsx`)**: Includes `HeartbeatWidget`, `MigrationPortal`, `NetworkSecuritySentinel`, `SovereignTelemetrySystemology`, and interactive SVG brand emblem studio.

---

## 3. Running Locally & Verification
```bash
npm install
npm run dev      # Starts Express + Vite middleware server on port 3000
npm run lint     # TypeScript type-checking (tsc --noEmit)
npm run build    # Production bundle + PWA service worker generation
```
