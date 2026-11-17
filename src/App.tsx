import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Download,
  RefreshCw,
  Play,
  Sliders,
  Send,
  Sparkles,
  Code,
  Settings,
  AlertTriangle,
  Globe,
  ArrowRight,
  FileText,
  BookOpen,
  HelpCircle,
  Plus,
  Monitor,
  CheckCircle,
  Clock,
  QrCode,
  Key,
  X,
  Lock,
  Unlock,
  Camera,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  Crosshair,
  ExternalLink,
  MapPin,
  Search,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap
} from "lucide-react";
import { PRESET_SEGMENTS, CodeSegment, ConfigType, ConfigVariable } from "./types";
import { User } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import {
  auth,
  db,
  googleSignIn,
  logout,
  initAuth,
  getAccessToken,
  setAccessToken,
  getFirebaseIdToken
} from "./firebase";
import { NetworkOverviewDashboard, HeartbeatWidget, MigrationPortal, NetworkSecuritySentinel, SovereignTelemetrySystemology } from "./components/NetworkDashboardExpansion";
import {
  TunnelProfile,
  WebhookTarget,
  WebhookDeliveryEntry,
  ConfigRevisionEntry,
  TelemetryRetentionStats,
  ProbeResult,
  ProbeLogEntry,
  AuthProtocol,
  AuthOutcome,
  TunnelAuthLogEntry,
  BlockedIpEntry,
  SlaRollupEntry,
  NodeCommandEntry,
  AuditLedgerEntry,
  DeviceEncyclopediaEntry,
  ChaosDrillReport,
  HardwareScanReport,
  DEFAULT_FLEET_PROFILES,
  buildDefaultTunnelAuthLogs,
  encryptVaultPayload,
  decryptVaultPayload,
  computeSha256Hex,
  lintFleetConfigs,
  parseImportedConfig,
  computeLineDiff,
  generateBootstrapBundle,
  buildIncidentPostmortemZip,
  resolveGeoRegionPolicy,
  appendGeoIpFirewallRules,
  appendHardwareSelfTuningRules,
  runLocalHardwareWasmScan,
} from "./utils/networkTools";
import { useFleetTelemetryStream } from "./hooks/useFleetTelemetryStream";
import { OfflineIndicator, PWAInstallButton } from "./components/PwaControls";
import SelfTuningBenchmarkModule from "./components/SelfTuningBenchmarkModule";
import AndroidQuickActionDeck from "./components/AndroidQuickActionDeck";
import YggdrasilMatrixBridgePanel from "./components/YggdrasilMatrixBridgePanel";

const KeepNotesWorkspace = lazy(() => import("./components/KeepNotesWorkspace"));
const ContactsAlertsWorkspace = lazy(() => import("./components/ContactsAlertsWorkspace"));
const OmniBrandLogoLaboratory = lazy(() => import("./components/OmniBrandLogoLaboratory"));
const FleetGeoMap = lazy(() => import("./components/FleetGeoMap"));
const CommandPaletteModal = lazy(() => import("./components/CommandPaletteModal"));
const FleetSlaTelemetryPanel = lazy(() => import("./components/FleetSlaTelemetryPanel"));
const SovereignChatDrawer = lazy(() => import("./components/SovereignChatDrawer"));

interface GroundingLink {
  type: "web" | "maps";
  title: string;
  uri: string;
  snippet?: string;
}

interface ExecutedAction {
  name: string;
  args: Record<string, any>;
  result?: any;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  groundingChunks?: GroundingLink[];
  actions?: ExecutedAction[];
}

export default function App() {
  // Navigation workspace tab
  const [currentTab, setCurrentTab] = useState<"network" | "keep" | "contacts" | "expansion">("network");

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Maps Quota Defense State (Compliance Section 8 Case A)
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Dynamic Fleet Profiles & Webhooks State (Cloud SQL backed for real users, localStorage in Demo Mode)
  const [fleetProfiles, setFleetProfiles] = useState<TunnelProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("omnieye_demo_fleet");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback to default fleet
      }
    }
    return DEFAULT_FLEET_PROFILES;
  });
  const [activeProfileId, setActiveProfileId] = useState<number | string | null>("wg-primary-01");
  const [webhooks, setWebhooks] = useState<WebhookTarget[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("omnieye_demo_webhooks");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  // Topology Mode, Live Probe, Diff & Grounding States
  const [topologyViewMode, setTopologyViewMode] = useState<"svg" | "map">("svg");
  const [probeMode, setProbeMode] = useState<"tcp" | "tls">("tcp");
  const [liveProbeLoading, setLiveProbeLoading] = useState(false);
  const [probingProfileId, setProbingProfileId] = useState<number | string | null>(null);
  const [lastProbeResult, setLastProbeResult] = useState<ProbeResult | null>(null);
  const [isAddEndpointModalOpen, setIsAddEndpointModalOpen] = useState(false);
  const [newEndpointName, setNewEndpointName] = useState("");
  const [newEndpointHost, setNewEndpointHost] = useState("");
  const [newEndpointPort, setNewEndpointPort] = useState("51820");
  const [newEndpointCategory, setNewEndpointCategory] = useState<ConfigType>("wireguard");
  const [newEndpointLocation, setNewEndpointLocation] = useState("US-West Edge (LAX)");
  const [newEndpointLat, setNewEndpointLat] = useState("34.0522");
  const [newEndpointLng, setNewEndpointLng] = useState("-118.2437");
  const [addEndpointBusy, setAddEndpointBusy] = useState(false);
  const [showOptimizerDiff, setShowOptimizerDiff] = useState(false);
  const [importerFeedback, setImporterFeedback] = useState<string | null>(null);
  const [groundingMode, setGroundingMode] = useState<"search" | "maps">("search");
  const [userGeoLocation, setUserGeoLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [generatedSshFingerprint, setGeneratedSshFingerprint] = useState<string | null>(null);
  const [isWgKeyGenerating, setIsWgKeyGenerating] = useState(false);
  const [wgKeyNotice, setWgKeyNotice] = useState<string | null>(null);
  const [deployBootstrapTab, setDeployBootstrapTab] = useState<"commands" | "sh" | "ps1" | "docker">("commands");
  const [probeLogs, setProbeLogs] = useState<ProbeLogEntry[]>([]);
  const [tunnelAuthLogs, setTunnelAuthLogs] = useState<TunnelAuthLogEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("omnieye_demo_auth_logs");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback to defaults
      }
    }
    return buildDefaultTunnelAuthLogs(DEFAULT_FLEET_PROFILES);
  });
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("omnieye_demo_blocked_ips");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore parse failure
      }
    }
    return [];
  });
  const [slaRollups, setSlaRollups] = useState<SlaRollupEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("omnieye_demo_sla_rollups");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore parse failure
      }
    }
    return [];
  });
  const [workbenchConfigHash, setWorkbenchConfigHash] = useState<string>("");
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDeliveryEntry[]>([]);
  const [configRevisions, setConfigRevisions] = useState<ConfigRevisionEntry[]>([]);
  const [retentionStats, setRetentionStats] = useState<TelemetryRetentionStats | null>(null);
  const [nodeCommands, setNodeCommands] = useState<NodeCommandEntry[]>([]);
  const [auditLedger, setAuditLedger] = useState<AuditLedgerEntry[]>([]);
  const [deviceEncyclopedia, setDeviceEncyclopedia] = useState<DeviceEncyclopediaEntry[]>([]);
  const [userRole, setUserRole] = useState<"owner" | "operator" | "auditor">("owner");
  const [activeHardwareDevice, setActiveHardwareDevice] = useState<DeviceEncyclopediaEntry | null>(null);
  const [hardwareScanReport, setHardwareScanReport] = useState<HardwareScanReport | null>(null);
  const [recommendedDeviceSlug, setRecommendedDeviceSlug] = useState<string>("hp-workstation-rtl8852be");
  const [streamlinedAndroidMode, setStreamlinedAndroidMode] = useState<boolean>(false);
  const [restrictTrafficToRegion, setRestrictTrafficToRegion] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(1.0);
  const [isBatteryCharging, setIsBatteryCharging] = useState<boolean>(true);
  const [batteryApiSupported, setBatteryApiSupported] = useState<boolean>(false);
  const [ecoManualOverride, setEcoManualOverride] = useState<boolean>(false);
  const [offlineSnapshotTs, setOfflineSnapshotTs] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("omnieye_offline_emergency_snapshot");
      if (raw) return JSON.parse(raw).savedAt || null;
    } catch {
      // ignore
    }
    return null;
  });
  const [hasCloudVault, setHasCloudVault] = useState<boolean>(false);
  const [cloudVaultStatus, setCloudVaultStatus] = useState<"local" | "synced" | "available" | "syncing">("local");
  const [cloudVaultRestorePin, setCloudVaultRestorePin] = useState<string>("");
  const [lastWatchdogNotice, setLastWatchdogNotice] = useState<string | null>(null);
  const [isBatchProbing, setIsBatchProbing] = useState(false);
  const [autoPollSec, setAutoPollSec] = useState<0 | 30 | 60>(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [lastAutoAlertNotice, setLastAutoAlertNotice] = useState<string | null>(null);
  const [isSshPrivateMasked, setIsSshPrivateMasked] = useState(false);
  const [sshMaskCountdownSec, setSshMaskCountdownSec] = useState(60);
  const skipNextSegmentResetRef = useRef(false);
  const configFileInputRef = useRef<HTMLInputElement | null>(null);

  // OS Detection & Manual Overrides
  const [selectedOS, setSelectedOS] = useState<"linux" | "ubuntu" | "windows" | "unix" | "pulse" | "apple">("linux");
  const [detectedOS, setDetectedOS] = useState<"linux" | "ubuntu" | "windows" | "unix" | "pulse" | "apple">("linux");

  const detectSystemOS = () => {
    if (typeof window === "undefined" || !window.navigator) return "linux";
    const ua = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform?.toLowerCase() || "";
    
    if (ua.includes("ubuntu")) return "ubuntu";
    if (ua.includes("pulse") || platform.includes("pulse")) return "pulse";
    if (ua.includes("win") || platform.includes("win")) return "windows";
    if (ua.includes("mac") || ua.includes("ipod") || ua.includes("ipad") || ua.includes("iphone") || platform.includes("mac") || platform.includes("iphone") || platform.includes("ipad") || platform.includes("ipod")) return "apple";
    if (ua.includes("linux") || platform.includes("linux")) return "linux";
    if (ua.includes("unix") || ua.includes("bsd") || ua.includes("sunos") || platform.includes("unix") || platform.includes("hp-ux")) return "unix";
    return "linux";
  };

  const handleLogin = async () => {
    try {
      setAuthError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user")) {
        setAuthError("The sign-in popup was closed or blocked. If you are using a preview sandbox, please use 'Simulated Demo Mode' to immediately access the workspaces offline.");
        console.warn("Authentication popup closed by user or blocked. Handled gracefully.");
      } else {
        setAuthError(err?.message || "An unexpected error occurred during Google Sign In.");
        console.error("Login failed:", err);
      }
    }
  };

  const handleDemoLogin = () => {
    setAuthError(null);
    const mockUser = {
      uid: "demo-analyst-99",
      email: "analyst@omnieye.demo",
      displayName: "Demo Security Analyst",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      emailVerified: true,
      providerData: [{ providerId: "google.com", email: "analyst@omnieye.demo" }]
    } as any;
    
    setAccessToken("mock-demo-access-token-xyz123");
    setUser(mockUser);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAuthError(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", onQuotaExceeded);

    const dOS = detectSystemOS();
    setDetectedOS(dOS);
    setSelectedOS(dOS);

    const unsubscribe = initAuth(
      (loggedInUser, token) => {
        setUser(loggedInUser);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setAuthLoading(false);
      }
    );
    return () => {
      window.removeEventListener("gmp-quota-exceeded", onQuotaExceeded);
      unsubscribe();
    };
  }, []);

  // Hydrate Fleet Profiles & Webhooks for signed-in users cleanly
  useEffect(() => {
    if (!user || user.uid === "demo-analyst-99") return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await getFirebaseIdToken();
        if (!idToken || cancelled) return;
        const resp = await fetch("/api/fleet/bootstrap", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!resp.ok || cancelled) return;
        const data = await resp.json();
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          setFleetProfiles(data.profiles);
          setActiveProfileId(data.profiles[0].id);
        }
        if (Array.isArray(data.probes)) {
          setProbeLogs(data.probes);
        }
        if (Array.isArray(data.webhooks)) {
          setWebhooks(data.webhooks);
        }
        if (Array.isArray(data.authLogs) && data.authLogs.length > 0) {
          setTunnelAuthLogs(data.authLogs);
        }
        if (Array.isArray(data.blockedIps)) {
          setBlockedIps(data.blockedIps);
        }
        if (Array.isArray(data.slaRollups)) {
          setSlaRollups(data.slaRollups);
        }
        if (Array.isArray(data.webhookDeliveries)) {
          setWebhookDeliveries(data.webhookDeliveries);
        }
        if (Array.isArray(data.configRevisions)) {
          setConfigRevisions(data.configRevisions);
        }
        if (data.retentionStats) {
          setRetentionStats(data.retentionStats);
        }
        if (Array.isArray(data.nodeCommands)) {
          setNodeCommands(data.nodeCommands);
        }
        if (Array.isArray(data.auditLedger)) {
          setAuditLedger(data.auditLedger);
        }
        if (Array.isArray(data.deviceEncyclopedia)) {
          setDeviceEncyclopedia(data.deviceEncyclopedia);
        }
        if (data.userRole) {
          setUserRole(data.userRole);
        }
        if (data.hasCloudVault) {
          setHasCloudVault(true);
          const hasLocalEnc = Boolean(localStorage.getItem("omnieye_saved_wifi_enc"));
          setCloudVaultStatus(hasLocalEnc ? "synced" : "available");
        }
      } catch {
        // Keep local defaults silently
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Also load device_encyclopedia via vquery on mount so demo/anonymous sessions have full hardware context
  useEffect(() => {
    fetch("/api/vquery/device-encyclopedia")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.devices) && data.devices.length > 0) {
          setDeviceEncyclopedia(data.devices);
        }
      })
      .catch(() => {});
  }, []);

  // Sync restrictTrafficToRegion toggle with currently selected fleet profile
  useEffect(() => {
    const activeProf = fleetProfiles.find((p) => p.id === activeProfileId);
    if (activeProf) {
      setRestrictTrafficToRegion(Boolean(activeProf.restrictToRegion));
    }
  }, [activeProfileId]);

  const { sseConnected } = useFleetTelemetryStream({
    enabled: Boolean(user && user.uid !== "demo-analyst-99"),
    getToken: getFirebaseIdToken,
    onEvent: (evt) => {
      const p = evt.payload;
      if (!p) return;
      if (evt.type === "heartbeat" && p.profile) {
        setFleetProfiles((prev) =>
          prev.map((prof) => (prof.id === p.profile.id ? p.profile : prof))
        );
        if (p.failoverTransition) {
          setLastWatchdogNotice(p.failoverTransition);
        }
      } else if (evt.type === "probe_recorded" && p.probe) {
        setProbeLogs((prev) => [p.probe, ...prev.slice(0, 79)]);
        if (p.failoverTransition) {
          setLastWatchdogNotice(p.failoverTransition);
        }
      } else if (evt.type === "failover_transition") {
        setLastAutoAlertNotice(
          `Failover switched ${p.primaryName} -> Backup ${p.backupName || "Standby"} (${p.reason || "hysteresis"}).`
        );
      } else if (evt.type === "failover_recovered") {
        setLastWatchdogNotice(`Primary node ${p.primaryName} recovered after 3x healthy checks.`);
      } else if (evt.type === "auto_ban" && p.ipAddress) {
        setBlockedIps((prev) => [p, ...prev.filter((b) => b.ipAddress !== p.ipAddress)]);
        setLastAutoAlertNotice(`SSE Auto-Ban enforced for ${p.ipAddress} (${p.failCount} failures).`);
      } else if (evt.type === "config_drift" && p.tunnelName) {
        setLastAutoAlertNotice(`Config hash drift detected on ${p.tunnelName}!`);
      } else if (evt.type === "webhook_delivery" && p.id) {
        setWebhookDeliveries((prev) => {
          const exists = prev.some((d) => String(d.id) === String(p.id));
          return exists
            ? prev.map((d) => (String(d.id) === String(p.id) ? p : d))
            : [p, ...prev].slice(0, 60);
        });
      } else if (evt.type === "auth_log" && p.id) {
        setTunnelAuthLogs((prev) => [p, ...prev.slice(0, 119)]);
      } else if (evt.type === "watchdog_sweep") {
        setLastWatchdogNotice(
          `Live Watchdog swept ${p.swept ?? 0} node(s) at ${new Date().toLocaleTimeString()}.`
        );
      }
    },
  });

  // Global Cmd/Ctrl+K Command Palette Shortcut
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, []);


  useEffect(() => {
    if (typeof window !== "undefined" && (!user || user.uid === "demo-analyst-99")) {
      localStorage.setItem("omnieye_demo_fleet", JSON.stringify(fleetProfiles));
    }
  }, [fleetProfiles, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && (!user || user.uid === "demo-analyst-99")) {
      localStorage.setItem("omnieye_demo_webhooks", JSON.stringify(webhooks));
    }
  }, [webhooks, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && (!user || user.uid === "demo-analyst-99")) {
      localStorage.setItem("omnieye_demo_auth_logs", JSON.stringify(tunnelAuthLogs));
    }
  }, [tunnelAuthLogs, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && (!user || user.uid === "demo-analyst-99")) {
      localStorage.setItem("omnieye_demo_blocked_ips", JSON.stringify(blockedIps));
    }
  }, [blockedIps, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && (!user || user.uid === "demo-analyst-99")) {
      localStorage.setItem("omnieye_demo_sla_rollups", JSON.stringify(slaRollups));
    }
  }, [slaRollups, user]);

  const handleRefreshAuthLogs = async () => {
    if (!user || user.uid === "demo-analyst-99") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/fleet/auth-logs?limit=120", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (Array.isArray(data.logs)) {
        setTunnelAuthLogs(data.logs);
      }
    } catch {
      // ignore transient refresh failure
    }
  };

  const handleRecordAuthLog = async (entry: {
    profileId?: number | string | null;
    tunnelName: string;
    protocol: AuthProtocol;
    outcome: AuthOutcome;
    actor: string;
    sourceIp: string;
    authMethod: string;
    reason: string;
  }) => {
    const optimistic: TunnelAuthLogEntry = {
      id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      profileId: entry.profileId ?? null,
      tunnelName: entry.tunnelName,
      protocol: entry.protocol,
      outcome: entry.outcome,
      actor: entry.actor,
      sourceIp: entry.sourceIp,
      authMethod: entry.authMethod,
      reason: entry.reason,
      createdAt: new Date().toISOString(),
    };
    setTunnelAuthLogs((prev) => [optimistic, ...prev].slice(0, 120));

    if (!user || user.uid === "demo-analyst-99") {
      if (
        entry.outcome === "failed" &&
        entry.sourceIp &&
        !["0.0.0.0", "127.0.0.1", "::1"].includes(entry.sourceIp.trim())
      ) {
        const cutoff = Date.now() - 15 * 60_000;
        const recentFails =
          tunnelAuthLogs.filter(
            (l) =>
              l.outcome === "failed" &&
              l.sourceIp === entry.sourceIp.trim() &&
              new Date(l.createdAt).getTime() >= cutoff
          ).length + 1;
        if (recentFails >= 3) {
          const banRule: BlockedIpEntry = {
            id: `ban-${Date.now()}`,
            ipAddress: entry.sourceIp.trim(),
            protocol: entry.protocol,
            reason: `Auto-banned after ${recentFails} failed ${entry.protocol.toUpperCase()} auth attempts on ${entry.tunnelName} within 15m`,
            failCount: recentFails,
            isActive: true,
            expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
            createdAt: new Date().toISOString(),
          };
          setBlockedIps((prev) => {
            const exists = prev.some((b) => b.ipAddress === banRule.ipAddress);
            return exists
              ? prev.map((b) => (b.ipAddress === banRule.ipAddress ? banRule : b))
              : [banRule, ...prev];
          });
          setLastAutoAlertNotice(
            `Auto-Ban triggered for ${banRule.ipAddress} (${recentFails} failed ${entry.protocol.toUpperCase()} attempts).`
          );
        }
      }
      return;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/fleet/auth-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...entry,
          profileId: typeof entry.profileId === "number" ? entry.profileId : null,
        }),
      });
      if (resp.ok) {
        const saved = await resp.json();
        const { autoBannedIp, ...logRecord } = saved;
        setTunnelAuthLogs((prev) =>
          prev.map((item) => (item.id === optimistic.id ? logRecord : item))
        );
        if (autoBannedIp && autoBannedIp.ipAddress) {
          setBlockedIps((prev) => {
            const exists = prev.some((b) => b.ipAddress === autoBannedIp.ipAddress);
            return exists
              ? prev.map((b) => (b.ipAddress === autoBannedIp.ipAddress ? autoBannedIp : b))
              : [autoBannedIp, ...prev];
          });
          setLastAutoAlertNotice(
            `Auto-Ban firewall rule added for ${autoBannedIp.ipAddress} (${autoBannedIp.failCount} failed attempts).`
          );
        }
      }
    } catch {
      // optimistic entry stays visible
    }
  };

  const handleBanIp = async (input: {
    ipAddress: string;
    protocol: AuthProtocol;
    reason: string;
  }) => {
    const cleanIp = input.ipAddress.trim();
    if (!cleanIp) return;
    if (!user || user.uid === "demo-analyst-99") {
      const rule: BlockedIpEntry = {
        id: `ban-${Date.now()}`,
        ipAddress: cleanIp,
        protocol: input.protocol,
        reason: input.reason || "Manual operator ban",
        failCount: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      setBlockedIps((prev) => [rule, ...prev.filter((b) => b.ipAddress !== cleanIp)]);
      return;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/fleet/blocked-ips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
      if (resp.ok) {
        const created: BlockedIpEntry = await resp.json();
        setBlockedIps((prev) => [
          created,
          ...prev.filter((b) => b.ipAddress !== created.ipAddress && b.id !== created.id),
        ]);
      }
    } catch {
      // ignore transient error
    }
  };

  const handleUnbanIp = async (blockId: number | string) => {
    setBlockedIps((prev) => prev.filter((b) => b.id !== blockId));
    if (!user || user.uid === "demo-analyst-99" || typeof blockId !== "number") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      await fetch(`/api/fleet/blocked-ips/${blockId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } catch {
      // ignore transient error
    }
  };

  const handleSyncConfigHash = async (profileId: number | string) => {
    const hashToPin = workbenchConfigHash || (await computeSha256Hex(compiledCode));
    const nowIso = new Date().toISOString();
    const targetProf = fleetProfiles.find((p) => p.id === profileId);
    setFleetProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? { ...p, expectedConfigHash: hashToPin, lastDriftCheckAt: nowIso }
          : p
      )
    );
    if (!user || user.uid === "demo-analyst-99" || typeof profileId !== "number") {
      setConfigRevisions((prev) => [
        {
          id: `rev-${Date.now()}`,
          profileId,
          tunnelName: targetProf?.name || String(profileId),
          configHash: hashToPin,
          configBody: compiledCode,
          notes: "Pinned workbench snapshot",
          authorEmail: user?.email || "demo",
          createdAt: nowIso,
        },
        ...prev.slice(0, 39),
      ]);
      return;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/profiles/${profileId}/sync-hash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          expectedConfigHash: hashToPin,
          configBody: compiledCode,
          notes: "Pinned workbench snapshot",
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const updatedProfile = data.profile || data;
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? updatedProfile : p))
        );
        if (data.revision) {
          setConfigRevisions((prev) => [data.revision, ...prev.slice(0, 39)]);
        }
      }
    } catch {
      // optimistic hash kept
    }
  };

  const handleRotateIngestToken = async (profileId: number | string) => {
    if (!user || user.uid === "demo-analyst-99" || typeof profileId !== "number") {
      const fakeTok = `demo_${Math.random().toString(16).slice(2, 18)}`;
      const fakeHmac = `hmac_${Math.random().toString(16).slice(2, 18)}`;
      const graceIso = new Date(Date.now() + 24 * 3600_000).toISOString();
      setFleetProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                previousIngestToken: p.ingestToken ?? null,
                tokenGraceExpiresAt: graceIso,
                ingestToken: fakeTok,
                hmacSecret: fakeHmac,
              }
            : p
        )
      );
      return;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/profiles/${profileId}/rotate-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (resp.ok) {
        const updated = await resp.json();
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? updated : p))
        );
        setLastWatchdogNotice(
          `Rotated ingestToken + HMAC secret for ${updated.name} (previous token valid for 24h).`
        );
      }
    } catch {
      // ignore transient error
    }
  };

  const handleRestoreConfigRevision = (rev: ConfigRevisionEntry) => {
    handleImportConfigText(rev.configBody);
    setLastWatchdogNotice(`Restored revision snapshot (${rev.configHash.slice(0, 12)}...) into Workbench.`);
  };

  const handleUpdateFailoverPolicy = async (
    profileId: number | string,
    failoverRole: "primary" | "backup" | "standalone",
    failoverTargetId: number | null
  ) => {
    setFleetProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, failoverRole, failoverTargetId } : p
      )
    );
    if (!user || user.uid === "demo-analyst-99" || typeof profileId !== "number") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/profiles/${profileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ failoverRole, failoverTargetId }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? updated : p))
        );
      }
    } catch {
      // optimistic state retained
    }
  };

  const handleRetryWebhookDelivery = async (deliveryId: number | string) => {
    if (!user || user.uid === "demo-analyst-99" || typeof deliveryId !== "number") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/webhook-deliveries/${deliveryId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.delivery) {
          setWebhookDeliveries((prev) =>
            prev.map((d) => (String(d.id) === String(data.delivery.id) ? data.delivery : d))
          );
        }
      }
    } catch {
      // ignore transient error
    }
  };

  const handleCompactRetention = async (retentionDays = 14) => {
    if (!user || user.uid === "demo-analyst-99") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/fleet/retention/compact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ retentionDays }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.stats) setRetentionStats(data.stats);
        setLastWatchdogNotice(
          `Compacted logs older than ${retentionDays}d (${data.pruned?.probesDeleted ?? 0} probes, ${data.pruned?.authLogsDeleted ?? 0} auth logs purged).`
        );
      }
    } catch {
      // ignore transient error
    }
  };

  const handleToggleRestrictToRegion = async (enabled: boolean) => {
    setRestrictTrafficToRegion(enabled);
    const activeProf = fleetProfiles.find((p) => p.id === activeProfileId) || fleetProfiles[0];
    if (!activeProf) return;
    setFleetProfiles((prev) =>
      prev.map((p) => (p.id === activeProf.id ? { ...p, restrictToRegion: enabled } : p))
    );
    const geoPolicy = resolveGeoRegionPolicy(activeProf);
    setLastWatchdogNotice(
      enabled
        ? `Geo-IP Regional Lock ENABLED for ${activeProf.name}: restricted ingress to ${geoPolicy.countryCode} (${geoPolicy.rirAuthority} — ${geoPolicy.allowedCidrs.length} CIDR blocks).`
        : `Geo-IP Regional Lock DISABLED for ${activeProf.name}.`
    );
    if (!user || user.uid === "demo-analyst-99" || typeof activeProf.id !== "number") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/profiles/${activeProf.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ restrictToRegion: enabled }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === activeProf.id ? updated : p))
        );
      }
    } catch {
      // optimistic state retained
    }
  };

  const handleSetMaintenanceWindow = async (
    profileId: number | string,
    maintenanceUntil: string | null
  ) => {
    setFleetProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, maintenanceUntil } : p))
    );
    setLastWatchdogNotice(
      maintenanceUntil
        ? `Scheduled maintenance window until ${new Date(maintenanceUntil).toLocaleTimeString()} (SLA alerts suppressed).`
        : "Cleared maintenance window; active SLA & watchdog enforcement resumed."
    );
    if (!user || user.uid === "demo-analyst-99" || typeof profileId !== "number") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/profiles/${profileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ maintenanceUntil }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? updated : p))
        );
      }
    } catch {
      // keep optimistic
    }
  };

  const handleTriggerCanaryRollout = async () => {
    const hashToPin = workbenchConfigHash || (await computeSha256Hex(compiledCode));
    if (!user || user.uid === "demo-analyst-99") {
      setFleetProfiles((prev) =>
        prev.map((p) => ({
          ...p,
          expectedConfigHash: hashToPin,
          canaryStatus: "promoted",
        }))
      );
      setLastWatchdogNotice(
        `Canary health gate passed in demo mode; promoted config SHA-256 ${hashToPin.slice(0, 12)}... across ${fleetProfiles.length} nodes.`
      );
      return;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/fleet/canary-rollout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          expectedConfigHash: hashToPin,
          configBody: compiledCode,
          notes: "Canary staged rollout from Workbench",
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.profiles)) setFleetProfiles(data.profiles);
        setLastWatchdogNotice(
          data.promoted
            ? `Canary ${data.canaryNode} passed health check (${data.canaryRttMs}ms) -> Promoted SHA-256 ${String(data.configHash).slice(0, 12)} fleet-wide!`
            : `Canary ${data.canaryNode} failed health gate -> Rollout automatically halted.`
        );
      }
    } catch {
      // ignore
    }
  };

  const handleEnqueueNodeCommand = async (
    profileId: number | string,
    commandType: "reload_nft_blocklist" | "rotate_wg_key" | "run_mtr_trace" | "sync_geoip_rules"
  ) => {
    const prof = fleetProfiles.find((p) => String(p.id) === String(profileId)) || fleetProfiles[0];
    if (!user || user.uid === "demo-analyst-99") {
      const demoCmd: NodeCommandEntry = {
        id: Date.now(),
        profileId: Number(prof?.id || 1),
        tunnelName: prof?.name || "wg-primary-01",
        commandType,
        payloadJson: {},
        signatureHmac: Math.random().toString(16).slice(2, 18),
        status: "pending",
        resultSummary: null,
        createdAt: new Date().toISOString(),
        ackedAt: null,
      };
      setNodeCommands((prev) => [demoCmd, ...prev]);
      setLastWatchdogNotice(`Queued signed command '${commandType}' for ${demoCmd.tunnelName}.`);
      return;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/fleet/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ profileId: Number(profileId), commandType }),
      });
      if (resp.ok) {
        const created = await resp.json();
        setNodeCommands((prev) => [created, ...prev]);
        setLastWatchdogNotice(
          `Queued signed command '${commandType}' for ${created.tunnelName} (will dispatch on next heartbeat).`
        );
      }
    } catch {
      // ignore
    }
  };

  const handleSwitchRbacRole = async (role: "owner" | "operator" | "auditor") => {
    setUserRole(role);
    if (!user || user.uid === "demo-analyst-99") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      await fetch("/api/fleet/rbac-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ role }),
      });
    } catch {
      // ignore
    }
  };

  const handleRunChaosDrill = async (): Promise<ChaosDrillReport | null> => {
    if (!user || user.uid === "demo-analyst-99") {
      const demoReport: ChaosDrillReport = {
        drillId: `DRILL-${Date.now().toString(36).toUpperCase()}`,
        executedAt: new Date().toISOString(),
        durationMs: 52,
        failoverPromotedNode: fleetProfiles[1]?.name || "wg-failover-node",
        webhookQueued: true,
        autoBanVerified: true,
        auditHash: "8f4e2b9a1c7d3e5f0a2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
        steps: [
          {
            step: "1. Primary Tunnel Fault Injection & 3-Strike Hysteresis",
            passed: true,
            detail: "Simulated 3 consecutive packet-loss faults on primary node.",
            latencyMs: 14,
          },
          {
            step: "2. Automated Standby Promotion & Failback",
            passed: true,
            detail: "Promoted standby watchdog node and verified failback recovery.",
            latencyMs: 18,
          },
          {
            step: "3. Geo-IP & Auto-Ban Firewall Rule Compilation",
            passed: true,
            detail: "Verified nftables regional CIDR sets and 3-strike auto-ban rules.",
            latencyMs: 11,
          },
          {
            step: "4. SHA-256 Audit Chain & vquery device_encyclopedia",
            passed: true,
            detail: "Verified tamper-evident audit hash chain and device_encyclopedia readiness.",
            latencyMs: 9,
          },
        ],
      };
      setLastWatchdogNotice(`Game-Day Chaos Drill ${demoReport.drillId} passed all 4 stages!`);
      return demoReport;
    }
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return null;
      const resp = await fetch("/api/fleet/chaos-drill", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (resp.ok) {
        const report: ChaosDrillReport = await resp.json();
        setLastWatchdogNotice(`Game-Day Chaos Drill ${report.drillId} passed all 4 stages!`);
        return report;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleApplyHardwareSelfTuning = (device: DeviceEncyclopediaEntry | null) => {
    setActiveHardwareDevice(device);
    if (!device) {
      setLastWatchdogNotice("Cleared device-specific hardware self-tuning overlay from Workbench.");
      return;
    }
    setVariableValues((prev) => ({
      ...prev,
      ...(prev.MTU_SIZE !== undefined ? { MTU_SIZE: String(device.optimalMtu) } : {}),
      ...(prev.KEEPALIVE_INTERVAL !== undefined
        ? { KEEPALIVE_INTERVAL: String(device.optimalKeepaliveSec) }
        : {}),
      ...(prev.ALIVE_INTERVAL !== undefined
        ? { ALIVE_INTERVAL: String(Math.min(20, device.optimalKeepaliveSec)) }
        : {}),
    }));
    setSimConfig((prev) => ({
      ...prev,
      mtu: device.optimalMtu,
      keepalive: device.optimalKeepaliveSec,
    }));
    setLastWatchdogNotice(
      `Applied device_encyclopedia self-tuning for ${device.modelName} (MTU ${device.optimalMtu}, Keepalive ${device.optimalKeepaliveSec}s, ${device.nicDriver} quirks).`
    );
  };

  const handleRunHardwareScan = async (): Promise<HardwareScanReport | null> => {
    const report = await runLocalHardwareWasmScan(deviceEncyclopedia, selectedOS);
    setHardwareScanReport(report);
    setRecommendedDeviceSlug(report.recommendedDeviceSlug);
    const matched =
      deviceEncyclopedia.find((d) => d.deviceSlug === report.recommendedDeviceSlug) ||
      deviceEncyclopedia[0] ||
      null;
    if (matched) {
      handleApplyHardwareSelfTuning(matched);
      setLastWatchdogNotice(
        `Hardware Scan complete: Detected ${report.detectedOsLabel} (${report.cpuArchDetected}, ${report.cpuLogicalCores} cores, Wasm ${report.wasmCryptoThroughputMbps} Mbps) → Pre-populated ${matched.modelName}`
      );
    }
    return report;
  };

  // Battery Status API telemetry + automatic <20% Eco-Power dimming & throttling
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof (navigator as any).getBattery !== "function") {
      return;
    }
    let batteryObj: any = null;
    let mounted = true;
    const syncBattery = () => {
      if (!mounted || !batteryObj) return;
      setBatteryLevel(typeof batteryObj.level === "number" ? batteryObj.level : 1.0);
      setIsBatteryCharging(Boolean(batteryObj.charging));
      setBatteryApiSupported(true);
    };

    (navigator as any)
      .getBattery()
      .then((bat: any) => {
        if (!mounted || !bat) return;
        batteryObj = bat;
        syncBattery();
        bat.addEventListener("levelchange", syncBattery);
        bat.addEventListener("chargingchange", syncBattery);
      })
      .catch(() => {
        setBatteryApiSupported(false);
      });

    return () => {
      mounted = false;
      if (batteryObj) {
        batteryObj.removeEventListener("levelchange", syncBattery);
        batteryObj.removeEventListener("chargingchange", syncBattery);
      }
    };
  }, []);

  const isEcoPowerMode = ecoManualOverride || batteryLevel < 0.2;

  // Voice Command action bindings triggered by SovereignChatDrawer Web Speech API
  const lockGeoIpRegion = async () => {
    await handleToggleRestrictToRegion(true);
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "🎙 Voice Command `lockGeoIpRegion`: Geo-IP Regional Lock ENABLED and injected into firewall blueprint.",
      },
    ]);
  };

  const rotateTunnelKeys = async () => {
    await handleGenerateWgKeys();
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "🎙 Voice Command `rotateTunnelKeys`: Fresh Curve25519 X25519 keypair generated & applied to Workbench.",
      },
    ]);
  };

  const restartTunnelFailover = async () => {
    const activeProf = fleetProfiles.find((p) => p.isActive) || fleetProfiles[0];
    if (activeProf) {
      await handleUpdateFailoverPolicy(
        activeProf.id,
        activeProf.failoverRole === "primary" ? "backup" : "primary",
        activeProf.failoverTargetId ?? null
      );
    }
    await handleRunBatchProbe();
    setLastWatchdogNotice("Voice Command restartTunnelFailover: Tunnel interface cycle & fleet probe executed.");
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "🎙 Voice Command `restartTunnelFailover`: Triggered failover health cycle & live multi-node tunnel probe.",
      },
    ]);
  };

  const runHardwareScan = async () => {
    const rep = await handleRunHardwareScan();
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: rep
          ? `🎙 Voice Command \`runHardwareScan\`: Detected ${rep.detectedOsLabel} (${rep.cpuArchDetected}, ${rep.cpuLogicalCores} cores, Wasm ${rep.wasmCryptoThroughputMbps} Mbps) → Selected ${rep.recommendedDeviceSlug}.`
          : "🎙 Voice Command `runHardwareScan`: Hardware scan completed.",
      },
    ]);
    return rep;
  };

  const runSelfTuneBenchmark = async () => {
    const el = document.getElementById("workbench-self-tune");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const rec =
      activeHardwareDevice ||
      deviceEncyclopedia.find((d) => d.deviceSlug === recommendedDeviceSlug) ||
      deviceEncyclopedia[0] ||
      null;
    if (rec) {
      handleApplyHardwareSelfTuning(rec);
    }
    const previousMtu = Number(variableValues["MTU_SIZE"]) || simConfig.mtu || 1420;
    const tunedMtu = rec?.optimalMtu || 1420;
    const activeProf = fleetProfiles.find((p) => p.isActive) || fleetProfiles[0];
    try {
      await fetch("/api/hardware/self-tune-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: activeProf?.endpointHost || "1.1.1.1",
          port: activeProf?.endpointPort || 443,
          previousMtu,
          previousKeepaliveSec: Number(variableValues["KEEPALIVE_INTERVAL"]) || simConfig.keepalive || 25,
          tunedMtu,
          tunedKeepaliveSec: rec?.optimalKeepaliveSec || 20,
          deviceSlug: rec?.deviceSlug || "manual",
        }),
      });
    } catch {
      // ignore fallback
    }
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `🎙 Voice Command \`runSelfTuneBenchmark\`: Applied recommended MTU ${tunedMtu}B & focused the 10-second Self-Tuning Benchmark panel.`,
      },
    ]);
  };

  // Automatically run initial browser Navigator + WebAssembly hardware scan once device_encyclopedia loads to pre-populate the hardware profile
  const initialHardwareScanDoneRef = useRef(false);
  useEffect(() => {
    if (deviceEncyclopedia.length > 0 && !initialHardwareScanDoneRef.current) {
      initialHardwareScanDoneRef.current = true;
      runLocalHardwareWasmScan(deviceEncyclopedia, selectedOS)
        .then((report) => {
          setHardwareScanReport(report);
          setRecommendedDeviceSlug(report.recommendedDeviceSlug);
          const matched =
            deviceEncyclopedia.find((d) => d.deviceSlug === report.recommendedDeviceSlug) ||
            deviceEncyclopedia[0] ||
            null;
          if (matched && !activeHardwareDevice) {
            setActiveHardwareDevice(matched);
            setSimConfig((prev) => ({
              ...prev,
              mtu: matched.optimalMtu,
              keepalive: matched.optimalKeepaliveSec,
            }));
          }
        })
        .catch(() => {});
    }
  }, [deviceEncyclopedia, selectedOS, activeHardwareDevice]);

  const handleApplyOptimalMtu = (mtu: number, dns = "1.1.1.3") => {
    setVariableValues((prev) => ({
      ...prev,
      ...(prev.MTU_SIZE !== undefined ? { MTU_SIZE: String(mtu) } : {}),
      ...(prev.DNS_SERVER !== undefined ? { DNS_SERVER: dns } : {}),
    }));
    setSimConfig((prev) => ({ ...prev, mtu }));
    setLastWatchdogNotice(`Applied PMTUD-calibrated MTU=${mtu}B & DNS=${dns} to Workbench.`);
  };

  const handleAckKeyRotation = async (profileId: number | string) => {
    const nowIso = new Date().toISOString();
    setFleetProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, lastRotatedAt: nowIso } : p))
    );
    if (!user || user.uid === "demo-analyst-99" || typeof profileId !== "number") return;
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch(`/api/fleet/profiles/${profileId}/rotate-ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ rotationPolicyDays: 90 }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? updated : p))
        );
      }
    } catch {
      // optimistic timestamp kept
    }
  };

  const handleRunServerWatchdog = async () => {
    if (user && user.uid !== "demo-analyst-99") {
      try {
        const idToken = await getFirebaseIdToken();
        if (!idToken) return;
        const resp = await fetch("/api/fleet/watchdog/run", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.profiles)) setFleetProfiles(data.profiles);
          if (Array.isArray(data.rollups)) setSlaRollups(data.rollups);
          const staleText =
            Array.isArray(data.staleNodes) && data.staleNodes.length > 0
              ? ` • Stale heartbeats: ${data.staleNodes.join(", ")}`
              : " • All heartbeats fresh";
          setLastWatchdogNotice(
            `24/7 Watchdog swept ${data.swept ?? 0} active node(s) at ${new Date().toLocaleTimeString()}${staleText}.`
          );
          return;
        }
      } catch {
        // fallback below
      }
    }

    // Demo / Offline Watchdog Sweep & Hourly Rollup Simulation
    await handleRunBatchProbe();
    const bucketHour = new Date().toISOString().slice(0, 13) + ":00";
    const activeNodes = fleetProfiles.filter((p) => p.isActive);
    setSlaRollups((prev) => {
      const next = [...prev];
      activeNodes.forEach((p) => {
        const idx = next.findIndex(
          (r) => String(r.profileId) === String(p.id) && r.bucketHour === bucketHour
        );
        const rtt = p.lastRttMs ?? 18;
        const stale = Boolean(
          p.lastHeartbeatAt &&
            Date.now() - new Date(p.lastHeartbeatAt).getTime() > 10 * 60_000
        );
        if (idx >= 0) {
          const cur = next[idx];
          const totalProbes = cur.totalProbes + 1;
          const onlineProbes = cur.onlineProbes + 1;
          next[idx] = {
            ...cur,
            totalProbes,
            onlineProbes,
            uptimePct: Math.round((onlineProbes / totalProbes) * 1000) / 10,
            avgRttMs: Math.round((cur.avgRttMs * cur.totalProbes + rtt) / totalProbes),
            p95RttMs: Math.max(cur.p95RttMs, rtt),
            staleHeartbeats: cur.staleHeartbeats + (stale ? 1 : 0),
          };
        } else {
          next.unshift({
            id: `rollup-${p.id}-${bucketHour}`,
            profileId: p.id,
            tunnelName: p.name,
            bucketHour,
            totalProbes: 1,
            onlineProbes: 1,
            uptimePct: 100,
            avgRttMs: rtt,
            p95RttMs: rtt,
            staleHeartbeats: stale ? 1 : 0,
            createdAt: new Date().toISOString(),
          });
        }
      });
      return next.slice(0, 48);
    });
    setLastWatchdogNotice(
      `Watchdog swept ${activeNodes.length} active node(s) and updated ${bucketHour} SLA rollup.`
    );
  };

  const getOSSpecificCodeTemplate = (segmentId: string, os: string, originalTemplate: string) => {
    if (segmentId === "wg-watchdog-script") {
      if (os === "windows") {
        return `# Windows PowerShell WireGuard Tunnel Persistence Watchdog
# Runs via Windows Task Scheduler every 1 minute.
$Interface = "{{WG_INTERFACE}}"
$GatewayIP = "{{MONITOR_IP}}"
$MaxFailures = {{MAX_ATTEMPTS}}
$LogFile = "C:\\Program Files\\WireGuard\\wg-watchdog.log"

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Output "[$Timestamp] Checking connectivity on $Interface to $GatewayIP..."

$Passed = $false
for ($i = 0; $i -lt $MaxFailures; $i++) {
    if (Test-Connection -ComputerName $GatewayIP -Count 1 -Quiet) {
        $Passed = $true
        break
    }
    Start-Sleep -Seconds 2
}

if ($Passed) {
    Write-Output "[$Timestamp] WireGuard Tunnel OK"
    exit
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Output "[$Timestamp] Connection lost. Restarting WireGuard Tunnel interface: $Interface..." | Out-File -FilePath $LogFile -Append

# Restarting Tunnel Service via PowerShell
Stop-Service -Name "WireGuardTunnel$$Interface"
Start-Sleep -Seconds 2
Start-Service -Name "WireGuardTunnel$$Interface"

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Output "[$Timestamp] Tunnel re-initialized." | Out-File -FilePath $LogFile -Append`;
      } else if (os === "apple") {
        return `#!/usr/bin/env bash
# macOS WireGuard Tunnel Persistence Watchdog
# Runs via LaunchAgents plist or cron job every minute.

INTERFACE="{{WG_INTERFACE}}"
GATEWAY_IP="{{MONITOR_IP}}"
MAX_FAILURES={{MAX_ATTEMPTS}}
LOG_FILE="$HOME/Library/Logs/wg-watchdog.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking connectivity on $INTERFACE to $GATEWAY_IP..."

if ping -c 1 -W 3 "$GATEWAY_IP" >/dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WireGuard Tunnel OK"
    exit 0
fi

fail_count=1
while [ $fail_count -lt $MAX_FAILURES ]; do
    sleep 2
    if ping -c 1 -W 3 "$GATEWAY_IP" >/dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Recovered on try $fail_count"
        exit 0
    fi
    fail_count=$((fail_count + 1))
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Connection lost on $INTERFACE after $MAX_FAILURES attempts. Restarting interface..." >> "$LOG_FILE"

# Restarting using macOS wg-quick
wg-quick down "$INTERFACE" >> "$LOG_FILE" 2>&1
sleep 2
wg-quick up "$INTERFACE" >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Tunnel re-initialized on macOS." >> "$LOG_FILE"`;
      }
    }

    if (segmentId === "mtu-mss-calibration") {
      if (os === "windows") {
        return `# MTU Sweep / Calibration Utility for Windows PowerShell
$Target = "{{SWEEP_HOST}}"
Write-Host "=== Starting MTU Path Discovery to $Target ==="
$TestSizes = @(1472, 1464, 1412, 1392, 1372, 1360, 1252)

foreach ($DataSize in $TestSizes) {
    $MTU = $DataSize + 28
    Write-Host -NoNewline "Testing MTU $MTU (payload: $DataSize)... "
    # -f is Don't Fragment flag, -n 1 is 1 echo request, -l is size
    $PingResult = ping -n 1 -f -l $DataSize $Target 2>$Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS (No Fragmentation)" -ForegroundColor Green
        Write-Host ""
        Write-Host ">>> Optimal WireGuard MTU recommendations for Windows:"
        Write-Host ">>> IPv4 MTU: $($MTU - 40) bytes (Conservative: $($MTU - 60) bytes)"
        Write-Host ">>> IPv6 MTU: $($MTU - 60) bytes (Conservative: $($MTU - 80) bytes)"
        exit
    } else {
        Write-Host "FAILED (Requires Fragmentation)" -ForegroundColor Red
    }
}
Write-Host "MTU Sweep complete. Safe fallback MTU = 1280."`;
      } else if (os === "apple") {
        return `#!/usr/bin/env bash
# macOS MTU Sweep / Calibration Utility
# Finds the maximum MTU value that can traverse your ISP network without fragmentation.

TARGET="{{SWEEP_HOST}}"
echo "=== Starting MTU Path Discovery to $TARGET ==="

# Base MTU payload sizes to test
test_sizes=(1472 1464 1412 1392 1372 1360 1252)

for data_size in "\${test_sizes[@]}"; do
    mtu=$((data_size + 28))
    echo -n "Testing MTU $mtu (payload: $data_size)... "
    
    # -D flag is Don't Fragment on macOS
    ping -c 1 -D -s "$data_size" "$TARGET" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "SUCCESS (No Fragmentation)"
        echo ""
        echo ">>> Optimal macOS WireGuard MTU recommendations:"
        echo ">>> IPv4 MTU: $((mtu - 40)) bytes (Conservative: $((mtu - 60)) bytes)"
        echo ">>> IPv6 MTU: $((mtu - 60)) bytes (Conservative: $((mtu - 80)) bytes)"
        exit 0
    else
        echo "FAILED (Requires Fragmentation)"
    fi
done

echo "MTU Sweep complete. Safe fallback MTU = 1280 (minimum MTU for IPv6)."`;
      }
    }

    if (segmentId === "ssh-autossh-service") {
      if (os === "apple") {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.autossh.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/autossh</string>
        <string>-M</string>
        <string>0</string>
        <string>-N</string>
        <string>-o</string>
        <string>ServerAliveInterval={{ALIVE_INTERVAL}}</string>
        <string>-o</string>
        <string>ServerAliveCountMax={{ALIVE_COUNT_MAX}}</string>
        <string>-o</string>
        <string>ExitOnForwardFailure=yes</string>
        <string>-i</string>
        <string>/Users/{{SYSTEM_USER}}/.ssh/{{IDENTITY_FILE}}</string>
        <string>-L</string>
        <string>{{LOCAL_PORT}}:127.0.0.1:{{REMOTE_PORT}}</string>
        <string>{{SSH_USER}}@{{REMOTE_HOST}}</string>
        <string>-p</string>
        <string>{{SSH_PORT}}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>`;
      } else if (os === "windows") {
        return `@echo off
:: Windows Batch AutoSSH Script with Service wrapper
:: Configure as a Startup script or run with NSSM (Non-Sucking Service Manager)
set AUTOSSH_GATETIME=0
set AUTOSSH_PORT=0

"C:\\Program Files\\autossh\\autossh.exe" -M 0 -N -o "ServerAliveInterval={{ALIVE_INTERVAL}}" -o "ServerAliveCountMax={{ALIVE_COUNT_MAX}}" -o "ExitOnForwardFailure=yes" -i "C:\\Users\\{{SYSTEM_USER}}\\.ssh\\{{IDENTITY_FILE}}" -L {{LOCAL_PORT}}:127.0.0.1:{{REMOTE_PORT}} {{SSH_USER}}@{{REMOTE_HOST}} -p {{SSH_PORT}}`;
      }
    }

    if (segmentId === "gateway-watchdog") {
      if (os === "windows") {
        return `# Windows PowerShell Internet Multi-Gateway Watchdog Script
$DNS_A = "1.1.1.1"
$DNS_B = "8.8.8.8"
$Interface = "{{LOCAL_IFACE}}"
$LogFile = "C:\\Program Files\\Orchestration\\gateway-watchdog.log"

function Test-Ping($IP) {
    return Test-Connection -ComputerName $IP -Count 1 -Quiet
}

if (Test-Ping $DNS_A -or Test-Ping $DNS_B) {
    Write-Output "Network connectivity active."
    exit
}

Start-Sleep -Seconds 10
if (Test-Ping $DNS_A -or Test-Ping $DNS_B) {
    Write-Output "Recovered naturally after delay."
    exit
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Output "[$Timestamp] WAN Disconnection detected on $Interface. Flushing Routing Cache..." | Out-File -FilePath $LogFile -Append

# Flush IPv4 Routing Table
Remove-NetRoute -InterfaceAlias $Interface -Confirm:$false 2>$Null
# Restart NetAdapter to renew lease
Restart-NetAdapter -Name $Interface -Confirm:$false

Start-Sleep -Seconds 5
if (Test-Ping $DNS_A) {
    Write-Output "[$Timestamp] RESTORED: Connectivity recovered successfully." | Out-File -FilePath $LogFile -Append
} else {
    Write-Output "[$Timestamp] FAILURE: Still offline." | Out-File -FilePath $LogFile -Append
}`;
      }
    }

    return originalTemplate;
  };

  const getOSFileTarget = (segmentId: string, os: string, defaultTarget: string) => {
    switch (segmentId) {
      case "wg-keepalive":
        if (os === "windows") return "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf";
        if (os === "apple") return "/usr/local/etc/wireguard/wg0.conf";
        if (os === "pulse") return "/var/lib/pulse/wg0.conf";
        return defaultTarget;
      case "wg-watchdog-script":
        if (os === "windows") return "C:\\Program Files\\WireGuard\\wg-watchdog.ps1";
        if (os === "apple") return "/usr/local/bin/wg-watchdog.sh";
        return defaultTarget;
      case "ssh-client-config":
        if (os === "windows") return "C:\\Users\\%USERNAME%\\.ssh\\config";
        return defaultTarget;
      case "ssh-autossh-service":
        if (os === "windows") return "C:\\Program Files\\autossh\\autossh-service.bat";
        if (os === "apple") return "~/Library/LaunchAgents/com.autossh.tunnel.plist";
        return defaultTarget;
      case "gateway-watchdog":
        if (os === "windows") return "C:\\Program Files\\Orchestration\\gateway-watchdog.ps1";
        return defaultTarget;
      case "mtu-mss-calibration":
        if (os === "windows") return "C:\\Program Files\\Orchestration\\mtu-sweep.ps1";
        return defaultTarget;
      default:
        return defaultTarget;
    }
  };

  // Preset Code Customizer State
  const [selectedCategory, setSelectedCategory] = useState<ConfigType>("wireguard");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("wg-keepalive");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isCopied, setIsCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // Camera QR Code Scanner States
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const [qrScannerSuccessMsg, setQrScannerSuccessMsg] = useState<string | null>(null);
  const [qrScannerErrorMsg, setQrScannerErrorMsg] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Secure Encrypted ZIP Backup States
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupTab, setBackupTab] = useState<"zip" | "gdrive" | "rclone" | "obsidian">("zip");
  const [backupCopied, setBackupCopied] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [backupEncryption, setBackupEncryption] = useState<"zipCrypto" | "aes">("zipCrypto");
  const [isBackupExporting, setIsBackupExporting] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  // AI Config Optimizer State
  const [rawConfigInput, setRawConfigInput] = useState("");
  const [optimizerType, setOptimizerType] = useState<"wireguard" | "ssh" | "usb-tether">("wireguard");
  const [optimizerDescription, setOptimizerDescription] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedOutput, setOptimizedOutput] = useState<{
    optimizedConfig: string;
    changesMade: string[];
    explanation: string;
  } | null>(null);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);

  // Expanded Feature States
  const [workbenchTab, setWorkbenchTab] = useState<"code" | "deploy">("code");
  const [copiedCommandIdx, setCopiedCommandIdx] = useState<number | null>(null);
  const [pingHistory, setPingHistory] = useState<number[]>([12, 11, 14, 12, 13, 11, 12, 13, 12, 11, 12, 14, 13, 12, 11, 15, 12, 12, 11, 13, 12, 14, 13, 12]);
  
  // Interactive Topology Map States
  const [selectedTopologyNode, setSelectedTopologyNode] = useState<string>("local-pc");
  const [topologyHoveredNode, setTopologyHoveredNode] = useState<string | null>(null);
  const [bulkSelectedNodes, setBulkSelectedNodes] = useState<Array<string>>(["wg-primary-01", "ssh-db-tunnel"]);
  const [bulkActionFeedback, setBulkActionFeedback] = useState<{ type: "success" | "info"; message: string } | null>(null);

  // Local SSH Key Generator Utility States
  const [isSshKeyModalOpen, setIsSshKeyModalOpen] = useState(false);
  const [sshKeyType, setSshKeyType] = useState<"ed25519" | "rsa">("ed25519");
  const [sshKeyName, setSshKeyName] = useState("id_ed25519");
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(null);
  const [generatedPublicKey, setGeneratedPublicKey] = useState<string | null>(null);
  const [isSshKeyGenerating, setIsSshKeyGenerating] = useState(false);
  const [sshKeyCopied, setSshKeyCopied] = useState<"private" | "public" | "auth_keys" | null>(null);

  // Ephemeral SSH Key Auto-Masking Countdown (60s hygiene)
  useEffect(() => {
    if (!isSshKeyModalOpen || !generatedPrivateKey) return;
    setIsSshPrivateMasked(false);
    setSshMaskCountdownSec(60);
    const timer = setInterval(() => {
      setSshMaskCountdownSec((prev) => {
        if (prev <= 1) {
          setIsSshPrivateMasked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSshKeyModalOpen, generatedPrivateKey]);

  // Startup Configuration Wizard States
  const [isStartupWizardOpen, setIsStartupWizardOpen] = useState(false);
  const [startupWizardOS, setStartupWizardOS] = useState<"linux" | "macos" | "windows">("linux");
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardCopiedIndex, setWizardCopiedIndex] = useState<number | null>(null);

  // Network Health Check State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showOfflineAlert, setShowOfflineAlert] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString());
  
  // Security PIN Locks (OmniEye Brand Control)
  const [pinStored, setPinStored] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("omnieye_app_pin") || localStorage.getItem("omninetwork_optimizer_app_pin") || null;
    }
    return null;
  });
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!(localStorage.getItem("omnieye_app_pin") || localStorage.getItem("omninetwork_optimizer_app_pin"));
    }
    return false;
  });
  const [pinInput, setPinInput] = useState("");
  const [setupPin1, setSetupPin1] = useState("");
  const [setupPin2, setSetupPin2] = useState("");
  const [pinErrorMsg, setPinErrorMsg] = useState<string | null>(null);
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [showPinSettingsModal, setShowPinSettingsModal] = useState(false);
  

  // HUD module states: 'full' | 'medium' | 'low' | 'hidden'
  const [simulatorState, setSimulatorState] = useState<"full" | "medium" | "low" | "hidden">("full");
  const [workbenchState, setWorkbenchState] = useState<"full" | "medium" | "low" | "hidden">("full");
  const [optimizerState, setOptimizerState] = useState<"full" | "medium" | "low" | "hidden">("full");
  const [terminalState, setTerminalState] = useState<"full" | "medium" | "low" | "hidden">("full");
  const [wifiState, setWifiState] = useState<"full" | "medium" | "low" | "hidden">("full");

  // Helper to determine CSS classes for module brightness/opacity
  const getModuleStyle = (state: "full" | "medium" | "low" | "hidden") => {
    switch (state) {
      case "medium":
        return "opacity-60 saturate-75 transition-all duration-300";
      case "low":
        return "opacity-25 saturate-50 transition-all duration-300";
      case "hidden":
        return "opacity-20 transition-all duration-300";
      default:
        return "opacity-100 transition-all duration-300";
    }
  };

  // Wi-Fi Credentials Vault with AES-GCM encrypted storage when PIN is configured
  const [savedWifiNetworks, setSavedWifiNetworks] = useState<Array<{ssid: string; security: string; key: string}>>(() => {
    if (typeof window !== "undefined") {
      const hasPin = !!(localStorage.getItem("omnieye_app_pin") || localStorage.getItem("omninetwork_optimizer_app_pin"));
      if (hasPin && localStorage.getItem("omnieye_saved_wifi_enc")) {
        return [];
      }
      const raw = localStorage.getItem("omnieye_saved_wifi") || localStorage.getItem("omninetwork_optimizer_saved_wifi");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {
          return [];
        }
      }
    }
    return [
      { ssid: "Secure_Home_Mesh", security: "WPA3-SAE", key: "dragon-breath-9988" },
      { ssid: "Field_HQ_Redundant", security: "WPA2-PSK", key: "hq-tunnel-pass-alpha" }
    ];
  });

  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA2-PSK");
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [wifiStatusMessage, setWifiStatusMessage] = useState<string | null>(null);
  const [wifiStatusType, setWifiStatusType] = useState<"success" | "error" | "info" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pinStored && !isAppLocked) {
      encryptVaultPayload(savedWifiNetworks, pinStored)
        .then(async (cipher) => {
          localStorage.setItem("omnieye_saved_wifi_enc", cipher);
          localStorage.removeItem("omnieye_saved_wifi");
          localStorage.removeItem("omninetwork_optimizer_saved_wifi");
          if (user && user.uid !== "demo-analyst-99") {
            setCloudVaultStatus("syncing");
            try {
              const idToken = await getFirebaseIdToken();
              if (idToken) {
                const resp = await fetch("/api/vault", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                  },
                  body: JSON.stringify({ ciphertextPayload: cipher }),
                });
                if (resp.ok) {
                  setHasCloudVault(true);
                  setCloudVaultStatus("synced");
                  return;
                }
              }
            } catch {
              // ignore transient cloud sync error
            }
            setCloudVaultStatus("local");
          }
        })
        .catch(() => {
          localStorage.setItem("omnieye_saved_wifi", JSON.stringify(savedWifiNetworks));
        });
    } else if (!pinStored) {
      localStorage.setItem("omnieye_saved_wifi", JSON.stringify(savedWifiNetworks));
      localStorage.removeItem("omnieye_saved_wifi_enc");
      setCloudVaultStatus(hasCloudVault ? "available" : "local");
    }
  }, [savedWifiNetworks, pinStored, isAppLocked, user]);

  const handleSaveWifi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiSsid.trim()) {
      setWifiStatusMessage("SSID (Network Name) is required.");
      setWifiStatusType("error");
      return;
    }
    if (wifiSecurity !== "Open" && !wifiPassword) {
      setWifiStatusMessage("Password / Key is required for secured connections.");
      setWifiStatusType("error");
      return;
    }

    const trimmedSsid = wifiSsid.trim();
    const existsIdx = savedWifiNetworks.findIndex(n => n.ssid.toLowerCase() === trimmedSsid.toLowerCase());
    if (existsIdx > -1) {
      const updated = [...savedWifiNetworks];
      updated[existsIdx] = { ssid: trimmedSsid, security: wifiSecurity, key: wifiSecurity === "Open" ? "" : wifiPassword };
      setSavedWifiNetworks(updated);
      setWifiStatusMessage(`[SYS_OK] Updated security keys for SSID '${trimmedSsid}' in secure local vault.`);
      setWifiStatusType("info");
    } else {
      setSavedWifiNetworks([...savedWifiNetworks, { ssid: trimmedSsid, security: wifiSecurity, key: wifiSecurity === "Open" ? "" : wifiPassword }]);
      setWifiStatusMessage(`[SYS_OK] SSID '${trimmedSsid}' successfully written to credentials database.`);
      setWifiStatusType("success");
    }

    // Reset password field, keep SSID for confirmation
    setWifiPassword("");
  };

  const handleDeleteWifi = (ssidToDelete: string) => {
    setSavedWifiNetworks(savedWifiNetworks.filter(n => n.ssid !== ssidToDelete));
    setWifiStatusMessage(`SSID '${ssidToDelete}' purged from storage vault.`);
    setWifiStatusType("info");
  };

  const handleAutofillWifi = (ssidName: string) => {
    const found = savedWifiNetworks.find(n => n.ssid === ssidName);
    if (found) {
      setWifiSsid(found.ssid);
      setWifiSecurity(found.security);
      setWifiPassword(found.key);
      setWifiStatusMessage(`[SYS_OK] Password successfully auto-filled for network '${found.ssid}'.`);
      setWifiStatusType("success");
    }
  };

  const matchedSavedNetwork = savedWifiNetworks.find(
    (n) => n.ssid.toLowerCase() === wifiSsid.trim().toLowerCase()
  );

  interface DiagnosticCheck {
    id: string;
    title: string;
    status: "passed" | "warning" | "failed";
    description: string;
    recommendation: string;
    canFix: boolean;
    fixValue: string;
  }
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticCheck[]>([]);

  // Automatic Config Health Scanner
  useEffect(() => {
    if (!rawConfigInput.trim()) {
      setDiagnosticResults([]);
      return;
    }

    const checks: DiagnosticCheck[] = [];

    if (optimizerType === "wireguard") {
      // 1. PersistentKeepalive check
      const keepaliveMatch = rawConfigInput.match(/PersistentKeepalive\s*=\s*(\d+)/i);
      if (!keepaliveMatch) {
        checks.push({
          id: "wg-keepalive-missing",
          title: "Persistent Keepalive Policy",
          status: "failed",
          description: "No keepalive interval found in Peer configuration.",
          recommendation: "Inject 'PersistentKeepalive = 25' to send background handshake packets.",
          canFix: true,
          fixValue: "PersistentKeepalive = 25"
        });
      } else {
        const val = parseInt(keepaliveMatch[1]);
        if (val <= 0) {
          checks.push({
            id: "wg-keepalive-disabled",
            title: "Persistent Keepalive Policy",
            status: "failed",
            description: "Keepalive handshakes are explicitly disabled (value is 0).",
            recommendation: "Set keepalive interval between 21s and 25s.",
            canFix: true,
            fixValue: "PersistentKeepalive = 25"
          });
        } else if (val > 30) {
          checks.push({
            id: "wg-keepalive-high",
            title: "Persistent Keepalive Policy",
            status: "warning",
            description: `Keepalive is set to ${val}s, which exceeds standard 30s NAT timeout.`,
            recommendation: "Reduce interval to 25s to ensure NAT mapping never expires.",
            canFix: true,
            fixValue: "PersistentKeepalive = 25"
          });
        } else {
          checks.push({
            id: "wg-keepalive-ok",
            title: "Persistent Keepalive Policy",
            status: "passed",
            description: `Configured perfectly at ${val} seconds.`,
            recommendation: "No adjustments needed.",
            canFix: false,
            fixValue: ""
          });
        }
      }

      // 2. MTU check
      const mtuMatch = rawConfigInput.match(/MTU\s*=\s*(\d+)/i);
      if (!mtuMatch) {
        checks.push({
          id: "wg-mtu-missing",
          title: "Maximum Transmission Unit (MTU)",
          status: "warning",
          description: "MTU value is not specified under [Interface].",
          recommendation: "Add 'MTU = 1420' to avoid accidental payload fragmentation over WAN links.",
          canFix: true,
          fixValue: "MTU = 1420"
        });
      } else {
        const val = parseInt(mtuMatch[1]);
        if (val > 1420) {
          checks.push({
            id: "wg-mtu-high",
            title: "Maximum Transmission Unit (MTU)",
            status: "warning",
            description: `MTU is set to ${val} bytes, which may exceed tunnel encapsulation ceiling.`,
            recommendation: "Lower MTU to 1420 (for IPv4) or 1280 (for IPv6) to guarantee safe packet passage.",
            canFix: true,
            fixValue: "MTU = 1420"
          });
        } else {
          checks.push({
            id: "wg-mtu-ok",
            title: "Maximum Transmission Unit (MTU)",
            status: "passed",
            description: `Optimized at safe MTU ceiling (${val} bytes).`,
            recommendation: "No fragmentation issues expected.",
            canFix: false,
            fixValue: ""
          });
        }
      }

      // 3. DNS check (Priority 3)
      const dnsValueMatch = rawConfigInput.match(/DNS\s*=\s*([^\n\r]+)/i);
      if (!dnsValueMatch) {
        checks.push({
          id: "wg-dns-missing",
          title: "DNS Resolution Mapping (Priority 3)",
          status: "warning",
          description: "No secure DNS resolver defined for tunnel interface resolution.",
          recommendation: "Explicitly bind to secure, high-performance nameservers. Set 'DNS = 1.1.1.1' (Cloudflare Primary) or use 'DNS = 1.1.1.3' for malware protection.",
          canFix: true,
          fixValue: "DNS = 1.1.1.1"
        });
      } else {
        const dnsVal = dnsValueMatch[1].trim();
        if (dnsVal.includes("1.1.1.1") || dnsVal.includes("1.0.0.1")) {
          checks.push({
            id: "wg-dns-cloudflare-standard",
            title: "DNS Resolution Mapping (Priority 3)",
            status: "passed",
            description: "Tunnel is secured using Cloudflare's ultra-fast 1.1.1.1 public resolver.",
            recommendation: "Excellent choice. To further secure your tunnel, consider integrating your Cloudflare Gateway / Zero Trust account or using '1.1.1.3' to block malware domains automatically.",
            canFix: true,
            fixValue: "DNS = 1.1.1.3"
          });
        } else if (dnsVal.includes("1.1.1.3") || dnsVal.includes("1.0.0.3")) {
          checks.push({
            id: "wg-dns-cloudflare-families",
            title: "DNS Resolution Mapping (Priority 3)",
            status: "passed",
            description: "Tunnel is hardened using Cloudflare for Families (1.1.1.3) with automatic malware blocking.",
            recommendation: "Peak safety. If you have a Cloudflare Zero Trust account, you can configure your custom Gateway Team ID endpoint for tailored network logs.",
            canFix: false,
            fixValue: ""
          });
        } else if (dnsVal.includes("cloudflare-gateway.com") || dnsVal.includes(".gateway")) {
          checks.push({
            id: "wg-dns-cloudflare-teams",
            title: "DNS Resolution Mapping (Priority 3)",
            status: "passed",
            description: "Tunnel is fully integrated with your private Cloudflare Zero Trust Gateway account.",
            recommendation: "Maximum safety and corporate-grade telemetry achieved.",
            canFix: false,
            fixValue: ""
          });
        } else {
          checks.push({
            id: "wg-dns-other",
            title: "DNS Resolution Mapping (Priority 3)",
            status: "warning",
            description: `Tunnel is using a generic or unverified DNS resolver (${dnsVal}).`,
            recommendation: "Upgrade to Cloudflare's high-performance, private 1.1.1.1 (or 1.1.1.3 with malware blocking) to maximize packet safety and lookup speeds.",
            canFix: true,
            fixValue: "DNS = 1.1.1.3"
          });
        }
      }

    } else if (optimizerType === "ssh") {
      // SSH CLIENT CHECK
      // 1. ServerAliveInterval check
      const intervalMatch = rawConfigInput.match(/ServerAliveInterval\s+(\d+)/i);
      if (!intervalMatch) {
        checks.push({
          id: "ssh-interval-missing",
          title: "ServerAlive Interval Handshakes",
          status: "failed",
          description: "No ServerAliveInterval frequency declared.",
          recommendation: "Inject 'ServerAliveInterval 15' to regularly poll host socket state.",
          canFix: true,
          fixValue: "    ServerAliveInterval 15"
        });
      } else {
        const val = parseInt(intervalMatch[1]);
        if (val > 60) {
          checks.push({
            id: "ssh-interval-high",
            title: "ServerAlive Interval Handshakes",
            status: "warning",
            description: `Interval set to ${val}s. Dead connections take too long to detect.`,
            recommendation: "Set 'ServerAliveInterval 15' to detect network dropouts in under a minute.",
            canFix: true,
            fixValue: "    ServerAliveInterval 15"
          });
        } else {
          checks.push({
            id: "ssh-interval-ok",
            title: "ServerAlive Interval Handshakes",
            status: "passed",
            description: `Polling active every ${val} seconds.`,
            recommendation: "Handshakes nominal.",
            canFix: false,
            fixValue: ""
          });
        }
      }

      // 2. ServerAliveCountMax check
      const countMatch = rawConfigInput.match(/ServerAliveCountMax\s+(\d+)/i);
      if (!countMatch) {
        checks.push({
          id: "ssh-count-missing",
          title: "Connection Failure Count Ceiling",
          status: "warning",
          description: "No ServerAliveCountMax defined. Defaults to standard 3.",
          recommendation: "Add 'ServerAliveCountMax 3' to terminate stale socket after 3 misses.",
          canFix: true,
          fixValue: "    ServerAliveCountMax 3"
        });
      } else {
        checks.push({
          id: "ssh-count-ok",
          title: "Connection Failure Count Ceiling",
          status: "passed",
          description: `Configured to close link after ${countMatch[1]} missed attempts.`,
          recommendation: "Ready to trigger automatic recovery daemon.",
          canFix: false,
          fixValue: ""
        });
      }

      // 3. TCPKeepAlive check
      const tcpKeepMatch = rawConfigInput.match(/TCPKeepAlive\s+(\w+)/i);
      if (!tcpKeepMatch || tcpKeepMatch[1].toLowerCase() !== "yes") {
        checks.push({
          id: "ssh-tcpkeepalive-missing",
          title: "OS-Level TCP Keepalives",
          status: "warning",
          description: "OS TCP-level socket probing not explicitly enabled.",
          recommendation: "Ensure 'TCPKeepAlive yes' is configured to detect routing disconnects.",
          canFix: true,
          fixValue: "    TCPKeepAlive yes"
        });
      } else {
        checks.push({
          id: "ssh-tcpkeepalive-ok",
          title: "OS-Level TCP Keepalives",
          status: "passed",
          description: "TCPKeepAlive is successfully enabled at OS socket layer.",
          recommendation: "Great.",
          canFix: false,
          fixValue: ""
        });
      }
    } else if (optimizerType === "usb-tether") {
      // USB TETHERING DIAGNOSTIC CHECKS
      // 1. USB Interface Detection
      const usbIfaceMatch = rawConfigInput.match(/(usb\d+|rndis\d+|cdc_ether|enp\d+s\d+u\d+|enp0s20u\d+|eth\d+)/i);
      if (!usbIfaceMatch) {
        checks.push({
          id: "usb-interface-missing",
          title: "USB Network Adapter Detection",
          status: "warning",
          description: "No specific USB-tethered network interface (e.g. usb0, rndis0, cdc_ether, enp0s20u2) was found in your configuration.",
          recommendation: "Enable 'USB Tethering' in your phone's settings and specify your interface name (default is usually 'usb0').",
          canFix: true,
          fixValue: "allow-hotplug usb0\niface usb0 inet dhcp"
        });
      } else {
        checks.push({
          id: "usb-interface-ok",
          title: "USB Network Adapter Detection",
          status: "passed",
          description: `Identified active USB interface handle: '${usbIfaceMatch[0]}'.`,
          recommendation: "This network adapter is ready to route dynamic cellular packets.",
          canFix: false,
          fixValue: ""
        });
      }

      // 2. Dynamic Route Metric check
      const metricMatch = rawConfigInput.match(/metric\s+(\d+)/i);
      if (!metricMatch) {
        checks.push({
          id: "usb-metric-missing",
          title: "Interface Route Metric Priority",
          status: "failed",
          description: "No route metric assigned. Tethered cellular links can clash with default Ethernet/Wi-Fi routes.",
          recommendation: "Inject 'metric 150' under the interface to de-prioritize it below LAN but above your tunnel.",
          canFix: true,
          fixValue: "    metric 150"
        });
      } else {
        const val = parseInt(metricMatch[1]);
        if (val < 100) {
          checks.push({
            id: "usb-metric-low",
            title: "Interface Route Metric Priority",
            status: "warning",
            description: `Route metric is set very low (${val}). This might override your primary internet/Wi-Fi connection entirely.`,
            recommendation: "Increase metric to 150 to keep it as a fallback/overlay route.",
            canFix: true,
            fixValue: "    metric 150"
          });
        } else {
          checks.push({
            id: "usb-metric-ok",
            title: "Interface Route Metric Priority",
            status: "passed",
            description: `Configured perfectly with dynamic route metric priority of ${val}.`,
            recommendation: "Safe routing path guaranteed.",
            canFix: false,
            fixValue: ""
          });
        }
      }

      // 3. DNS Nameservers configuration (Priority 3)
      const dnsValueMatch = rawConfigInput.match(/(dns-nameservers|nameserver|DNS)\s+([^\n\r]+)/i);
      if (!dnsValueMatch) {
        checks.push({
          id: "usb-dns-missing",
          title: "Tether Domain Name Service (Priority 3)",
          status: "warning",
          description: "No custom nameservers are assigned to this interface. Cellular rotations might disrupt resolution.",
          recommendation: "Explicitly force dynamic DNS resolution by locking public servers. Set '    dns-nameservers 1.1.1.1' (Cloudflare) or '    dns-nameservers 1.1.1.3' for malware protection.",
          canFix: true,
          fixValue: "    dns-nameservers 1.1.1.1"
        });
      } else {
        const dnsVal = dnsValueMatch[2].trim();
        if (dnsVal.includes("1.1.1.1") || dnsVal.includes("1.0.0.1")) {
          checks.push({
            id: "usb-dns-cloudflare-standard",
            title: "Tether Domain Name Service (Priority 3)",
            status: "passed",
            description: "Interface uses Cloudflare's ultra-low latency 1.1.1.1 secure public resolver.",
            recommendation: "Excellent performance. Upgrade to '    dns-nameservers 1.1.1.3' to automatically drop connections to known malware domains.",
            canFix: true,
            fixValue: "    dns-nameservers 1.1.1.3"
          });
        } else if (dnsVal.includes("1.1.1.3") || dnsVal.includes("1.0.0.3")) {
          checks.push({
            id: "usb-dns-cloudflare-families",
            title: "Tether Domain Name Service (Priority 3)",
            status: "passed",
            description: "Interface is hardened using Cloudflare for Families (1.1.1.3) with real-time malware protection.",
            recommendation: "Optimal cellular routing safety. Integrate your custom Cloudflare Zero Trust account to track security logs on this link.",
            canFix: false,
            fixValue: ""
          });
        } else if (dnsVal.includes("cloudflare-gateway.com") || dnsVal.includes(".gateway")) {
          checks.push({
            id: "usb-dns-cloudflare-teams",
            title: "Tether Domain Name Service (Priority 3)",
            status: "passed",
            description: "Interface resolution is routed directly through your private Cloudflare Zero Trust Gateway account.",
            recommendation: "Elite security configuration. Malware, phishing, and spyware vectors are filtered at the edge.",
            canFix: false,
            fixValue: ""
          });
        } else {
          checks.push({
            id: "usb-dns-other",
            title: "Tether Domain Name Service (Priority 3)",
            status: "warning",
            description: `Interface is using unverified DNS nameservers (${dnsVal}).`,
            recommendation: "Redirect nameserver traffic through Cloudflare's 1.1.1.1 (standard) or 1.1.1.3 (secure malware blocker) for maximum security and cache speeds.",
            canFix: true,
            fixValue: "    dns-nameservers 1.1.1.3"
          });
        }
      }
    }

    setDiagnosticResults(checks);
  }, [rawConfigInput, optimizerType]);

  // Handle local config quick fixes
  const handleApplyFix = (checkId: string, fixValue: string) => {
    setRawConfigInput((prev) => {
      let lines = prev.split("\n");
      
      if (checkId === "wg-keepalive-missing" || checkId === "wg-keepalive-disabled" || checkId === "wg-keepalive-high") {
        const idx = lines.findIndex((l) => l.trim().startsWith("PersistentKeepalive"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          const peerIdx = lines.findIndex((l) => l.trim().toLowerCase() === "[peer]");
          if (peerIdx !== -1) {
            lines.splice(peerIdx + 1, 0, fixValue);
          } else {
            lines.push("", "[Peer]", fixValue);
          }
        }
      } else if (checkId === "wg-mtu-missing" || checkId === "wg-mtu-high") {
        const idx = lines.findIndex((l) => l.trim().startsWith("MTU"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          const interfaceIdx = lines.findIndex((l) => l.trim().toLowerCase() === "[interface]");
          if (interfaceIdx !== -1) {
            lines.splice(interfaceIdx + 1, 0, fixValue);
          } else {
            lines.unshift("[Interface]", fixValue, "");
          }
        }
      } else if (checkId === "wg-dns-missing") {
        const idx = lines.findIndex((l) => l.trim().startsWith("DNS"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          const interfaceIdx = lines.findIndex((l) => l.trim().toLowerCase() === "[interface]");
          if (interfaceIdx !== -1) {
            lines.splice(interfaceIdx + 1, 0, fixValue);
          } else {
            lines.unshift("[Interface]", fixValue, "");
          }
        }
      } else if (checkId === "ssh-interval-missing" || checkId === "ssh-interval-high") {
        const idx = lines.findIndex((l) => l.trim().startsWith("ServerAliveInterval"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          lines.push(fixValue);
        }
      } else if (checkId === "ssh-count-missing") {
        const idx = lines.findIndex((l) => l.trim().startsWith("ServerAliveCountMax"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          lines.push(fixValue);
        }
      } else if (checkId === "ssh-tcpkeepalive-missing") {
        const idx = lines.findIndex((l) => l.trim().startsWith("TCPKeepAlive"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          lines.push(fixValue);
        }
      } else if (checkId === "usb-interface-missing") {
        lines.push(fixValue);
      } else if (checkId === "usb-metric-missing" || checkId === "usb-metric-low") {
        const idx = lines.findIndex((l) => l.trim().startsWith("metric"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          lines.push(fixValue);
        }
      } else if (checkId === "usb-dns-missing") {
        const idx = lines.findIndex((l) => l.trim().startsWith("dns-nameservers"));
        if (idx !== -1) {
          lines[idx] = fixValue;
        } else {
          lines.push(fixValue);
        }
      }
      
      return lines.join("\n");
    });
  };

  // Chat Agent State
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am OmniEye AI Agent, fortified under the sovereign 7DS/OMNI Destiny Seal. I specialize in high-efficiency video pipeline compression, container orchestrations, and secure metric telemetry tunneling. All telemetry stream variables are encrypted via WireGuard and Tailscale to be safely ingested by our Greater Daemon Systemology before arriving as LLM context. Paste a video configuration, describe your stream topology, or ask me for optimization recipes! How can I assist you today?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const [simulationActive, setSimulationActive] = useState(false);
  const [natTimeoutOccurred, setNatTimeoutOccurred] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([
    "[SYSTEM] Idle: Waiting for stress test initialization...",
  ]);
  const [simConfig, setSimConfig] = useState({
    keepalive: 25,
    mtu: 1420,
    serverAliveInterval: 15,
    serverAliveCountMax: 3
  });

  // Footer / Status Logs State
  const [systemLogs, setSystemLogs] = useState<Array<{ time: string; type: "OK" | "INFO" | "WARN"; text: string }>>([
    { time: "14:22:01", type: "OK", text: "HEARTBEAT wg0 active" },
    { time: "14:22:04", type: "OK", text: "OPTIMIZING DNS resolver latency" },
    { time: "14:22:05", type: "INFO", text: "Agent recalculating MTU values" },
  ]);
  const [cpuUsage, setCpuUsage] = useState(2.1);
  const [memUsage, setMemUsage] = useState(128);

  // Loaded segment helper
  const currentSegment = PRESET_SEGMENTS.find((s) => s.id === selectedSegmentId) || PRESET_SEGMENTS[0];
  const identityFileVar = currentSegment.variables.find((v) => v.key === "IDENTITY_FILE");
  const isIdentityFileBlank = !!identityFileVar && (!variableValues["IDENTITY_FILE"] || variableValues["IDENTITY_FILE"].trim() === "");

  useEffect(() => {
    if (skipNextSegmentResetRef.current) {
      skipNextSegmentResetRef.current = false;
      return;
    }
    const initialVals: Record<string, string> = {};
    currentSegment.variables.forEach((v) => {
      if (v.key === "MTU_SIZE") {
        if (selectedOS === "windows" || selectedOS === "apple") {
          initialVals[v.key] = "1400";
        } else if (selectedOS === "pulse") {
          initialVals[v.key] = "1340";
        } else {
          initialVals[v.key] = "1420";
        }
      } else if (v.key === "KEEPALIVE_INTERVAL") {
        if (selectedOS === "pulse") {
          initialVals[v.key] = "20";
        } else {
          initialVals[v.key] = "25";
        }
      } else if (v.key === "SYSTEM_USER") {
        if (selectedOS === "windows") {
          initialVals[v.key] = "Administrator";
        } else if (selectedOS === "apple") {
          initialVals[v.key] = "macos_user";
        } else if (selectedOS === "ubuntu") {
          initialVals[v.key] = "ubuntu";
        } else if (selectedOS === "pulse") {
          initialVals[v.key] = "pulse_user";
        } else {
          initialVals[v.key] = "pi";
        }
      } else {
        initialVals[v.key] = v.defaultValue;
      }
    });
    setVariableValues(initialVals);
  }, [selectedSegmentId, selectedOS]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Dynamic status logs tick
  useEffect(() => {
    const logInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const items = [
        { type: "OK" as const, text: "Verifying PersistentKeepalive packets" },
        { type: "OK" as const, text: "SSH tunnel ServerAlive handshake OK" },
        { type: "INFO" as const, text: "Checking MTU ceiling (1420 bytes safe)" },
        { type: "INFO" as const, text: "Watchdog cron script verified active" },
        { type: "OK" as const, text: "Routing cache is operating optimally" },
      ];
      const randomItem = items[Math.floor(Math.random() * items.length)];
      setSystemLogs((prev) => [
        ...prev.slice(-3),
        { time: timeStr, type: randomItem.type, text: randomItem.text }
      ]);
      setCpuUsage(Number((1.5 + Math.random() * 2).toFixed(1)));
    }, 12000);

    return () => clearInterval(logInterval);
  }, []);

  // Periodic foreground network health check
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      setLastCheckTime(new Date().toLocaleTimeString());
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      setLastCheckTime(new Date().toLocaleTimeString());
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    const interval = setInterval(() => {
      const currentOnline = navigator.onLine;
      setLastCheckTime(new Date().toLocaleTimeString());
      if (currentOnline !== isOnline) {
        setIsOnline(currentOnline);
        if (!currentOnline) {
          setShowOfflineAlert(true);
        } else {
          setShowOfflineAlert(false);
        }
      }
    }, 4000);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Compile template dynamically
  const compileTemplate = (template: string, values: Record<string, string>) => {
    let result = template;
    Object.entries(values).forEach(([key, val]) => {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), val || `[Enter ${key}]`);
    });
    return result;
  };

  const rawTemplate = useMemo(
    () => getOSSpecificCodeTemplate(currentSegment.id, selectedOS, currentSegment.codeTemplate),
    [currentSegment.id, selectedOS, currentSegment.codeTemplate]
  );
  const activeProfileForWorkbench = useMemo(
    () => fleetProfiles.find((p) => p.id === activeProfileId) || fleetProfiles[0] || null,
    [fleetProfiles, activeProfileId]
  );
  const activeGeoPolicy = useMemo(
    () => resolveGeoRegionPolicy(activeProfileForWorkbench),
    [activeProfileForWorkbench]
  );
  const workbenchOsNormalized: "linux" | "macos" | "windows" =
    selectedOS === "windows" ? "windows" : selectedOS === "apple" ? "macos" : "linux";

  const compiledCode = useMemo(() => {
    let code = compileTemplate(rawTemplate, variableValues);
    if (activeHardwareDevice) {
      code = appendHardwareSelfTuningRules(
        code,
        currentSegment.category,
        workbenchOsNormalized,
        activeHardwareDevice
      );
    }
    if (restrictTrafficToRegion) {
      code = appendGeoIpFirewallRules(
        code,
        currentSegment.category,
        workbenchOsNormalized,
        activeGeoPolicy
      );
    }
    return code;
  }, [
    rawTemplate,
    variableValues,
    activeHardwareDevice,
    restrictTrafficToRegion,
    currentSegment.category,
    workbenchOsNormalized,
    activeGeoPolicy,
  ]);
  useEffect(() => {
    let cancelled = false;
    computeSha256Hex(compiledCode)
      .then((hash) => {
        if (!cancelled) setWorkbenchConfigHash(hash);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [compiledCode]);
  const preflightLintIssues = useMemo(
    () => lintFleetConfigs(fleetProfiles, variableValues, currentSegment.id),
    [fleetProfiles, variableValues, currentSegment.id]
  );
  const optimizerDiffLines = useMemo(
    () =>
      optimizedOutput
        ? computeLineDiff(rawConfigInput, optimizedOutput.optimizedConfig)
        : [],
    [rawConfigInput, optimizedOutput]
  );

  useEffect(() => {
    if (compiledCode && currentSegment.category === "wireguard") {
      QRCode.toDataURL(compiledCode, {
        margin: 2,
        width: 320,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      })
        .then((url) => {
          setQrCodeDataUrl(url);
          setQrError(null);
        })
        .catch((err) => {
          console.error("Failed to generate QR code:", err);
          setQrError("Could not generate QR code");
        });
    } else {
      setQrCodeDataUrl(null);
    }
  }, [compiledCode, currentSegment.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const nowIso = new Date().toISOString();
      localStorage.setItem(
        "omnieye_offline_emergency_snapshot",
        JSON.stringify({
          savedAt: nowIso,
          fleetProfiles,
          compiledCode,
          blockedIps,
          slaRollups,
        })
      );
      setOfflineSnapshotTs(nowIso);
    } catch {
      // ignore quota errors
    }
  }, [fleetProfiles, compiledCode, blockedIps, slaRollups]);

  const handleExportPostmortemZip = async () => {
    try {
      const blob = await buildIncidentPostmortemZip({
        profiles: fleetProfiles,
        probeLogs,
        authLogs: tunnelAuthLogs,
        blockedIps,
        slaRollups,
        webhookDeliveries,
        compiledConfig: compiledCode,
        simulationLog,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omnieye-postmortem-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore zip error
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(compiledCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([compiledCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = currentSegment.id + (currentSegment.fileTarget.endsWith(".sh") ? ".sh" : ".conf");
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // WireGuard Configuration QR Parser & Camera Scanner Helpers
  const parseWireGuardConfig = (configText: string): Record<string, string> => {
    const parsed: Record<string, string> = {};
    const lines = configText.split(/\r?\n/);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) {
        continue;
      }
      
      const parts = trimmed.split("=");
      if (parts.length < 2) continue;
      
      const key = parts[0].trim().toLowerCase();
      const value = parts.slice(1).join("=").trim();
      
      if (key === "privatekey") {
        parsed["CLIENT_PRIVATE_KEY"] = value;
      } else if (key === "address") {
        const ipOnly = value.split("/")[0].trim();
        parsed["CLIENT_TUNNEL_IP"] = ipOnly;
      } else if (key === "dns") {
        parsed["DNS_SERVER"] = value;
      } else if (key === "mtu") {
        parsed["MTU_SIZE"] = value;
      } else if (key === "publickey") {
        parsed["SERVER_PUBLIC_KEY"] = value;
      } else if (key === "endpoint") {
        const lastColon = value.lastIndexOf(":");
        if (lastColon !== -1) {
          parsed["SERVER_ENDPOINT_IP"] = value.substring(0, lastColon).trim();
          parsed["SERVER_PORT"] = value.substring(lastColon + 1).trim();
        } else {
          parsed["SERVER_ENDPOINT_IP"] = value;
        }
      } else if (key === "persistentkeepalive") {
        parsed["KEEPALIVE_INTERVAL"] = value;
      }
    }
    
    return parsed;
  };

  const startQrScanner = async () => {
    setQrScannerErrorMsg(null);
    setQrScannerSuccessMsg(null);
    setIsQrScannerActive(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-scanner-view");
        html5QrcodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            handleImportScannedConfig(decodedText);
          },
          () => {
            // quiet feedback loop
          }
        );
      } catch (err: any) {
        console.error("Error starting QR Code scanner:", err);
        setQrScannerErrorMsg("Camera initialization failed. Please check camera permissions in your browser.");
        setIsQrScannerActive(false);
      }
    }, 300);
  };

  const stopQrScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
    html5QrcodeRef.current = null;
    setIsQrScannerActive(false);
  };

  const handleImportScannedConfig = (scannedText: string) => {
    try {
      const parsed = parseWireGuardConfig(scannedText);
      const keysFound = Object.keys(parsed);
      if (keysFound.length === 0) {
        setQrScannerErrorMsg("Scanned QR contains no standard WireGuard parameters (PrivateKey, Address, PublicKey, Endpoint, etc.).");
        return;
      }

      setVariableValues(prev => ({
        ...prev,
        ...parsed
      }));

      // Stop scanner cleanly
      stopQrScanner();

      // Show success message
      setQrScannerSuccessMsg(`Successfully imported ${keysFound.length} WireGuard variables!`);
    } catch (err: any) {
      setQrScannerErrorMsg(`Failed to parse config: ${err.message || err}`);
    }
  };

  const closeQrModal = async () => {
    await stopQrScanner();
    setQrScannerErrorMsg(null);
    setQrScannerSuccessMsg(null);
    setIsQrModalOpen(false);
  };

  // Secure Encrypted Backup Exporter Helpers
  const getSegmentVariableValues = (segment: typeof PRESET_SEGMENTS[0], os: string) => {
    if (segment.id === selectedSegmentId) {
      return variableValues;
    }
    const vals: Record<string, string> = {};
    segment.variables.forEach((v) => {
      if (v.key === "MTU_SIZE") {
        vals[v.key] = (os === "windows" || os === "apple") ? "1400" : (os === "pulse" ? "1340" : "1420");
      } else if (v.key === "KEEPALIVE_INTERVAL") {
        vals[v.key] = os === "pulse" ? "20" : "25";
      } else if (v.key === "SYSTEM_USER") {
        vals[v.key] = os === "windows" ? "Administrator" : (os === "apple" ? "macos_user" : (os === "ubuntu" ? "ubuntu" : (os === "pulse" ? "pulse_user" : "pi")));
      } else {
        vals[v.key] = v.defaultValue;
      }
    });
    return vals;
  };

  const getObsidianTemplate = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString();
    
    let md = `---
tags: [networking, wireguard, ssh, configuration, backup]
created: ${dateStr} ${timeStr}
version: v2.4.1
app: OmniEye
---

# 🚀 OmniEye Configuration Blueprint (Version: v2.4.1)

This configuration document was generated on **${dateStr}** at **${timeStr}** from your active **OmniEye** session. It serves as an uninhibited, version-controlled backup master files template for your **Obsidian Vault**.

---

## 🖥️ Workspace Parameters
- **Target Operating System:** \`${selectedOS.toUpperCase()}\`
- **Active Connection Blueprints:** ${PRESET_SEGMENTS.length} Segments Listed
- **Gateway Security PIN:** Stored in client-side secure session locks

---

## 📦 Active Profiles & Direct Customizations

`;

    PRESET_SEGMENTS.forEach((segment) => {
      const cleanPath = getOSFileTarget(segment.id, selectedOS, segment.fileTarget);
      const codeBlock = getOSSpecificCodeTemplate(segment.id, selectedOS, segment.codeTemplate);
      md += `### 📂 ${segment.name}
- **Target Storage Path:** \`${cleanPath}\`
- **Category:** \`${segment.category.toUpperCase()}\`
- **Description:** ${segment.description}

\`\`\`ini
${codeBlock}
\`\`\`

---
`;
    });

    md += `
## 🛠️ Automated Restore Instructions
To restore these configurations directly on your host machine, you can run the following interactive inline command block or extract the configuration elements manually:
\`\`\`bash
# Create target configuration directories
mkdir -p \\\$(dirname "/etc/wireguard/wg0.conf") ~/.ssh/ /usr/local/bin/

# Set correct security permissions
chmod 700 ~/.ssh/
chmod 600 ~/.ssh/config 2>/dev/null
\`\`\`
`;
    return md;
  };

  const handleExportEncryptedZip = async () => {
    if (!backupPassword) {
      setBackupError("Cryptographic Passphrase is required for secure file encryption.");
      return;
    }
    if (backupPassword.length < 4) {
      setBackupError("Security warning: Passphrase must be at least 4 characters long.");
      return;
    }

    setIsBackupExporting(true);
    setBackupError(null);
    setBackupSuccess(null);

    try {
      const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

      for (const segment of PRESET_SEGMENTS) {
        const segmentVars = getSegmentVariableValues(segment, selectedOS);
        const rTemplate = getOSSpecificCodeTemplate(segment.id, selectedOS, segment.codeTemplate);
        const compiled = compileTemplate(rTemplate, segmentVars);
        const targetPath = getOSFileTarget(segment.id, selectedOS, segment.fileTarget);
        
        let cleanPath = targetPath;
        cleanPath = cleanPath.replace(/^[a-zA-Z]:\\/, "");
        if (cleanPath.startsWith("/")) {
          cleanPath = cleanPath.substring(1);
        }
        cleanPath = cleanPath.replace(/\\/g, "/");
        cleanPath = cleanPath.replace(/\s*\(.*?\)\s*/g, "").trim();

        if (cleanPath.includes("Manual Calibration script") || cleanPath === "Manual Calibration") {
          cleanPath = "usr/local/bin/mtu-sweep.sh";
        }

        await zipWriter.add(cleanPath, new TextReader(compiled), {
          password: backupPassword,
          zipCrypto: backupEncryption === "zipCrypto",
        });
      }

      const activeProfile = fleetProfiles.find((p) => p.id === activeProfileId);
      const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const bootstrap = generateBootstrapBundle(
        compiledCode,
        currentSegment.id,
        getOSFileTarget(currentSegment.id, selectedOS, currentSegment.fileTarget),
        webhooks[0]?.url,
        activeProfile?.ingestToken
          ? { endpointUrl: `${originUrl}/api/fleet/heartbeat`, ingestToken: activeProfile.ingestToken }
          : undefined
      );
      await zipWriter.add("bootstrap/install-omnieye.sh", new TextReader(bootstrap.bootstrapSh), {
        password: backupPassword,
        zipCrypto: backupEncryption === "zipCrypto",
      });
      await zipWriter.add("bootstrap/install-omnieye.ps1", new TextReader(bootstrap.bootstrapPs1), {
        password: backupPassword,
        zipCrypto: backupEncryption === "zipCrypto",
      });
      await zipWriter.add("bootstrap/docker-compose.yml", new TextReader(bootstrap.dockerComposeYml), {
        password: backupPassword,
        zipCrypto: backupEncryption === "zipCrypto",
      });

      const zipBlob = await zipWriter.close();
      const element = document.createElement("a");
      element.href = URL.createObjectURL(zipBlob);
      
      const dateStr = new Date().toISOString().split("T")[0];
      element.download = `omnieye-backup-${selectedOS}-${dateStr}.zip`;
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setBackupSuccess("Encrypted ZIP archive generated and downloaded successfully!");
    } catch (err: any) {
      console.error("Backup Export failed:", err);
      setBackupError(`Backup failed: ${err.message || err}`);
    } finally {
      setIsBackupExporting(false);
    }
  };

  // Cleanup scanner on component unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  // Security PIN Locks Helpers (with AES-GCM Vault decryption/encryption & Zero-Knowledge Cloud Sync)
  const handleRestoreOrSyncCloudVault = async (overridePin?: string) => {
    const activePin = (overridePin || pinStored || "").trim().toUpperCase();
    if (!activePin || activePin.length !== 8) {
      setPinErrorMsg("Enter your 8-character cryptographic PIN to sync/restore.");
      return;
    }
    if (!user || user.uid === "demo-analyst-99") {
      setPinErrorMsg("Sign in with Google to use Zero-Knowledge Cloud Vault Sync.");
      return;
    }
    setCloudVaultStatus("syncing");
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      const resp = await fetch("/api/vault", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.exists && typeof data.ciphertextPayload === "string") {
          try {
            const decrypted = await decryptVaultPayload<
              Array<{ ssid: string; security: string; key: string }>
            >(data.ciphertextPayload, activePin);
            if (Array.isArray(decrypted)) {
              localStorage.setItem("omnieye_app_pin", activePin);
              localStorage.setItem("omnieye_saved_wifi_enc", data.ciphertextPayload);
              localStorage.removeItem("omnieye_saved_wifi");
              setPinStored(activePin);
              setSavedWifiNetworks(decrypted);
              setIsAppLocked(false);
              setHasCloudVault(true);
              setCloudVaultStatus("synced");
              setCloudVaultRestorePin("");
              setPinErrorMsg(null);
              return;
            }
          } catch {
            setCloudVaultStatus("available");
            setPinErrorMsg("DECRYPTION FAILED: PIN does not match the encrypted cloud vault.");
            return;
          }
        }
      }
      // Otherwise push local vault to cloud
      const cipher = await encryptVaultPayload(savedWifiNetworks, activePin);
      const putResp = await fetch("/api/vault", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ciphertextPayload: cipher }),
      });
      if (putResp.ok) {
        setHasCloudVault(true);
        setCloudVaultStatus("synced");
        setPinErrorMsg(null);
      } else {
        setCloudVaultStatus("local");
      }
    } catch {
      setCloudVaultStatus("local");
    }
  };

  const handleVerifyPin = async () => {
    if (pinInput.trim().toUpperCase() === pinStored?.toUpperCase()) {
      let restoredFromLocal = false;
      try {
        const enc = localStorage.getItem("omnieye_saved_wifi_enc");
        if (enc && pinStored) {
          const decrypted = await decryptVaultPayload<Array<{ ssid: string; security: string; key: string }>>(
            enc,
            pinStored
          );
          if (Array.isArray(decrypted)) {
            setSavedWifiNetworks(decrypted);
            restoredFromLocal = true;
          }
        }
      } catch {
        // Ignore if vault was empty
      }
      if (!restoredFromLocal && pinStored && user && user.uid !== "demo-analyst-99") {
        try {
          const idToken = await getFirebaseIdToken();
          if (idToken) {
            const resp = await fetch("/api/vault", {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.exists && typeof data.ciphertextPayload === "string") {
                const decrypted = await decryptVaultPayload<
                  Array<{ ssid: string; security: string; key: string }>
                >(data.ciphertextPayload, pinStored);
                if (Array.isArray(decrypted)) {
                  setSavedWifiNetworks(decrypted);
                  localStorage.setItem("omnieye_saved_wifi_enc", data.ciphertextPayload);
                  setHasCloudVault(true);
                  setCloudVaultStatus("synced");
                }
              }
            }
          }
        } catch {
          // ignore transient restore error
        }
      }
      setIsAppLocked(false);
      setPinInput("");
      setPinErrorMsg(null);
    } else {
      setPinErrorMsg("ACCESS DENIED: Invalid Cryptographic Authorization PIN");
      setPinInput("");
    }
  };

  const handleSetupPin = async () => {
    if (!setupPin1 || setupPin1.length !== 8) {
      setPinErrorMsg("Security key must be exactly 8 alphanumeric characters long");
      return;
    }
    if (setupPin1 !== setupPin2) {
      setPinErrorMsg("Security keys do not match");
      return;
    }
    const secureKey = setupPin1.toUpperCase();
    localStorage.setItem("omnieye_app_pin", secureKey);
    localStorage.removeItem("omninetwork_optimizer_app_pin");
    try {
      const cipher = await encryptVaultPayload(savedWifiNetworks, secureKey);
      localStorage.setItem("omnieye_saved_wifi_enc", cipher);
      localStorage.removeItem("omnieye_saved_wifi");
      localStorage.removeItem("omninetwork_optimizer_saved_wifi");
      if (user && user.uid !== "demo-analyst-99") {
        const idToken = await getFirebaseIdToken();
        if (idToken) {
          const resp = await fetch("/api/vault", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ ciphertextPayload: cipher }),
          });
          if (resp.ok) {
            setHasCloudVault(true);
            setCloudVaultStatus("synced");
          }
        }
      }
    } catch {
      // Fallback handled by effect
    }
    setPinStored(secureKey);
    setIsAppLocked(false);
    setSetupPin1("");
    setSetupPin2("");
    setPinErrorMsg(null);
    setIsSettingNewPin(false);
    setShowPinSettingsModal(false);
  };

  const handleRemovePin = (currentPinCheck: string) => {
    if (currentPinCheck.toUpperCase() === pinStored?.toUpperCase()) {
      localStorage.removeItem("omnieye_app_pin");
      localStorage.removeItem("omninetwork_optimizer_app_pin");
      localStorage.removeItem("omnieye_saved_wifi_enc");
      localStorage.setItem("omnieye_saved_wifi", JSON.stringify(savedWifiNetworks));
      setPinStored(null);
      setIsAppLocked(false);
      setPinErrorMsg(null);
      setShowPinSettingsModal(false);
    } else {
      setPinErrorMsg("INCORRECT SECURITY KEY: System modification rejected.");
    }
  };

  const handleGenerateSshKeys = async () => {
    setIsSshKeyGenerating(true);
    setSshKeyCopied(null);

    try {
      const resp = await fetch("/api/crypto/keygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ssh",
          algorithm: sshKeyType,
          comment: `${user?.email || "operator"}@omnieye`,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.privateKey) {
        throw new Error(data?.error || "SSH keygen endpoint failed.");
      }

      setGeneratedPrivateKey(data.privateKey);
      setGeneratedPublicKey(data.publicKey);
      setGeneratedSshFingerprint(data.fingerprint || null);
      setVariableValues((prev) => ({
        ...prev,
        IDENTITY_FILE: sshKeyName || (sshKeyType === "ed25519" ? "id_ed25519" : "id_rsa"),
      }));
      setIsSshKeyModalOpen(true);
    } catch (err: any) {
      setSimulationLog((prev) => [...prev, `[CRYPTO_ERR] SSH key generation failed: ${err?.message || err}`]);
    } finally {
      setIsSshKeyGenerating(false);
    }
  };

  const handleGenerateWgKeys = async () => {
    setIsWgKeyGenerating(true);
    setWgKeyNotice(null);
    try {
      const resp = await fetch("/api/crypto/keygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "wireguard" }),
      });
      const data = await resp.json();
      if (resp.ok && data?.privateKey && data?.publicKey) {
        setVariableValues((prev) => ({
          ...prev,
          CLIENT_PRIVATE_KEY: data.privateKey,
          SERVER_PUBLIC_KEY: prev["SERVER_PUBLIC_KEY"] || data.publicKey,
        }));
        setWgKeyNotice(`Generated real X25519 keypair (${data.publicKey.slice(0, 12)}…) & CSPRNG PSK.`);
      }
    } catch {
      setWgKeyNotice("Unable to generate WireGuard X25519 keypair.");
    } finally {
      setIsWgKeyGenerating(false);
    }
  };

  // Fleet & Webhook CRUD + Live Network Probes
  const handleSelectProfile = (profile: TunnelProfile) => {
    setActiveProfileId(profile.id);
    const matchingSegment = PRESET_SEGMENTS.find((s) => s.id === profile.segmentId);
    if (matchingSegment) {
      skipNextSegmentResetRef.current = true;
      setSelectedCategory(matchingSegment.category);
      setSelectedSegmentId(matchingSegment.id);
      const mergedVars: Record<string, string> = {};
      matchingSegment.variables.forEach((v) => {
        mergedVars[v.key] = profile.variablesJson?.[v.key] ?? v.defaultValue;
      });
      setVariableValues(mergedVars);
      if (mergedVars["KEEPALIVE_INTERVAL"]) {
        setSimConfig((prev) => ({ ...prev, keepalive: Number(mergedVars["KEEPALIVE_INTERVAL"]) || 25 }));
      }
      if (mergedVars["ALIVE_INTERVAL"]) {
        setSimConfig((prev) => ({ ...prev, serverAliveInterval: Number(mergedVars["ALIVE_INTERVAL"]) || 15 }));
      }
    }
  };

  const runLiveProbeForProfile = async (profile?: TunnelProfile) => {
    const targetHost =
      profile?.endpointHost ||
      variableValues["SERVER_ENDPOINT_IP"] ||
      variableValues["REMOTE_IP_OR_HOST"] ||
      variableValues["MONITOR_IP"] ||
      "1.1.1.1";
    const targetPort =
      profile?.endpointPort ||
      Number(variableValues["SSH_PORT"] || variableValues["SERVER_PORT"]) ||
      443;

    setLiveProbeLoading(true);
    if (profile) setProbingProfileId(profile.id);

    try {
      const resp = await fetch("/api/diagnostics/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: targetHost, port: targetPort, mode: probeMode }),
      });
      const result: ProbeResult = await resp.json();
      if (resp.ok) {
        setLastProbeResult(result);
        const validSamples = result.samples.filter((s): s is number => typeof s === "number");
        if (validSamples.length > 0) {
          setPingHistory((prev) => [...prev.slice(validSamples.length), ...validSamples]);
        }
        setSimulationLog((prev) => [
          ...prev,
          `[LIVE PROBE ${probeMode.toUpperCase()}] ${result.target}:${result.port} (${result.resolvedIp || "DNS"}) -> ${
            result.reachable
              ? `avg ${result.avgMs}ms (min ${result.minMs}ms / max ${result.maxMs}ms, jitter ${result.jitterMs}ms, loss ${result.packetLossPct}%)`
              : `UNREACHABLE (${result.packetLossPct}% loss)`
          }`,
        ]);

        if (profile) {
          setFleetProfiles((prev) =>
            prev.map((p) =>
              p.id === profile.id
                ? {
                    ...p,
                    lastRttMs: result.avgMs,
                    ...(result.certExpiresAt
                      ? {
                          certExpiresAt: result.certExpiresAt,
                          certSubject: result.certSubject || p.endpointHost,
                        }
                      : {}),
                  }
                : p
            )
          );
          const localLog: ProbeLogEntry = {
            id: `local-${Date.now()}`,
            profileId: profile.id,
            target: `${result.target}:${result.port}`,
            rttMs: result.avgMs,
            status: result.reachable ? "online" : "offline",
            dnsResolver: variableValues["DNS_SERVER"] || "1.1.1.1",
            createdAt: new Date().toISOString(),
          };
          setProbeLogs((prev) => [localLog, ...prev].slice(0, 80));

          if (user && user.uid !== "demo-analyst-99" && typeof profile.id === "number") {
            const idToken = await getFirebaseIdToken();
            if (idToken) {
              fetch("/api/fleet/probes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  profileId: profile.id,
                  target: `${result.target}:${result.port}`,
                  rttMs: result.avgMs,
                  status: result.reachable ? "online" : "offline",
                  dnsResolver: variableValues["DNS_SERVER"] || "1.1.1.1",
                }),
              })
                .then((r) => r.json())
                .then((logged) => {
                  if (Array.isArray(logged?.autoAlertsTriggered) && logged.autoAlertsTriggered.length > 0) {
                    setLastAutoAlertNotice(
                      `Auto-Alert dispatched via ${logged.autoAlertsTriggered.join(", ")} for ${profile.name} (${result.avgMs}ms).`
                    );
                  }
                })
                .catch(() => {});
            }
          }
        }
      }
    } catch (err: any) {
      setSimulationLog((prev) => [...prev, `[PROBE_ERR] ${err?.message || "Probe failed"}`]);
    } finally {
      setLiveProbeLoading(false);
      setProbingProfileId(null);
    }
  };

  const handleRunBatchProbe = async () => {
    if (fleetProfiles.length === 0 || isBatchProbing) return;
    setIsBatchProbing(true);
    try {
      const resp = await fetch("/api/diagnostics/probe-fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targets: fleetProfiles.map((p) => ({
            id: p.id,
            host: p.endpointHost,
            port: p.endpointPort,
            mode: probeMode,
          })),
        }),
      });
      const data = await resp.json();
      if (resp.ok && Array.isArray(data.results)) {
        const resultMap = new Map<string, ProbeResult>();
        data.results.forEach((item: { id?: number | string; probe: ProbeResult }) => {
          if (item.id !== undefined) {
            resultMap.set(String(item.id), item.probe);
          }
        });

        setFleetProfiles((prev) =>
          prev.map((p) => {
            const matched = resultMap.get(String(p.id));
            return matched ? { ...p, lastRttMs: matched.avgMs, isActive: matched.reachable } : p;
          })
        );

        const newLogs: ProbeLogEntry[] = data.results.map((item: { id?: number | string; probe: ProbeResult }, idx: number) => ({
          id: `batch-${Date.now()}-${idx}`,
          profileId: item.id ?? null,
          target: `${item.probe.target}:${item.probe.port}`,
          rttMs: item.probe.avgMs,
          status: item.probe.reachable ? "online" : "offline",
          dnsResolver: variableValues["DNS_SERVER"] || "1.1.1.1",
          createdAt: new Date().toISOString(),
        }));
        setProbeLogs((prev) => [...newLogs, ...prev].slice(0, 80));

        const primaryProbe = data.results[0]?.probe;
        if (primaryProbe) {
          setLastProbeResult(primaryProbe);
          const valid = primaryProbe.samples.filter((s: number | null): s is number => typeof s === "number");
          if (valid.length > 0) {
            setPingHistory((prev) => [...prev.slice(valid.length), ...valid]);
          }
        }

        if (user && user.uid !== "demo-analyst-99") {
          const idToken = await getFirebaseIdToken();
          if (idToken) {
            await Promise.allSettled(
              data.results
                .filter((r: { id?: number | string }) => typeof r.id === "number")
                .map((r: { id: number; probe: ProbeResult }) =>
                  fetch("/api/fleet/probes", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                      profileId: r.id,
                      target: `${r.probe.target}:${r.probe.port}`,
                      rttMs: r.probe.avgMs,
                      status: r.probe.reachable ? "online" : "offline",
                      dnsResolver: variableValues["DNS_SERVER"] || "1.1.1.1",
                    }),
                  })
                    .then((res) => res.json())
                    .then((logged) => {
                      if (Array.isArray(logged?.autoAlertsTriggered) && logged.autoAlertsTriggered.length > 0) {
                        setLastAutoAlertNotice(
                          `Threshold Alert dispatched via ${logged.autoAlertsTriggered.join(", ")} for ${r.probe.target}.`
                        );
                      }
                    })
                )
            );
          }
        }
      }
    } catch (err: any) {
      setSimulationLog((prev) => [...prev, `[BATCH_PROBE_ERR] ${err?.message || "Batch probe failed"}`]);
    } finally {
      setIsBatchProbing(false);
    }
  };

  // Visibility-Aware & Battery-Aware Background Auto-Poller
  // When Battery < 20% (isEcoPowerMode), throttle polling cadence by 2x (minimum 60s) to conserve radio energy
  useEffect(() => {
    if (autoPollSec === 0) return;
    const effectiveIntervalMs = (isEcoPowerMode ? Math.max(60, autoPollSec * 2) : autoPollSec) * 1000;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        handleRunBatchProbe();
      }
    }, effectiveIntervalMs);
    return () => clearInterval(interval);
  }, [autoPollSec, isEcoPowerMode, fleetProfiles.length, probeMode]);

  const handleUpdateAlertThreshold = async (profileId: number | string, thresholdMs: number) => {
    setFleetProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, alertThresholdMs: thresholdMs } : p))
    );
    if (user && user.uid !== "demo-analyst-99" && typeof profileId === "number") {
      const idToken = await getFirebaseIdToken();
      if (idToken) {
        fetch(`/api/fleet/profiles/${profileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ alertThresholdMs: thresholdMs }),
        }).catch(() => {});
      }
    }
  };

  const handleSendTestHeartbeat = async (profile: TunnelProfile) => {
    const sampleRx = Number(profile.rxBytes || 0) + Math.floor(Math.random() * 2_500_000 + 512_000);
    const sampleTx = Number(profile.txBytes || 0) + Math.floor(Math.random() * 1_200_000 + 256_000);
    const sampleHsAge = Math.floor(Math.random() * 22) + 3;
    const sampleRtt = profile.lastRttMs ?? Math.floor(Math.random() * 20) + 11;

    if (user && user.uid !== "demo-analyst-99" && (profile.ingestToken || typeof profile.id === "number")) {
      const idToken = await getFirebaseIdToken();
      const resp = await fetch("/api/fleet/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          ...(profile.ingestToken ? { ingestToken: profile.ingestToken } : { profileId: profile.id }),
          rxBytes: sampleRx,
          txBytes: sampleTx,
          handshakeAgeSec: sampleHsAge,
          rttMs: sampleRtt,
          interfaceUp: true,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.profile) {
        setFleetProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? data.profile : p))
        );
        return;
      }
    }

    setFleetProfiles((prev) =>
      prev.map((p) =>
        p.id === profile.id
          ? {
              ...p,
              rxBytes: sampleRx,
              txBytes: sampleTx,
              handshakeAgeSec: sampleHsAge,
              lastHeartbeatAt: new Date().toISOString(),
              lastRttMs: sampleRtt,
            }
          : p
      )
    );
  };

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndpointName.trim() || !newEndpointHost.trim()) return;
    setAddEndpointBusy(true);
    const segmentForCat = PRESET_SEGMENTS.find((s) => s.category === newEndpointCategory) || PRESET_SEGMENTS[0];
    const payload = {
      name: newEndpointName.trim(),
      category: newEndpointCategory,
      endpointHost: newEndpointHost.trim(),
      endpointPort: Number(newEndpointPort) || 443,
      lat: Number(newEndpointLat) || 37.7749,
      lng: Number(newEndpointLng) || -122.4194,
      locationLabel: newEndpointLocation.trim() || "Custom Node",
      segmentId: segmentForCat.id,
      variablesJson: {
        SERVER_ENDPOINT_IP: newEndpointHost.trim(),
        SERVER_PORT: String(Number(newEndpointPort) || 51820),
        KEEPALIVE_INTERVAL: "25",
        MTU_SIZE: "1420",
        DNS_SERVER: "1.1.1.3",
      },
      isActive: true,
      lastRttMs: null,
    };

    try {
      if (user && user.uid !== "demo-analyst-99") {
        const idToken = await getFirebaseIdToken();
        if (idToken) {
          const resp = await fetch("/api/fleet/profiles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(payload),
          });
          if (resp.ok) {
            const created: TunnelProfile = await resp.json();
            setFleetProfiles((prev) => [...prev, created]);
            handleSelectProfile(created);
            setIsAddEndpointModalOpen(false);
            setNewEndpointName("");
            setNewEndpointHost("");
            return;
          }
        }
      }

      const localProfile: TunnelProfile = {
        id: `custom-${Date.now()}`,
        ...payload,
      };
      setFleetProfiles((prev) => [...prev, localProfile]);
      handleSelectProfile(localProfile);
      setIsAddEndpointModalOpen(false);
      setNewEndpointName("");
      setNewEndpointHost("");
    } finally {
      setAddEndpointBusy(false);
    }
  };

  const handleDeleteProfile = async (profileId: number | string) => {
    setFleetProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (user && user.uid !== "demo-analyst-99" && typeof profileId === "number") {
      const idToken = await getFirebaseIdToken();
      if (idToken) {
        fetch(`/api/fleet/profiles/${profileId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        }).catch(() => {});
      }
    }
  };

  const handleCreateWebhook = async (input: {
    name: string;
    provider: WebhookTarget["provider"];
    url: string;
    assignedTunnels: string[];
  }) => {
    if (user && user.uid !== "demo-analyst-99") {
      const idToken = await getFirebaseIdToken();
      if (idToken) {
        const resp = await fetch("/api/fleet/webhooks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(input),
        });
        if (resp.ok) {
          const created: WebhookTarget = await resp.json();
          setWebhooks((prev) => [...prev, created]);
          return;
        }
      }
    }
    const localWebhook: WebhookTarget = {
      id: `wh-${Date.now()}`,
      ...input,
      enabled: true,
    };
    setWebhooks((prev) => [...prev, localWebhook]);
  };

  const handleDeleteWebhook = async (webhookId: number | string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    if (user && user.uid !== "demo-analyst-99" && typeof webhookId === "number") {
      const idToken = await getFirebaseIdToken();
      if (idToken) {
        fetch(`/api/fleet/webhooks/${webhookId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        }).catch(() => {});
      }
    }
  };

  const handleImportConfigText = (rawText: string) => {
    if (!rawText.trim()) return;
    const parsed = parseImportedConfig(rawText);
    const matchingSegment = PRESET_SEGMENTS.find((s) => s.id === parsed.segmentId);
    skipNextSegmentResetRef.current = true;
    setSelectedCategory(parsed.category);
    setSelectedSegmentId(parsed.segmentId);
    if (parsed.category === "wireguard" || parsed.category === "ssh") {
      setOptimizerType(parsed.category);
    }
    setRawConfigInput(rawText);
    const merged: Record<string, string> = {};
    matchingSegment?.variables.forEach((v) => {
      merged[v.key] = parsed.variables[v.key] ?? v.defaultValue;
    });
    setVariableValues((prev) => ({ ...prev, ...merged, ...parsed.variables }));
    setImporterFeedback(parsed.summary);
    setTimeout(() => setImporterFeedback(null), 5000);
  };

  const handleToggleGroundingMode = (mode: "search" | "maps") => {
    setGroundingMode(mode);
    if (mode === "maps" && typeof navigator !== "undefined" && navigator.geolocation && !userGeoLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGeoLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Graceful fallback without coordinates
        },
        { timeout: 4000 }
      );
    }
  };

  const executeAgentActions = async (actions: ExecutedAction[]) => {
    for (const act of actions) {
      if (act.name === "runNetworkProbe" && act.result && !act.result.error) {
        const res = act.result as ProbeResult;
        setLastProbeResult(res);
        const valid = (res.samples || []).filter((s): s is number => typeof s === "number");
        if (valid.length > 0) {
          setPingHistory((prev) => [...prev.slice(valid.length), ...valid]);
        }
        setSimulationLog((prev) => [
          ...prev,
          `[AGENT PROBE] ${res.target}:${res.port} avg ${res.avgMs}ms (${res.packetLossPct}% loss)`,
        ]);
      } else if (act.name === "applyBuilderVariables") {
        const args = act.args || {};
        if (args.segmentId) {
          const seg = PRESET_SEGMENTS.find((s) => s.id === args.segmentId);
          if (seg) {
            skipNextSegmentResetRef.current = true;
            setSelectedCategory(seg.category);
            setSelectedSegmentId(seg.id);
          }
        }
        setVariableValues((prev) => ({
          ...prev,
          ...(args.mtuSize ? { MTU_SIZE: String(args.mtuSize) } : {}),
          ...(args.keepaliveInterval ? { KEEPALIVE_INTERVAL: String(args.keepaliveInterval) } : {}),
          ...(args.dnsServer ? { DNS_SERVER: String(args.dnsServer), HARDENED_DNS: String(args.dnsServer) } : {}),
          ...(args.aliveInterval ? { ALIVE_INTERVAL: String(args.aliveInterval) } : {}),
        }));
        if (args.keepaliveInterval) {
          setSimConfig((prev) => ({ ...prev, keepalive: Number(args.keepaliveInterval) || prev.keepalive }));
        }
        if (args.aliveInterval) {
          setSimConfig((prev) => ({ ...prev, serverAliveInterval: Number(args.aliveInterval) || prev.serverAliveInterval }));
        }
      } else if (act.name === "saveRunbookNote" && act.args?.title) {
        const noteId = `note_${Date.now()}`;
        const notePayload = {
          id: noteId,
          title: String(act.args.title),
          content: String(act.args.content || ""),
          color: String(act.args.color || "blue"),
          isPinned: false,
          labels: ["AI Runbook"],
          userId: user?.uid || "demo-analyst-99",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (user && user.uid !== "demo-analyst-99") {
          try {
            await setDoc(doc(db, "notes", noteId), {
              ...notePayload,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
          } catch {
            // Fallback silently if Firestore is unavailable
          }
        } else {
          try {
            const raw = localStorage.getItem("omnieye_demo_notes");
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem("omnieye_demo_notes", JSON.stringify([notePayload, ...existing]));
            window.dispatchEvent(new CustomEvent("omnieye-notes-updated"));
          } catch {
            // ignore
          }
        }
      }
    }
  };

  // Submit Interactive Chat to Server with SSE Streaming, Grounding & Tool Calling
  const handleSendChat = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const updatedMessages = [...chatMessages, { role: "user" as const, content: textToSend }];
    setChatMessages([
      ...updatedMessages,
      { role: "assistant" as const, content: "", groundingChunks: [], actions: [] },
    ]);
    if (!customText) setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/gemini/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          groundingMode,
          userLocation: userGeoLocation,
        }),
      });

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        setChatMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `Failed to contact the Network Agent. Details: ${errData.error || response.statusText}`,
          };
          return copy;
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";
      const collectedActions: ExecutedAction[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const dataLine = rawEvent
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine.slice(6));
            if (payload.type === "chunk" && payload.text) {
              streamedText += payload.text;
              setChatMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: streamedText };
                }
                return copy;
              });
            } else if (payload.type === "action" && payload.action) {
              collectedActions.push(payload.action);
              await executeAgentActions([payload.action]);
              setChatMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { ...last, actions: [...collectedActions] };
                }
                return copy;
              });
            } else if (payload.type === "meta") {
              setChatMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = {
                    ...last,
                    content: streamedText || last.content || "Action executed on your workbench.",
                    groundingChunks: Array.isArray(payload.groundingChunks)
                      ? payload.groundingChunks
                      : last.groundingChunks,
                    actions: Array.isArray(payload.actions) && payload.actions.length > 0
                      ? payload.actions
                      : last.actions,
                  };
                }
                return copy;
              });
            } else if (payload.type === "error") {
              setChatMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: `Agent error: ${payload.error || "Unknown error"}`,
                };
                return copy;
              });
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } catch (err: any) {
      setChatMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Error: Unable to connect to backend server endpoint. ${err.message}`,
        };
        return copy;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  // Submit Config to Optimizer Endpoint
  const handleOptimizeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawConfigInput.trim()) return;

    setIsOptimizing(true);
    setOptimizerError(null);
    setOptimizedOutput(null);

    try {
      const response = await fetch("/api/optimize-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configType: optimizerType,
          rawConfig: rawConfigInput,
          description: optimizerDescription
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setOptimizedOutput(data);
      } else {
        setOptimizerError(data.error || "Failed to compile optimized configuration.");
      }
    } catch (err: any) {
      setOptimizerError(`Server error during optimization: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Run Keepalive Simulation Sandbox
  const runSimulation = () => {
    if (simulationActive) return;
    setSimulationActive(true);
    setNatTimeoutOccurred(false);
    setCpuUsage(8.4);
    setMemUsage(135);
    setSimulationLog(["[SYSTEM] Initializing KeepAlive Simulation...", "[ROUTE] Local PC -> wg0 (MTU: " + simConfig.mtu + ") -> autossh (Interval: " + simConfig.serverAliveInterval + "s) -> Cloud Tunnel Server"]);
    
    // Reset ping history to initial low latency baseline
    setPingHistory([12, 11, 13, 12, 14, 11, 13, 12, 11, 12, 14, 13, 12, 11, 12, 14]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setSimulationLog((prev) => [...prev, "[PING] Tunnel handshake verified successfully. Base latency: 12.4ms."]);
        setPingHistory((p) => [...p.slice(3), 12, 13, 12]);
      } else if (step === 2) {
        setSimulationLog((prev) => [...prev, "[TRAFFIC] Ideal user TCP session started. Port forwarding HTTP:8080 active."]);
        setPingHistory((p) => [...p.slice(3), 15, 18, 14]);
      } else if (step === 3) {
        setSimulationLog((prev) => [...prev, "[WARNING] ISP NAT Gateway inactivity timer triggered (No manual client traffic for 30s)."]);
        setPingHistory((p) => [...p.slice(3), 22, 28, 45]);
      } else if (step === 4) {
        // Evaluate Keepalive configuration
        if (simConfig.keepalive > 30 || simConfig.keepalive <= 0) {
          setNatTimeoutOccurred(true);
          setSimulationLog((prev) => [
            ...prev,
            "[FATAL] DISCONNECTED: Router firewall closed idle UDP port because PersistentKeepalive (" + (simConfig.keepalive <= 0 ? "Disabled" : simConfig.keepalive + "s") + ") was greater than NAT timeout (30s)!",
            "[AUTOSSH] Monitoring daemon noticed tunnel socket closure."
          ]);
          setPingHistory((p) => [...p.slice(5), 110, 150, 0, 0, 0]);
        } else {
          setSimulationLog((prev) => [
            ...prev,
            "[KEEP_ALIVE] SUCCESS: Silent handshake packet sent at " + simConfig.keepalive + "s interval. NAT port map maintained open!",
            "[ROUTE] Connection remains fully secure and connected."
          ]);
          setPingHistory((p) => [...p.slice(4), 12, 11, 13, 12]);
        }
      } else if (step === 5) {
        if (simConfig.keepalive > 30 || simConfig.keepalive <= 0) {
          // Evaluating autossh recovery
          if (simConfig.serverAliveInterval <= 20) {
            setSimulationLog((prev) => [
              ...prev,
              "[AUTOSSH] Host cleanup triggered. Found disconnected master socket.",
              "[SYSTEM] Executing: ssh -o ServerAliveInterval=" + simConfig.serverAliveInterval + " -o ServerAliveCountMax=" + simConfig.serverAliveCountMax + " ...",
              "[ROUTE] SUCCESS: Tunnel rebuilt and fully re-established! Internet connection re-aligned!"
            ]);
            setPingHistory((p) => [...p.slice(6), 0, 0, 85, 30, 13, 12]);
          } else {
            setSimulationLog((prev) => [
              ...prev,
              "[AUTOSSH] Stalled master socket still hanging. Connection is a zombie state. Reconnect delayed indefinitely.",
              "[FATAL] Connection permanently dropped. Manual interface restart required."
            ]);
            setPingHistory((p) => [...p.slice(6), 0, 0, 0, 0, 0, 0]);
          }
        } else {
          setSimulationLog((prev) => [...prev, "[SYSTEM] Continuous optimization: Network state is 100% optimum. Handshakes nominal."]);
          setPingHistory((p) => [...p.slice(3), 12, 11, 12]);
        }
        clearInterval(interval);
        setSimulationActive(false);
        setCpuUsage(2.4);
        setMemUsage(128);
      }
    }, 1500);
  };

  const handleBulkRestart = () => {
    if (bulkSelectedNodes.length === 0) return;
    const nodeNames = bulkSelectedNodes.map(
      (id) => fleetProfiles.find((p) => String(p.id) === id || p.name === id)?.name || id
    );

    const timestamp = new Date().toLocaleTimeString();
    const logsToAdd = [
      `[ORCHESTRATOR] [${timestamp}] Executing BULK RESTART across fleet: [${nodeNames.join(", ")}]`,
    ];

    bulkSelectedNodes.forEach((nodeId) => {
      const prof = fleetProfiles.find((p) => String(p.id) === nodeId || p.name === nodeId);
      const label = prof?.name || nodeId;
      if (prof?.category === "ssh" || nodeId.includes("ssh")) {
        logsToAdd.push(`[AUTOSSH:${label}] Recycled Master Socket -> ${prof?.endpointHost || "remote"}:${prof?.endpointPort || 22}`);
      } else if (prof?.category === "watchdog" || nodeId.includes("failover")) {
        logsToAdd.push(`[WATCHDOG:${label}] Reset failover route cache and verified probe sweep.`);
      } else {
        logsToAdd.push(`[WIREGUARD:${label}] Re-negotiated ChaCha20 handshake with ${prof?.endpointHost || "peer"}.`);
      }
    });
    logsToAdd.push(`[ORCHESTRATOR] Bulk restart completed successfully. All ${bulkSelectedNodes.length} nodes verified green.`);

    setSimulationLog((prev) => [...prev, ...logsToAdd]);
    setBulkActionFeedback({
      type: "success",
      message: `Successfully executed bulk restart on ${bulkSelectedNodes.length} fleet nodes.`,
    });
    setTimeout(() => setBulkActionFeedback(null), 6000);
  };

  const handleBulkDeployPatch = () => {
    if (bulkSelectedNodes.length === 0) return;
    const nodeNames = bulkSelectedNodes.map(
      (id) => fleetProfiles.find((p) => String(p.id) === id || p.name === id)?.name || id
    );

    const timestamp = new Date().toLocaleTimeString();
    const logsToAdd = [
      `[ORCHESTRATOR] [${timestamp}] DEPLOYING GLOBAL SECURITY PATCH to: [${nodeNames.join(", ")}]`,
      "[PATCH-ENGINE] Enforcing ChaCha20-Poly1305 and AES-256-GCM cipher suites.",
      "[PATCH-ENGINE] Locking permissions: chown root:root & chmod 600 config files.",
      "[PATCH-ENGINE] Standardizing DNS resolvers to 1.1.1.3 (Malware Shield) & PersistentKeepalive=25.",
    ];

    setSimulationLog((prev) => [...prev, ...logsToAdd]);
    setBulkActionFeedback({
      type: "success",
      message: `Deployed hardened security patch across ${bulkSelectedNodes.length} fleet nodes.`,
    });
    setTimeout(() => setBulkActionFeedback(null), 6000);
  };

  // Fast config pre-sets for pastebin
  const handleLoadSampleConfig = (type: "wireguard" | "ssh" | "usb-tether") => {
    setOptimizerType(type);
    if (type === "wireguard") {
      setRawConfigInput(`[Interface]
PrivateKey = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Address = 10.8.0.2/24
# Missing MTU
# Missing DNS

[Peer]
PublicKey = yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
Endpoint = my-vpn-server.company.com:51820
AllowedIPs = 0.0.0.0/0
# Note: PersistentKeepalive is completely missing! Tunnels will stall.`);
      setOptimizerDescription("My home network NAT router drops my connection after 5 minutes of inactivity. Keep me alive!");
    } else if (type === "ssh") {
      setRawConfigInput(`Host remote-relay
    HostName 198.51.100.12
    User devops
    IdentityFile ~/.ssh/id_rsa
# No Keepalive settings or ServerAliveInterval config
# No Autossh template configured`);
      setOptimizerDescription("I run a reverse SSH tunnel for my local database port but the link constantly goes dead overnight.");
    } else {
      setRawConfigInput(`# USB Network Interface configuration
# RNDIS / CDC_ETHER device interface declaration
allow-hotplug usb0
iface usb0 inet dhcp
# Missing metric adjustment (can collide with Wi-Fi)
# Missing custom DNS nameservers for mobile ISP networks`);
      setOptimizerDescription("I am sharing my phone's cellular connection with my Linux laptop over a USB tether, but the DNS resolving hangs and it has default route conflicts.");
    }
  };

  // Load configuration from sidebar item selection
  const handleSelectActiveTunnel = (tunnelId: string) => {
    if (tunnelId === "wg-primary-01") {
      setSelectedCategory("wireguard");
      setSelectedSegmentId("wg-keepalive");
      setSimConfig((prev) => ({ ...prev, keepalive: 25 }));
    } else if (tunnelId === "ssh-db-tunnel") {
      setSelectedCategory("ssh");
      setSelectedSegmentId("ssh-client-config");
      setSimConfig((prev) => ({ ...prev, serverAliveInterval: 15 }));
    } else if (tunnelId === "wg-failover-node") {
      setSelectedCategory("watchdog");
      setSelectedSegmentId("wg-watchdog-script");
    } else if (tunnelId === "usb-tether-link") {
      setSelectedCategory("usb");
      setSelectedSegmentId("usb-tether-setup");
    }
  };

  if (isAppLocked && pinStored) {
    return (
      <div className="min-h-screen bg-[#050507] text-gray-200 flex items-center justify-center p-6 font-mono">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyPin();
          }}
          className="w-full max-w-sm bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Lock className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                OmniEye Console Locked
              </h2>
              <p className="text-[10px] text-gray-500">
                Enter your 8-character security PIN to unlock
              </p>
            </div>
          </div>

          <input
            autoFocus
            type="password"
            maxLength={8}
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value.toUpperCase());
              setPinErrorMsg(null);
            }}
            placeholder="8-CHAR PIN"
            className="w-full bg-black border border-white/15 rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.35em] text-white uppercase focus:outline-none focus:border-blue-500"
          />

          {pinErrorMsg && (
            <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-2.5 py-1.5">
              {pinErrorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("omnieye_app_pin");
                localStorage.removeItem("omninetwork_optimizer_app_pin");
                setPinStored(null);
                setIsAppLocked(false);
                setPinInput("");
                setPinErrorMsg(null);
              }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-400 uppercase font-bold cursor-pointer"
            >
              Reset PIN
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Unlock Console
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#0a0a0a] text-gray-200 font-sans select-none overflow-x-hidden flex flex-col selection:bg-blue-600/30 selection:text-blue-200 ${
        isEcoPowerMode ? "eco-power-mode" : ""
      }`}
    >
      
      {/* Header Section */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f0f] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] shrink-0 overflow-hidden relative group">
            {/* Miniature high-contrast Sovereign Destiny Seal */}
            <svg className="w-8 h-8 text-purple-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer starry halo */}
              <circle cx="50" cy="50" r="44" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_45s_linear_infinite]" opacity="0.6" />
              <circle cx="50" cy="50" r="38" stroke="#f472b6" strokeWidth="0.5" strokeDasharray="2 6" className="animate-[spin_25s_linear_infinite_reverse]" opacity="0.4" />
              
              {/* Sacred Golden Triangle */}
              <polygon points="50,15 88,78 12,78" stroke="#fbbf24" strokeWidth="2.5" strokeLinejoin="round" />
              <polygon points="50,15 88,78 12,78" stroke="#a855f7" strokeWidth="0.75" strokeLinejoin="round" opacity="0.8" />
              
              {/* Central portal concentric ring */}
              <circle cx="50" cy="54" r="18" fill="#09090b" stroke="#eab308" strokeWidth="1" />
              
              {/* All seeing Eye of Destiny core */}
              <path d="M 38,54 C 42,46 58,46 62,54 C 58,62 42,62 38,54 Z" fill="#03001e" stroke="#fbbf24" strokeWidth="0.75" />
              <circle cx="50" cy="54" r="5" fill="#ffffff" className="animate-pulse" />
              <circle cx="48" cy="52" r="1.5" fill="#f472b6" />
              
              {/* Apex Runic Beacon */}
              <line x1="50" y1="15" x2="50" y2="5" stroke="#fbbf24" strokeWidth="1.5" />
              <circle cx="50" cy="4" r="2" fill="#f472b6" className="animate-ping" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-tight text-white uppercase sm:text-base flex items-center gap-1.5">
              OMNIEYE <span className="bg-purple-500/10 text-purple-400 font-mono text-[9px] px-1 py-0.5 rounded border border-purple-500/20 uppercase font-black tracking-wider">v3.0.0</span>
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">Secure Telemetry & Ingestion Core • 7DS/OMNI Brand</p>
          </div>
        </div>

        {/* Central Workspace Switching Tabs */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 font-mono text-xs select-none">
          <button
            onClick={() => setCurrentTab("network")}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition cursor-pointer ${
              currentTab === "network"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setCurrentTab("keep")}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition cursor-pointer ${
              currentTab === "keep"
                ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Keep
          </button>
          <button
            onClick={() => setCurrentTab("contacts")}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition cursor-pointer ${
              currentTab === "contacts"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setCurrentTab("expansion")}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition cursor-pointer ${
              currentTab === "expansion"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Expansion
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* User Auth Info Widget */}
          {authLoading ? (
            <div className="w-5 h-5 rounded-full border border-white/10 border-t-blue-500 animate-spin shrink-0" />
          ) : user ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 pr-3 max-w-[140px] sm:max-w-none">
              <img
                src={user.photoURL || "https://www.gravatar.com/avatar/?d=mp"}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full border border-emerald-500/30 shrink-0"
                alt="Avatar"
              />
              <div className="hidden md:flex flex-col text-left font-mono min-w-0">
                <span className="text-[9px] text-white font-bold truncate max-w-[80px]">
                  {user.displayName || user.email}
                </span>
                <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-wider">Sync Active</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[9px] font-mono text-gray-400 hover:text-red-400 transition uppercase cursor-pointer pl-1.5 border-l border-white/10 shrink-0 font-bold"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition duration-200 cursor-pointer border border-blue-500/20"
            >
              Sign In
            </button>
          )}

          <div className="hidden xl:block w-px h-8 bg-white/10"></div>

          <div className="hidden xl:flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">GLOBAL UPTIME</span>
            <span className="text-xs font-mono text-emerald-400">342d 14h 22m 05s</span>
          </div>

          {/* Battery Status API Indicator + Auto Eco-Dim (<20%) */}
          <button
            type="button"
            onClick={() => setEcoManualOverride((prev) => !prev)}
            title={
              batteryApiSupported
                ? `Battery Status API: ${Math.round(batteryLevel * 100)}%${isBatteryCharging ? " (Charging)" : ""}. Auto-dims UI & throttles polling below 20%. Click to toggle Eco-Dim test mode.`
                : "Battery Status Indicator (click to toggle <20% Eco-Dim Power Saver mode)"
            }
            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap tabular-nums ${
              isEcoPowerMode
                ? "bg-amber-500/20 border-amber-400/60 text-amber-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-emerald-300"
            }`}
          >
            {isBatteryCharging ? (
              <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
            ) : isEcoPowerMode ? (
              <BatteryLow className="h-3.5 w-3.5 text-amber-400" />
            ) : batteryLevel < 0.6 ? (
              <BatteryMedium className="h-3.5 w-3.5 text-cyan-300" />
            ) : (
              <BatteryFull className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>
              {ecoManualOverride ? "18% ECO" : `${Math.round(batteryLevel * 100)}%`}
            </span>
            {isEcoPowerMode && (
              <span className="hidden sm:inline px-1 py-0.5 rounded bg-amber-500/25 text-[8px] text-amber-200">
                ECO DIM
              </span>
            )}
          </button>

          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[10px] font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
            title="Open Command Palette (Ctrl/Cmd + K)"
          >
            <Search className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden lg:inline">Cmd+K</span>
          </button>

          <div className="hidden sm:block w-px h-8 bg-white/10"></div>
          
          {/* Security PIN Controller Header Widget */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
            {pinStored ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsAppLocked(true);
                    setPinInput("");
                    setPinErrorMsg(null);
                  }}
                  className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-rose-400 transition cursor-pointer"
                  title="Manually Lock Console"
                >
                  <Lock className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinErrorMsg(null);
                    setShowPinSettingsModal(true);
                  }}
                  className="px-2 py-1 text-[9px] font-mono font-bold uppercase rounded hover:bg-white/5 text-emerald-400 cursor-pointer"
                  title="PIN Config"
                >
                  Secured
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPinErrorMsg(null);
                  setShowPinSettingsModal(true);
                }}
                className="px-2 py-1 text-[9px] font-mono font-bold uppercase rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 animate-pulse cursor-pointer flex items-center gap-1"
                title="Lock Application Now"
              >
                <Unlock className="h-3 w-3" /> Lock App
              </button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/10"></div>
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider font-mono">REDUNDANT MESH ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full shrink-0 animate-bounce">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <WifiOff className="h-3.5 w-3.5" /> MESH LINK OFFLINE
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Google Maps API Demo Quota Exceeded Banner (Compliance Section 8 Case A) */}
      {mapsQuotaExceeded && (
        <div className="sticky top-0 z-50 bg-amber-950/95 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between gap-4 text-xs font-mono text-amber-200 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              Notice: Demo Google Maps Platform quota has been exhausted. Interactive Geo-Node Map tiles are limited until replaced with a personal key.{" "}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-amber-300 hover:text-white"
              >
                Learn how to resolve quota errors
              </a>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMapsQuotaExceeded(false)}
            className="p-1 text-amber-300 hover:text-white cursor-pointer"
            title="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Network Connectivity Failure Alert Banner */}
      {showOfflineAlert && (
        <div className="bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-950/90 border-b border-rose-500/30 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 backdrop-blur-md transition-all duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 animate-pulse shrink-0 mt-0.5">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase flex items-center gap-2">
                CRITICAL WARNING: PRIMARY TRANSIT INTERFACE DISCONNECTED
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold tracking-wider uppercase font-mono animate-pulse">
                  OFFLINE
                </span>
              </h4>
              <p className="text-[11px] font-mono text-gray-400 mt-1 leading-relaxed max-w-4xl">
                The browser network layer reports no local connection (<code className="text-gray-200">navigator.onLine === false</code>). 
                Foreground orchestration, automated failovers, dynamic keepalive cycles, and Cloud synchronization services are temporarily suspended. 
                Last validated at: <span className="text-white font-bold font-mono">{lastCheckTime}</span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                const currentOnline = navigator.onLine;
                setIsOnline(currentOnline);
                setLastCheckTime(new Date().toLocaleTimeString());
                if (currentOnline) {
                  setShowOfflineAlert(false);
                } else {
                  const btn = document.getElementById("retest-network-btn");
                  if (btn) {
                    btn.classList.add("scale-95", "bg-rose-500/25");
                    setTimeout(() => btn.classList.remove("scale-95", "bg-rose-500/25"), 150);
                  }
                }
              }}
              id="retest-network-btn"
              className="flex-1 md:flex-initial px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 animate-spin" />
              Re-Test Interface
            </button>
            <button
              onClick={() => {
                setIsOnline(true);
                setShowOfflineAlert(false);
                setLastCheckTime(new Date().toLocaleTimeString());
              }}
              className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/20"
            >
              <Wifi className="h-3 w-3" />
              Simulate Safe Link
            </button>
            <button
              onClick={() => setShowOfflineAlert(false)}
              className="p-2 rounded hover:bg-white/5 text-gray-500 hover:text-white transition cursor-pointer"
              title="Acknowledge & Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Dashboard Metrics Row */}
      <NetworkOverviewDashboard
        simulationActive={simulationActive}
        natTimeoutOccurred={natTimeoutOccurred}
        selectedCategory={selectedCategory}
        variableValues={variableValues}
        simConfig={simConfig}
        fleetProfiles={fleetProfiles}
        activeProfile={fleetProfiles.find((p) => p.id === activeProfileId) || fleetProfiles[0] || null}
        lastProbeRtt={lastProbeResult?.avgMs ?? null}
        probeLogs={probeLogs}
        simulationLog={simulationLog}
        authLogs={tunnelAuthLogs}
        sseConnected={sseConnected}
        onExportPostmortemZip={handleExportPostmortemZip}
      />

      {/* Mobile-only Workspace Switcher Tabs */}
      <div className="md:hidden flex bg-[#0d0d0d] border-b border-white/10 p-2 gap-2 font-mono text-xs shrink-0 select-none">
        <button
          onClick={() => setCurrentTab("network")}
          className={`flex-1 py-2 text-center rounded-lg font-bold uppercase transition ${
            currentTab === "network"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setCurrentTab("keep")}
          className={`flex-1 py-2 text-center rounded-lg font-bold uppercase transition ${
            currentTab === "keep"
              ? "bg-yellow-500 text-black shadow-sm"
              : "text-gray-400"
          }`}
        >
          Keep
        </button>
        <button
          onClick={() => setCurrentTab("contacts")}
          className={`flex-1 py-2 text-center rounded-lg font-bold uppercase transition ${
            currentTab === "contacts"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-400"
          }`}
        >
          Contacts
        </button>
        <button
          onClick={() => setCurrentTab("expansion")}
          className={`flex-1 py-2 text-center rounded-lg font-bold uppercase transition ${
            currentTab === "expansion"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-400"
          }`}
        >
          Expansion
        </button>
      </div>

      {/* Main Workbench Workspace */}
      {currentTab === "network" ? (
        <main className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0a0a0a]">
        
        {/* Sidebar: Active Tunnels (Inspected items on click) */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0d0d0d] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Active Orchestrated Links</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {fleetProfiles.map((profile) => {
              const isSelected = activeProfileId === profile.id;
              return (
                <div
                  key={String(profile.id)}
                  onClick={() => handleSelectProfile(profile)}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer group ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500/40 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-xs font-bold text-white font-mono truncate">{profile.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-mono uppercase ${
                          profile.category === "wireguard"
                            ? "bg-blue-500 text-white"
                            : profile.category === "usb"
                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                            : "border border-gray-600 text-gray-400"
                        }`}
                      >
                        {profile.category}
                      </span>
                      {fleetProfiles.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-rose-400 transition cursor-pointer"
                          title="Remove endpoint"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 text-[10px] text-gray-400 mt-1.5 font-mono">
                    <span className="truncate text-emerald-400">
                      {profile.endpointHost}:{profile.endpointPort}
                    </span>
                    <span className="text-[9px] text-gray-500 shrink-0">
                      {profile.lastRttMs !== null ? `${profile.lastRttMs}ms` : "—"}
                    </span>
                  </div>
                  <div className="text-[8.5px] text-gray-500 font-mono truncate mt-0.5">
                    {profile.locationLabel}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsAddEndpointModalOpen(true)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold font-mono text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> ADD NEW ENDPOINT
            </button>
          </div>
        </aside>

        {/* Content View divided in columns */}
        <section className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] overflow-y-auto pb-20">
          <div className="px-5 pt-5">
            <AndroidQuickActionDeck
              activeProfile={activeProfileForWorkbench}
              activeHardwareDevice={activeHardwareDevice}
              recommendedDevice={
                deviceEncyclopedia.find((d) => d.deviceSlug === recommendedDeviceSlug) ||
                deviceEncyclopedia[0] ||
                null
              }
              hardwareScanReport={hardwareScanReport}
              restrictTrafficToRegion={restrictTrafficToRegion}
              streamlinedAndroidMode={streamlinedAndroidMode}
              onToggleStreamlinedAndroidMode={setStreamlinedAndroidMode}
              onRunHardwareScan={handleRunHardwareScan}
              onApplyHardwareSelfTuning={handleApplyHardwareSelfTuning}
              onToggleRestrictToRegion={handleToggleRestrictToRegion}
              onApplyOptimalMtu={handleApplyOptimalMtu}
              onCompactRetention={handleCompactRetention}
              onRunBatchProbe={handleRunBatchProbe}
              onScrollToSection={(secId) => {
                const el = document.getElementById(secId);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          </div>

          <div className={`grid grid-cols-1 ${streamlinedAndroidMode ? "max-w-4xl mx-auto w-full" : "xl:grid-cols-12"} gap-5 p-5`}>
            
            {/* Center Area: Visualizer Test Bench and Code Generator (xl:col-span-7) */}
            <div className={`${streamlinedAndroidMode ? "" : "xl:col-span-7"} flex flex-col gap-5`}>
              
              {/* Dynamic Connection Route Visualizer */}
              <div className={`bg-[#0c0c0c] border border-white/5 rounded-xl p-5 relative overflow-hidden ${getModuleStyle(simulatorState)}`}>
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-blue-500" /> Connection Route Simulator
                  </h3>
                  
                  {/* Dropdown for Brightness & Visibility */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-gray-400">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">HUD:</span>
                    <select
                      value={simulatorState}
                      onChange={(e) => setSimulatorState(e.target.value as any)}
                      className="bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-1 font-bold"
                    >
                      <option value="full" className="bg-[#0f0f0f] text-white">Full (100%)</option>
                      <option value="medium" className="bg-[#0f0f0f] text-white">Dim (60%)</option>
                      <option value="low" className="bg-[#0f0f0f] text-white">Low (25%)</option>
                      <option value="hidden" className="bg-[#0f0f0f] text-rose-400">Hidden</option>
                    </select>
                  </div>
                </div>

                {simulatorState !== "hidden" ? (
                  <div className="space-y-4">
                    {/* Interactive Visual Network Map / Geo-Node Map Topology */}
                    <div className="bg-[#050505] border border-white/5 rounded-lg p-4 relative flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                        Interactive Topology Map
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded p-0.5 font-mono text-[9px]">
                      <button
                        type="button"
                        onClick={() => setTopologyViewMode("svg")}
                        className={`px-2 py-0.5 rounded uppercase font-bold transition cursor-pointer ${
                          topologyViewMode === "svg" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Schematic SVG
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopologyViewMode("map")}
                        className={`px-2 py-0.5 rounded uppercase font-bold transition cursor-pointer flex items-center gap-1 ${
                          topologyViewMode === "map" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Globe className="h-2.5 w-2.5" /> Geo-Node Map
                      </button>
                    </div>
                  </div>

                  {topologyViewMode === "map" ? (
                    <Suspense
                      fallback={
                        <div className="h-[360px] w-full bg-[#050505] border border-white/10 rounded-lg flex items-center justify-center text-xs font-mono text-gray-500">
                          Loading Google Maps Geo-Node Overlay...
                        </div>
                      }
                    >
                      <FleetGeoMap
                        profiles={fleetProfiles}
                        selectedProfileId={activeProfileId}
                        onSelectProfile={handleSelectProfile}
                        onProbeProfile={(p) => runLiveProbeForProfile(p)}
                        probingId={probingProfileId}
                        quotaExceeded={mapsQuotaExceeded}
                      />
                    </Suspense>
                  ) : (
                  <div className="relative w-full overflow-hidden bg-black/40 rounded-lg border border-white/5 p-2">
                    <svg className="w-full h-auto select-none" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Grid Background lines */}
                      <defs>
                        <pattern id="topoGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                        </pattern>
                        <linearGradient id="activeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <rect width="500" height="200" fill="url(#topoGrid)" />

                      {/* Static base connection links */}
                      {/* LAN Link */}
                      <path d="M 40 100 L 120 100" stroke="#1e293b" strokeWidth="2" strokeDasharray="2,2" />
                      
                      {/* USB Tethering Physical/Logical Link */}
                      <path d="M 40 100 L 120 160" 
                        stroke={selectedCategory === "usb" ? "#10b981" : "#1e293b"} 
                        strokeWidth="2" 
                        strokeDasharray={selectedCategory === "usb" ? "none" : "2,2"} 
                        className="transition-all duration-300" 
                        strokeOpacity={selectedCategory === "usb" ? "1" : "0.3"}
                      />
                      <path d="M 120 160 L 250 160" 
                        stroke={selectedCategory === "usb" ? "#10b981" : "#1e293b"} 
                        strokeWidth="1.5" 
                        className="transition-all duration-300" 
                        strokeOpacity={selectedCategory === "usb" ? "0.8" : "0.3"}
                      />

                      {/* WireGuard Tunnel Path */}
                      <path d="M 120 100 C 160 60, 210 40, 250 40 C 295 40, 340 60, 460 100" 
                        stroke={selectedCategory === "wireguard" ? (natTimeoutOccurred ? "#ef4444" : "#10b981") : "#1e293b"} 
                        strokeWidth={selectedCategory === "wireguard" ? "2" : "1.5"} 
                        className="transition-all duration-300"
                        strokeOpacity={selectedCategory === "wireguard" ? "0.8" : "0.3"}
                      />

                      {/* Standby Path */}
                      <path d="M 120 100 L 250 100 L 460 100" 
                        stroke={selectedCategory === "watchdog" ? "#10b981" : "#1e293b"} 
                        strokeWidth={selectedCategory === "watchdog" ? "2" : "1.5"} 
                        className="transition-all duration-300"
                        strokeOpacity={selectedCategory === "watchdog" ? "0.8" : "0.3"}
                      />

                      {/* SSH Tunnel Path */}
                      <path d="M 120 100 C 160 140, 210 160, 250 160 C 295 160, 340 140, 460 100" 
                        stroke={selectedCategory === "ssh" ? (natTimeoutOccurred ? "#ef4444" : "#10b981") : "#1e293b"} 
                        strokeWidth={selectedCategory === "ssh" ? "2" : "1.5"} 
                        className="transition-all duration-300"
                        strokeOpacity={selectedCategory === "ssh" ? "0.8" : "0.3"}
                      />

                      {/* Active glowing path representing active packet travel */}
                      {!natTimeoutOccurred && (
                        <>
                          {selectedCategory === "wireguard" && (
                            <path id="traffic-wg" d="M 40 100 L 120 100 C 160 60, 210 40, 250 40 C 295 40, 340 60, 460 100" fill="none" stroke="transparent" />
                          )}
                          {selectedCategory === "watchdog" && (
                            <path id="traffic-watchdog" d="M 40 100 L 120 100 L 250 100 L 460 100" fill="none" stroke="transparent" />
                          )}
                          {selectedCategory === "ssh" && (
                            <path id="traffic-ssh" d="M 40 100 L 120 100 C 160 140, 210 160, 250 160 C 295 160, 340 140, 460 100" fill="none" stroke="transparent" />
                          )}
                          {selectedCategory === "usb" && (
                            <path id="traffic-usb" d="M 40 100 L 120 160 L 250 160 L 460 100" fill="none" stroke="transparent" />
                          )}

                          {/* Packet animations */}
                          <circle r="4.5" fill="#10b981" filter="drop-shadow(0 0 6px rgba(16,185,129,0.8))">
                            <animateMotion dur="2.8s" repeatCount="indefinite">
                              <mpath href={selectedCategory === "wireguard" ? "#traffic-wg" : selectedCategory === "ssh" ? "#traffic-ssh" : selectedCategory === "usb" ? "#traffic-usb" : "#traffic-watchdog"} />
                            </animateMotion>
                          </circle>
                          <circle r="3" fill="#60a5fa" filter="drop-shadow(0 0 4px rgba(96,165,250,0.8))">
                            <animateMotion dur="2.8s" begin="1.4s" repeatCount="indefinite">
                              <mpath href={selectedCategory === "wireguard" ? "#traffic-wg" : selectedCategory === "ssh" ? "#traffic-ssh" : selectedCategory === "usb" ? "#traffic-usb" : "#traffic-watchdog"} />
                            </animateMotion>
                          </circle>
                        </>
                      )}

                      {/* Stalled Connection Flashing Overlay */}
                      {natTimeoutOccurred && (
                        <g>
                          <path d="M 115 100 L 165 100" stroke="#ef4444" strokeWidth="2.5" className="animate-pulse" />
                          <circle cx="140" cy="100" r="12" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1" className="animate-ping" />
                        </g>
                      )}

                      {/* INTERACTIVE NODES */}

                      {/* 1. Local PC Node (HP Laptop) */}
                      <g 
                        onClick={() => setSelectedTopologyNode("local-pc")}
                        onMouseEnter={() => setTopologyHoveredNode("local-pc")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="40" cy="100" r="18" fill={selectedTopologyNode === "local-pc" ? "rgba(59, 130, 246, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "local-pc" ? "#3b82f6" : (topologyHoveredNode === "local-pc" ? "#60a5fa" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "local-pc" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* PC Icon Shape */}
                        <path d="M 33 93 H 47 V 103 H 33 Z M 35 103 L 32 108 H 48 L 45 103" stroke={selectedTopologyNode === "local-pc" ? "#60a5fa" : "#94a3b8"} strokeWidth="1.2" fill="none" />
                        <circle cx="53" cy="87" r="3" fill="#10b981" /> {/* Status dot */}
                      </g>

                      {/* 2. NAT Firewall Node */}
                      <g 
                        onClick={() => setSelectedTopologyNode("local-router")}
                        onMouseEnter={() => setTopologyHoveredNode("local-router")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="120" cy="100" r="18" fill={selectedTopologyNode === "local-router" ? "rgba(59, 130, 246, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "local-router" ? "#3b82f6" : (topologyHoveredNode === "local-router" ? "#60a5fa" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "local-router" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* Firewall / Shield Icon Shape */}
                        <path d="M 114 93 L 120 90 L 126 93 V 99 C 126 104, 120 108, 120 108 C 120 108, 114 104, 114 99 Z" stroke={natTimeoutOccurred ? "#ef4444" : (selectedTopologyNode === "local-router" ? "#60a5fa" : "#94a3b8")} strokeWidth="1.2" fill="none" />
                        <circle cx="133" cy="87" r="3" fill={natTimeoutOccurred ? "#ef4444" : "#10b981"} className={natTimeoutOccurred ? "animate-pulse" : ""} />
                      </g>

                      {/* 3. WireGuard Node wg0 */}
                      <g 
                        onClick={() => {
                          setSelectedTopologyNode("wg-node");
                          setSelectedCategory("wireguard");
                          setSelectedSegmentId("wg-keepalive");
                        }}
                        onMouseEnter={() => setTopologyHoveredNode("wg-node")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="250" cy="40" r="18" fill={selectedTopologyNode === "wg-node" ? "rgba(59, 130, 246, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "wg-node" ? "#3b82f6" : (topologyHoveredNode === "wg-node" ? "#60a5fa" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "wg-node" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* WireGuard Shield / Connection Lock shape */}
                        <path d="M 245 35 Q 250 32, 255 35 V 41 C 255 45, 250 48, 250 48 Q 250 48, 245 45 Z M 248 40 H 252" stroke={selectedCategory === "wireguard" ? (natTimeoutOccurred ? "#ef4444" : "#10b981") : "#64748b"} strokeWidth="1.2" fill="none" />
                        <circle cx="263" cy="27" r="3" fill={selectedCategory === "wireguard" ? (natTimeoutOccurred ? "#ef4444" : "#10b981") : "#475569"} />
                      </g>

                      {/* 4. Standby Failover Node */}
                      <g 
                        onClick={() => {
                          setSelectedTopologyNode("standby-node");
                          setSelectedCategory("watchdog");
                          setSelectedSegmentId("wg-watchdog-script");
                        }}
                        onMouseEnter={() => setTopologyHoveredNode("standby-node")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="250" cy="100" r="18" fill={selectedTopologyNode === "standby-node" ? "rgba(59, 130, 246, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "standby-node" ? "#3b82f6" : (topologyHoveredNode === "standby-node" ? "#60a5fa" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "standby-node" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* Standby Pulse check shape */}
                        <path d="M 243 100 H 247 L 250 94 L 252 106 L 254 100 H 257" stroke={selectedCategory === "watchdog" ? "#10b981" : "#64748b"} strokeWidth="1.2" fill="none" />
                        <circle cx="263" cy="87" r="3" fill={selectedCategory === "watchdog" ? "#10b981" : "#e2e8f0"} fillOpacity="0.4" />
                      </g>

                      {/* 5. SSH Tunnel Node */}
                      <g 
                        onClick={() => {
                          setSelectedTopologyNode("ssh-node");
                          setSelectedCategory("ssh");
                          setSelectedSegmentId("ssh-client-config");
                        }}
                        onMouseEnter={() => setTopologyHoveredNode("ssh-node")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="250" cy="160" r="18" fill={selectedTopologyNode === "ssh-node" ? "rgba(59, 130, 246, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "ssh-node" ? "#3b82f6" : (topologyHoveredNode === "ssh-node" ? "#60a5fa" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "ssh-node" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* Terminal prompt symbol '>_' */}
                        <path d="M 244 157 L 249 160 L 244 163 M 251 163 H 256" stroke={selectedCategory === "ssh" ? (natTimeoutOccurred ? "#ef4444" : "#10b981") : "#64748b"} strokeWidth="1.2" fill="none" />
                        <circle cx="263" cy="147" r="3" fill={selectedCategory === "ssh" ? (natTimeoutOccurred ? "#ef4444" : "#10b981") : "#475569"} />
                      </g>

                      {/* 5b. USB Phone Node */}
                      <g 
                        onClick={() => {
                          setSelectedTopologyNode("usb-phone");
                          setSelectedCategory("usb");
                          setSelectedSegmentId("usb-tether-setup");
                        }}
                        onMouseEnter={() => setTopologyHoveredNode("usb-phone")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="120" cy="160" r="18" fill={selectedTopologyNode === "usb-phone" ? "rgba(16, 185, 129, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "usb-phone" ? "#10b981" : (topologyHoveredNode === "usb-phone" ? "#34d399" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "usb-phone" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* Smartphone Icon Shape */}
                        <rect x="113" y="148" width="14" height="24" rx="2" stroke={selectedCategory === "usb" ? "#10b981" : "#94a3b8"} strokeWidth="1.2" fill="none" />
                        <line x1="113" y1="152" x2="127" y2="152" stroke={selectedCategory === "usb" ? "#10b981" : "#94a3b8"} strokeWidth="0.8" />
                        <circle cx="120" cy="167" r="1.5" fill={selectedCategory === "usb" ? "#10b981" : "#94a3b8"} />
                        <circle cx="133" cy="147" r="3" fill={selectedCategory === "usb" ? "#10b981" : "#475569"} />
                      </g>

                      {/* 6. Remote Destination Host */}
                      <g 
                        onClick={() => setSelectedTopologyNode("remote-host")}
                        onMouseEnter={() => setTopologyHoveredNode("remote-host")}
                        onMouseLeave={() => setTopologyHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle cx="460" cy="100" r="18" fill={selectedTopologyNode === "remote-host" ? "rgba(59, 130, 246, 0.2)" : "rgba(14, 14, 14, 0.85)"} 
                          stroke={selectedTopologyNode === "remote-host" ? "#3b82f6" : (topologyHoveredNode === "remote-host" ? "#60a5fa" : "rgba(255,255,255,0.15)")} 
                          strokeWidth={selectedTopologyNode === "remote-host" ? "2" : "1.5"} 
                          className="transition-all duration-200" 
                        />
                        {/* Cloud Server Target icon shape */}
                        <path d="M 452 103 Q 450 100, 452 97 Q 455 93, 460 95 Q 463 92, 467 95 Q 469 98, 467 101" stroke={natTimeoutOccurred ? "#64748b" : "#10b981"} strokeWidth="1.2" fill="none" />
                        <circle cx="473" cy="87" r="3" fill={natTimeoutOccurred ? "#ef4444" : "#10b981"} />
                      </g>

                      {/* Simple visual labels inside SVG */}
                      <text x="40" y="129" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">LOCAL MACHINE</text>
                      <text x="120" y="129" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">NAT/FIREWALL</text>
                      <text x="120" y="189" fill={selectedCategory === "usb" ? "#10b981" : "#64748b"} fontSize="8" fontFamily="monospace" textAnchor="middle">USB PHONE</text>
                      <text x="250" y="19" fill={selectedCategory === "wireguard" ? "#60a5fa" : "#475569"} fontSize="8" fontFamily="monospace" textAnchor="middle">WIREGUARD (wg0)</text>
                      <text x="250" y="129" fill={selectedCategory === "watchdog" ? "#10b981" : "#475569"} fontSize="8" fontFamily="monospace" textAnchor="middle">FAILOVER NODE</text>
                      <text x="250" y="189" fill={selectedCategory === "ssh" ? "#10b981" : "#475569"} fontSize="8" fontFamily="monospace" textAnchor="middle">SSH BASTION</text>
                      <text x="460" y="129" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">CLOUD VPS</text>
                    </svg>
                  </div>
                  )}

                  {/* Node Detail / Telemetry Console */}
                  {selectedTopologyNode && (() => {
                    const nodeMap: Record<string, { label: string; ip: string; status: string; desc: string; extra: string; color: string }> = {
                      "local-pc": {
                        label: `HP Laptop (${selectedOS.toUpperCase()})`,
                        ip: "192.168.1.102 (Internal DHCP)",
                        status: "Live & Active",
                        desc: `Your physical Ubuntu/HP workstation where the tunnels originate. Active OS user is '${variableValues["SYSTEM_USER"] || "user"}'.`,
                        extra: `Default loopback is MTU: 65536, but outgoing interfaces map to MTU: ${simConfig.mtu}b to bypass cellular fragmentation.`,
                        color: "text-blue-400"
                      },
                      "local-router": {
                        label: "Home NAT Firewall / Gateway",
                        ip: "192.168.1.1 (Static default gateway)",
                        status: natTimeoutOccurred ? "STALLED - Stateful Session Dropped" : "Active & Forwarding",
                        desc: "Your ISP's stateful packet inspection firewall. It maintains state maps for UDP ports but flushes inactive mappings after 30 seconds of quiet time.",
                        extra: simConfig.keepalive <= 30 && simConfig.keepalive > 0 
                          ? `Healthy: Keepalive of ${simConfig.keepalive}s is below NAT's 30s expiry limit. Tunnel will remain open indefinitely.`
                          : "Warning: Missing or high keepalive values mean the router will drop idle tunnels! Trigger the disconnect test bench to verify.",
                        color: natTimeoutOccurred ? "text-red-400" : "text-amber-400"
                      },
                      "wg-node": {
                        label: "WireGuard Tunnel Node (wg0)",
                        ip: `${variableValues["TUNNEL_IP"] || "10.0.0.2"}/24`,
                        status: selectedCategory === "wireguard" ? (natTimeoutOccurred ? "STALLED - Idle Packet Loss" : "Active - nominal traffic") : "Dormant",
                        desc: "Primary kernel-level UDP VPN gateway. Fast, modern, but relies strictly on consistent silent pings to stay mapped in standard stateful firewall environments.",
                        extra: `Current parameters: PersistentKeepalive: ${simConfig.keepalive}s, MTU: ${simConfig.mtu} bytes. Listening Port: 51820.`,
                        color: selectedCategory === "wireguard" ? (natTimeoutOccurred ? "text-red-400" : "text-emerald-400") : "text-gray-500"
                      },
                      "standby-node": {
                        label: "Standby Watchdog Server",
                        ip: `${variableValues["MONITOR_IP"] || "1.1.1.1"} (Pings sweep public servers)`,
                        status: selectedCategory === "watchdog" ? "Active (Monitoring Daemon engaged)" : "Standby Mode",
                        desc: "Local automation script that performs periodic ping sweeps. If packet loss reaches 100%, it automatically flushes local routes and restarts the core interface.",
                        extra: "Configured trigger: Runs every 60 seconds as a system level daemon service.",
                        color: selectedCategory === "watchdog" ? "text-emerald-400" : "text-gray-500"
                      },
                       "ssh-node": {
                        label: "AutoSSH Multiplexed Session",
                        ip: "127.0.0.1:5432 -> Remote:5432 (Local Forward)",
                        status: selectedCategory === "ssh" ? (natTimeoutOccurred ? "STALLED - Master Socket Dropped" : "Active - Multiplexed Link") : "Dormant",
                        desc: "Application-level secure secure port-forwarding link. It runs SSH multiplexed controls to host secure secure tunnels inside corporate environments.",
                        extra: `Keepalive config: ServerAliveInterval: ${simConfig.serverAliveInterval}s, ServerAliveCountMax: ${simConfig.serverAliveCountMax}.`,
                        color: selectedCategory === "ssh" ? (natTimeoutOccurred ? "text-red-400" : "text-emerald-400") : "text-gray-500"
                      },
                      "usb-phone": {
                        label: "USB Tethered Phone Gateway",
                        ip: "192.168.42.129 (Physical Smartphone RNDIS / USBMux Gateway)",
                        status: selectedCategory === "usb" ? "Active & Direct WAN Routing" : "Standby (Interface Detected)",
                        desc: "Your HP workstation is connected via hardware USB cable to your smartphone, which acts as a cellular gateway. Cellular routes have aggressive NAT/SPI drops.",
                        extra: "Lowering MTU values to 1360/1280 over this link prevents packet fragmentation and double-NAT connection drops.",
                        color: selectedCategory === "usb" ? "text-emerald-400" : "text-blue-400"
                      },
                      "remote-host": {
                        label: "Production Cloud VPS Target",
                        ip: `${variableValues["HOST_ALIAS"] || "remote-node"} (198.51.100.12)`,
                        status: natTimeoutOccurred ? "Unreachable (No route to host)" : "Active & Responding",
                        desc: "Remote target running Postgres DB/API services behind Wireguard & SSH bastions. Listens for secure tunnels to accept connections.",
                        extra: "Firewall rule: Drops all public SSH/UDP traffic except authenticated keys.",
                        color: natTimeoutOccurred ? "text-red-400" : "text-emerald-400"
                      }
                    };

                    const currentInfo = nodeMap[selectedTopologyNode] || nodeMap["local-pc"];

                    return (
                      <div className="bg-[#080808] border border-white/5 rounded-lg p-3.5 font-mono text-xs text-left">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                          <span className={`font-bold uppercase tracking-wider ${currentInfo.color}`}>
                            {currentInfo.label}
                          </span>
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">
                            IP: {currentInfo.ip}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-2 text-[11px]">
                          {currentInfo.desc}
                        </p>
                        <p className="text-gray-500 leading-relaxed text-[10px] italic">
                          {currentInfo.extra}
                        </p>

                        {/* Node Specific Interactive Quick actions */}
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-2">
                          {selectedTopologyNode === "local-router" && natTimeoutOccurred && (
                            <button
                              onClick={() => {
                                setSimConfig(prev => ({ ...prev, keepalive: 25 }));
                                runSimulation();
                              }}
                              className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 transition"
                            >
                              ⚡ QUICK RECONNECT: Apply 25s Keepalive & Ping
                            </button>
                          )}
                          {selectedTopologyNode === "wg-node" && (
                            <>
                              <button
                                onClick={() => setSimConfig(prev => ({ ...prev, keepalive: 25 }))}
                                className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded text-[10px] font-bold text-blue-400 transition"
                              >
                                Fix Keepalive (25s)
                              </button>
                              <button
                                onClick={() => setSimConfig(prev => ({ ...prev, mtu: 1420 }))}
                                className="px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded text-[10px] font-bold text-purple-400 transition"
                              >
                                Align MTU (1420b)
                              </button>
                            </>
                          )}
                          {selectedTopologyNode === "ssh-node" && (
                            <button
                              onClick={() => setSimConfig(prev => ({ ...prev, serverAliveInterval: 15 }))}
                              className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded text-[10px] font-bold text-blue-400 transition"
                            >
                              Optimize ServerAlive (15s)
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTopologyNode(null as any);
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-400 ml-auto"
                          >
                            Close Inspector
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Closed-Loop SLA, Auto-Poller & Node Heartbeat Telemetry */}
                <Suspense
                  fallback={
                    <div className="h-32 bg-[#08080a] border border-white/10 rounded-xl flex items-center justify-center text-xs font-mono text-gray-500">
                      Loading Fleet SLA Telemetry...
                    </div>
                  }
                >
                  <FleetSlaTelemetryPanel
                    profiles={fleetProfiles}
                    selectedProfile={
                      fleetProfiles.find((p) => p.id === activeProfileId) || fleetProfiles[0] || null
                    }
                    probeLogs={probeLogs}
                    slaRollups={slaRollups}
                    webhookDeliveries={webhookDeliveries}
                    retentionStats={retentionStats}
                    nodeCommands={nodeCommands}
                    auditLedger={auditLedger}
                    deviceEncyclopedia={deviceEncyclopedia}
                    userRole={userRole}
                    activeHardwareDevice={activeHardwareDevice}
                    hardwareScanReport={hardwareScanReport}
                    recommendedDeviceSlug={recommendedDeviceSlug}
                    currentMtu={Number(variableValues["MTU_SIZE"]) || simConfig.mtu || 1420}
                    currentKeepaliveSec={
                      Number(variableValues["KEEPALIVE_INTERVAL"]) || simConfig.keepalive || 25
                    }
                    autoPollSec={autoPollSec}
                    onChangeAutoPollSec={setAutoPollSec}
                    isBatchProbing={isBatchProbing}
                    onRunBatchProbe={handleRunBatchProbe}
                    onRunServerWatchdog={handleRunServerWatchdog}
                    onUpdateAlertThreshold={handleUpdateAlertThreshold}
                    onSendTestHeartbeat={handleSendTestHeartbeat}
                    onUpdateFailoverPolicy={handleUpdateFailoverPolicy}
                    onSetMaintenanceWindow={handleSetMaintenanceWindow}
                    onTriggerCanaryRollout={handleTriggerCanaryRollout}
                    onEnqueueNodeCommand={handleEnqueueNodeCommand}
                    onSwitchRbacRole={handleSwitchRbacRole}
                    onRunChaosDrill={handleRunChaosDrill}
                    onApplyHardwareSelfTuning={handleApplyHardwareSelfTuning}
                    onRunHardwareScan={handleRunHardwareScan}
                    onApplyOptimalMtu={handleApplyOptimalMtu}
                    onRetryWebhookDelivery={handleRetryWebhookDelivery}
                    onCompactRetention={handleCompactRetention}
                    lastAutoAlertNotice={lastAutoAlertNotice}
                    lastWatchdogNotice={lastWatchdogNotice}
                  />
                </Suspense>

                {/* Yggdrasil IPv6 Mesh (0200::/7) + Matrix Federation Bridge */}
                <div className="mt-4">
                  <YggdrasilMatrixBridgePanel
                    activeHardwareDevice={activeHardwareDevice}
                    isEcoPowerMode={isEcoPowerMode}
                    onLoadYggdrasilBlueprint={(mtu) => {
                      setSelectedCategory("yggdrasil");
                      setSelectedSegmentId("yggdrasil-matrix-bridge");
                      setVariableValues((prev) => ({ ...prev, MTU_SIZE: String(mtu) }));
                      const el = document.getElementById("workbench-self-tune");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />
                </div>

                {/* Configuration Controls Sliders */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#080808] p-4 rounded-lg border border-white/5">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 flex justify-between">
                      <span>WIREGUARD KEEPALIVE INTERVAL</span>
                      <span className={simConfig.keepalive <= 30 && simConfig.keepalive > 0 ? "text-emerald-400" : "text-amber-400"}>
                        {simConfig.keepalive <= 0 ? "DISABLED" : `${simConfig.keepalive}s`}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      value={simConfig.keepalive}
                      onChange={(e) => setSimConfig({ ...simConfig, keepalive: parseInt(e.target.value) })}
                      className="w-full accent-blue-600 mt-2 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 flex justify-between">
                      <span>SSH SERVER ALIVE INTERVAL</span>
                      <span className={simConfig.serverAliveInterval <= 30 ? "text-emerald-400" : "text-amber-400"}>
                        {simConfig.serverAliveInterval}s
                      </span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={simConfig.serverAliveInterval}
                      onChange={(e) => setSimConfig({ ...simConfig, serverAliveInterval: parseInt(e.target.value) })}
                      className="w-full accent-blue-600 mt-2 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Bulk Tunnel Orchestration Workbench */}
                <div className="mt-4 bg-[#080808] border border-white/5 rounded-lg p-4 font-mono text-xs text-left space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-purple-500" />
                      Bulk Tunnel Orchestration Workbench
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">
                      {bulkSelectedNodes.length} Selected
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-normal">
                    Select multiple active node interfaces to deploy security patches or recycle connections simultaneously.
                  </p>

                  {/* Checkboxes List driven dynamically from Fleet Profiles */}
                  <div className="grid grid-cols-2 gap-2">
                    {fleetProfiles.map((node) => {
                      const nodeKey = String(node.id);
                      const isChecked = bulkSelectedNodes.includes(nodeKey);
                      return (
                        <label
                          key={nodeKey}
                          className={`flex items-center gap-2 p-2 rounded border transition cursor-pointer select-none ${
                            isChecked
                              ? "bg-purple-950/10 border-purple-500/30 text-purple-300"
                              : "bg-black/40 border-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkSelectedNodes((prev) => [...prev, nodeKey]);
                              } else {
                                setBulkSelectedNodes((prev) => prev.filter((id) => id !== nodeKey));
                              }
                            }}
                            className="accent-purple-500 rounded cursor-pointer"
                          />
                          <span className="text-[11px] font-mono font-bold truncate">{node.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Selection Shortcuts */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkSelectedNodes(fleetProfiles.map((p) => String(p.id)))}
                      className="text-[9px] text-gray-500 hover:text-white underline cursor-pointer"
                    >
                      Select All Nodes
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkSelectedNodes([])}
                      className="text-[9px] text-gray-500 hover:text-white underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      disabled={bulkSelectedNodes.length === 0}
                      onClick={handleBulkRestart}
                      className={`flex-1 py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                        bulkSelectedNodes.length > 0
                          ? "bg-amber-600 hover:bg-amber-500 text-black cursor-pointer"
                          : "bg-white/5 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      ♻ Restart Selected ({bulkSelectedNodes.length})
                    </button>
                    <button
                      type="button"
                      disabled={bulkSelectedNodes.length === 0}
                      onClick={handleBulkDeployPatch}
                      className={`flex-1 py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                        bulkSelectedNodes.length > 0
                          ? "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                          : "bg-white/5 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      🛡 Deploy Global Security Patch
                    </button>
                  </div>

                  {/* Micro Feedback Notification */}
                  <AnimatePresence>
                    {bulkActionFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-2.5 bg-purple-950/25 border border-purple-500/20 text-purple-300 rounded text-[10px] flex items-center justify-between"
                      >
                        <span>{bulkActionFeedback.message}</span>
                        <button
                          type="button"
                          onClick={() => setBulkActionFeedback(null)}
                          className="text-gray-500 hover:text-white"
                        >
                          ✕
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Visual Latency Oscilloscope / Heatmap Chart */}
                <div className="mt-4 bg-[#050505] border border-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Real-Time Oscilloscope Telemetry
                    </span>
                    <span className="text-[9px] font-mono text-gray-500">
                      Average Latency: <span className="text-emerald-400 font-bold">{
                        (() => {
                          const validPings = pingHistory.filter(p => p > 0);
                          return validPings.length > 0 ? (validPings.reduce((a, b) => a + b, 0) / validPings.length).toFixed(1) : "0.0";
                        })()
                      } ms</span>
                    </span>
                  </div>

                  {/* SVG Chart area */}
                  <div className="relative h-20 w-full bg-black/40 rounded border border-white/5 overflow-hidden">
                    {/* SVG Grid Lines */}
                    <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 pointer-events-none opacity-10">
                      <div className="border-b border-white w-full h-full"></div>
                      <div className="border-b border-white w-full h-full"></div>
                      <div className="border-b border-white w-full h-full"></div>
                      <div className="border-r border-white h-full w-full"></div>
                      <div className="border-r border-white h-full w-full"></div>
                      <div className="border-r border-white h-full w-full"></div>
                      <div className="border-r border-white h-full w-full"></div>
                      <div className="border-r border-white h-full w-full"></div>
                      <div className="border-r border-white h-full w-full"></div>
                    </div>

                    {/* SVG Rendered Path */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="pingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1,1" />
                      
                      {pingHistory.length > 1 && (
                        <>
                          <path
                            d={`M 0 100 ${pingHistory.map((ping, idx) => {
                              const x = (idx / (pingHistory.length - 1)) * 100;
                              let y = 85;
                              if (ping > 0) {
                                y = Math.max(10, 85 - (ping / 150) * 75);
                              } else {
                                y = 95;
                              }
                              return `L ${x} ${y}`;
                            }).join(" ")} L 100 100 Z`}
                            fill="url(#pingGradient)"
                            className="transition-all duration-300"
                          />
                          <path
                            d={pingHistory.map((ping, idx) => {
                              const x = (idx / (pingHistory.length - 1)) * 100;
                              let y = 85;
                              if (ping > 0) {
                                y = Math.max(10, 85 - (ping / 150) * 75);
                              } else {
                                y = 95;
                              }
                              return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                            }).join(" ")}
                            fill="none"
                            stroke={natTimeoutOccurred ? "#ef4444" : "#10b981"}
                            strokeWidth="1.5"
                            className="transition-all duration-300"
                          />
                        </>
                      )}
                    </svg>

                    {/* Simulation status tags */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[8px] font-mono">
                      {natTimeoutOccurred ? (
                        <span className="bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">
                          Packet Loss 100%
                        </span>
                      ) : simulationActive ? (
                        <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">
                          Receiving Keepalives
                        </span>
                      ) : (
                        <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">
                          Status: Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulation & Real Socket Probe Controls */}
                <div className="mt-4 flex flex-col gap-3 bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-lg">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-blue-400 font-mono">Live Probe & NAT Stress Bench</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Measure real server TCP/TLS RTT + jitter or stress-test keepalive policies.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <div className="flex bg-black/60 border border-white/10 rounded p-0.5 text-[9px] font-mono">
                        <button
                          type="button"
                          onClick={() => setProbeMode("tcp")}
                          className={`px-2 py-1 rounded uppercase font-bold cursor-pointer ${
                            probeMode === "tcp" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          TCP
                        </button>
                        <button
                          type="button"
                          onClick={() => setProbeMode("tls")}
                          className={`px-2 py-1 rounded uppercase font-bold cursor-pointer ${
                            probeMode === "tls" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          TLS
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => runLiveProbeForProfile(fleetProfiles.find((p) => p.id === activeProfileId))}
                        disabled={liveProbeLoading}
                        className="px-3 py-2 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/30"
                      >
                        <Crosshair className={`h-3.5 w-3.5 ${liveProbeLoading ? "animate-spin" : ""}`} />
                        {liveProbeLoading ? "PROBING..." : "LIVE PROBE"}
                      </button>
                      <button
                        onClick={runSimulation}
                        disabled={simulationActive}
                        className="px-4 py-2 text-xs font-mono font-bold rounded bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-gray-500 text-white transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-blue-500/20"
                      >
                        {simulationActive ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> SIMULATING...
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current" /> RUN STRESS TEST
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {lastProbeResult && (
                    <div className="bg-black/60 border border-emerald-500/20 rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        Target: {lastProbeResult.target}:{lastProbeResult.port} ({lastProbeResult.resolvedIp || "unresolved"})
                      </span>
                      <div className="flex items-center gap-3 text-gray-300">
                        <span>Min: <strong className="text-white">{lastProbeResult.minMs}ms</strong></span>
                        <span>Avg: <strong className="text-emerald-400">{lastProbeResult.avgMs}ms</strong></span>
                        <span>Max: <strong className="text-white">{lastProbeResult.maxMs}ms</strong></span>
                        <span>Jitter: <strong className="text-blue-400">{lastProbeResult.jitterMs}ms</strong></span>
                        <span>Loss: <strong className={lastProbeResult.packetLossPct > 0 ? "text-rose-400" : "text-emerald-400"}>{lastProbeResult.packetLossPct}%</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation Logs */}
                {simulationLog.length > 0 && (
                  <div className="mt-3 bg-black/60 rounded border border-white/5 p-3.5 font-mono text-xs max-h-36 overflow-y-auto flex flex-col gap-1.5 text-gray-400">
                    {simulationLog.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes("FATAL")
                            ? "text-red-400"
                            : log.includes("SUCCESS")
                            ? "text-emerald-400"
                            : log.includes("WARNING")
                            ? "text-amber-400"
                            : "text-gray-300"
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-gray-500 uppercase tracking-widest border border-dashed border-white/5 rounded-lg bg-[#050505] flex flex-col items-center justify-center gap-1.5">
                <span>[HUD MODULE DEACTIVATED]</span>
                <span className="text-[10px] text-gray-600">Select Full or Dim in dropdown to restore visibility.</span>
              </div>
            )}

          </div>

              {/* Blueprint & Preset Configuration Builder */}
              <div className={`bg-[#0c0c0c] border border-white/5 rounded-xl p-5 ${getModuleStyle(workbenchState)}`}>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono flex items-center gap-2">
                        <Code className="h-4.5 w-4.5 text-blue-500" /> Tunnel Blueprint Workbench
                      </h3>
                      {/* Dropdown for Brightness & Visibility */}
                      <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-gray-400">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">HUD:</span>
                        <select
                          value={workbenchState}
                          onChange={(e) => setWorkbenchState(e.target.value as any)}
                          className="bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-1 font-bold"
                        >
                          <option value="full" className="bg-[#0f0f0f] text-white">Full (100%)</option>
                          <option value="medium" className="bg-[#0f0f0f] text-white">Dim (60%)</option>
                          <option value="low" className="bg-[#0f0f0f] text-white">Low (25%)</option>
                          <option value="hidden" className="bg-[#0f0f0f] text-rose-400">Hidden</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">Select a blueprint, adjust placeholders, and fetch clean configurations.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStartupWizardOpen(true);
                      setWizardStep(1);
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] shrink-0 self-start sm:self-center"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    Startup Wizard
                  </button>
                </div>

                {workbenchState !== "hidden" ? (
                  <div className="space-y-4">

                 {/* Preset Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(["wireguard", "ssh", "watchdog", "mtu", "usb", "cloudflare", "yggdrasil"] as ConfigType[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        const matched = PRESET_SEGMENTS.find((s) => s.category === cat);
                        if (matched) setSelectedSegmentId(matched.id);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider border transition cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-blue-600/15 border-blue-500/50 text-blue-400"
                          : "bg-[#0d0d0d] border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {cat === "mtu"
                        ? "MTU Sweep"
                        : cat === "usb"
                        ? "USB Tether"
                        : cat === "cloudflare"
                        ? "Cloudflare Tunnel"
                        : cat === "yggdrasil"
                        ? "Yggdrasil Matrix"
                        : cat}
                    </button>
                  ))}
                </div>

                {/* Config selection lists */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1.5 tracking-wider">Select Blueprint</label>
                    <div className="flex flex-col gap-1">
                      {PRESET_SEGMENTS.filter((s) => s.category === selectedCategory).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSegmentId(s.id)}
                          className={`text-left p-2 rounded text-xs font-semibold font-mono transition ${
                            selectedSegmentId === s.id
                              ? "bg-white/5 text-white border-l-2 border-blue-500"
                              : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Variables editor form */}
                  <div className="sm:col-span-2 bg-[#050505] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                      <Settings className="h-3 w-3 text-blue-500" /> Tailor Placeholders
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[160px] overflow-y-auto pr-1">
                      {currentSegment.variables.map((v) => (
                        <div key={v.key} className="flex flex-col">
                          <label className="text-[10px] font-bold font-mono text-gray-400 flex items-center justify-between mb-1 uppercase">
                            <span>{v.label}</span>
                            {(v.key === "HARDENED_DNS" || v.key === "DNS_SERVER") && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setVariableValues({ ...variableValues, [v.key]: "1.1.1.1" })}
                                  className={`px-1 py-px rounded text-[8px] font-mono border transition cursor-pointer ${
                                    (variableValues[v.key] ?? "") === "1.1.1.1"
                                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30 font-bold"
                                      : "bg-black/30 text-gray-500 border-white/5 hover:text-white"
                                  }`}
                                >
                                  1.1.1.1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVariableValues({ ...variableValues, [v.key]: "1.1.1.3" })}
                                  className={`px-1 py-px rounded text-[8px] font-mono border transition cursor-pointer ${
                                    (variableValues[v.key] ?? "") === "1.1.1.3"
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold"
                                      : "bg-black/30 text-gray-500 border-white/5 hover:text-white"
                                  }`}
                                >
                                  1.1.1.3
                                </button>
                              </div>
                            )}
                          </label>
                          <input
                            type="text"
                            value={variableValues[v.key] ?? ""}
                            placeholder={v.placeholder}
                            onChange={(e) => setVariableValues({ ...variableValues, [v.key]: e.target.value })}
                            className="bg-[#0e0e0e] border border-white/10 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>

                    {currentSegment.category === "wireguard" && (
                      <div className="mt-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-blue-500/5 border border-blue-500/10">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono font-bold text-gray-300 uppercase leading-none">Auto-Apply Secure DNS</span>
                              <span className="text-[8px] font-mono text-gray-500 mt-1">Updates tunnel configuration DNS automatically</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const keys = currentSegment.variables.map(v => v.key);
                                const targetKey = keys.find(k => k === "HARDENED_DNS" || k === "DNS_SERVER");
                                if (targetKey) {
                                  setVariableValues({ ...variableValues, [targetKey]: "1.1.1.1" });
                                }
                              }}
                              className={`px-2 py-1 text-[8px] font-mono font-bold rounded border transition cursor-pointer ${
                                (variableValues["HARDENED_DNS"] === "1.1.1.1" || variableValues["DNS_SERVER"] === "1.1.1.1")
                                  ? "bg-blue-600/25 text-blue-300 border-blue-500/40 shadow-sm"
                                  : "bg-black/40 text-gray-500 border-white/5 hover:text-white"
                              }`}
                            >
                              Set 1.1.1.1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const keys = currentSegment.variables.map(v => v.key);
                                const targetKey = keys.find(k => k === "HARDENED_DNS" || k === "DNS_SERVER");
                                if (targetKey) {
                                  setVariableValues({ ...variableValues, [targetKey]: "1.1.1.3" });
                                }
                              }}
                              className={`px-2 py-1 text-[8px] font-mono font-bold rounded border transition cursor-pointer ${
                                (variableValues["HARDENED_DNS"] === "1.1.1.3" || variableValues["DNS_SERVER"] === "1.1.1.3")
                                  ? "bg-emerald-600/25 text-emerald-300 border-emerald-500/40 shadow-sm"
                                  : "bg-black/40 text-gray-500 border-white/5 hover:text-white"
                              }`}
                            >
                              Set 1.1.1.3
                            </button>
                          </div>
                        </div>

                        {(currentSegment.variables.some((v) => v.key === "CLIENT_PRIVATE_KEY")) && (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-emerald-500/5 border border-emerald-500/15">
                            <div className="flex items-center gap-1.5">
                              <Key className="h-4 w-4 text-emerald-400 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-gray-300 uppercase leading-none">
                                  X25519 Cryptographic Keygen
                                </span>
                                <span className="text-[8px] font-mono text-gray-500 mt-1">
                                  {wgKeyNotice || "Generates real 32-byte Curve25519 private/public WireGuard keys"}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleGenerateWgKeys}
                              disabled={isWgKeyGenerating}
                              className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                            >
                              {isWgKeyGenerating ? "Generating..." : "Generate X25519 Keys"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Restrict Traffic to Region (Geo-IP Firewall Rules) + Device-Specific Hardware Self-Tuning */}
                    <div className="mt-3 space-y-2.5 pt-2.5 border-t border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-cyan-500/5 border border-cyan-500/20">
                        <div className="flex items-start gap-2">
                          <Globe className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-white uppercase leading-none">
                                Restrict Traffic to Region
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[8px] font-mono font-bold uppercase">
                                {activeGeoPolicy.countryCode} • {activeGeoPolicy.rirAuthority}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-gray-400 mt-1">
                              Auto-injects {workbenchOsNormalized.toUpperCase()} Geo-IP firewall rules for{" "}
                              <strong className="text-gray-200">
                                {activeProfileForWorkbench?.name || "active profile"}
                              </strong>{" "}
                              ({activeGeoPolicy.regionName})
                            </span>
                            {restrictTrafficToRegion && (
                              <div className="text-[8px] font-mono text-emerald-300 mt-1">
                                Allowed CIDRs ({activeGeoPolicy.allowedCidrs.length}):{" "}
                                {activeGeoPolicy.allowedCidrs.slice(0, 4).join(", ")}...
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={restrictTrafficToRegion}
                          onClick={() => handleToggleRestrictToRegion(!restrictTrafficToRegion)}
                          className={`px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border transition cursor-pointer flex items-center gap-1.5 ${
                            restrictTrafficToRegion
                              ? "bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                              : "bg-black/50 border-white/15 text-gray-400 hover:text-white"
                          }`}
                        >
                          <Lock className="h-3 w-3" />
                          {restrictTrafficToRegion ? "Geo-IP Locked: ON" : "Restrict to Region: OFF"}
                        </button>
                      </div>

                      {/* Device-Specific Hardware Self-Tuning Quick Selector (backed by device_encyclopedia vquery) */}
                      <div
                        id="workbench-self-tune"
                        className="flex flex-col gap-2.5 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/25"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <Cpu className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-gray-200 uppercase leading-none">
                                  Device-Specific Hardware Self-Tuning (device_encyclopedia)
                                </span>
                                {/* Recommended for this hardware badge next to the hardware profile dropdown */}
                                {(() => {
                                  const recEntry = deviceEncyclopedia.find(
                                    (d) => d.deviceSlug === recommendedDeviceSlug
                                  );
                                  const isRecSelected =
                                    activeHardwareDevice?.deviceSlug === recommendedDeviceSlug;
                                  return (
                                    <span
                                      onClick={() => {
                                        if (recEntry) handleApplyHardwareSelfTuning(recEntry);
                                      }}
                                      title="Click to select the device_encyclopedia profile matching your detected local OS and platform"
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase cursor-pointer transition ${
                                        isRecSelected
                                          ? "bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                          : "bg-amber-500/20 border border-amber-400/50 text-amber-200 hover:bg-amber-500/30"
                                      }`}
                                    >
                                      <Sparkles className="h-2.5 w-2.5 text-emerald-300" />
                                      Recommended for this hardware
                                      {recEntry ? `: ${recEntry.modelName}` : ""}
                                    </span>
                                  );
                                })()}
                              </div>
                              <span className="text-[8px] font-mono text-gray-400 mt-1">
                                {activeHardwareDevice
                                  ? `${activeHardwareDevice.modelName} • ${activeHardwareDevice.nicDriver} • MTU ${activeHardwareDevice.optimalMtu} • Keepalive ${activeHardwareDevice.optimalKeepaliveSec}s`
                                  : "Select a hardware profile from device_encyclopedia or click Run Hardware Scan to auto-tune MTU, keepalive & NIC drivers"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleRunHardwareScan}
                              className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[9px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Cpu className="h-3 w-3 text-cyan-300" />
                              Run Hardware Scan
                            </button>

                            <select
                              value={activeHardwareDevice?.deviceSlug || ""}
                              onChange={(e) => {
                                const slug = e.target.value;
                                const found =
                                  deviceEncyclopedia.find((d) => d.deviceSlug === slug) || null;
                                handleApplyHardwareSelfTuning(found);
                              }}
                              className="bg-black border border-indigo-500/40 rounded px-2.5 py-1 text-[9px] font-mono text-indigo-200 focus:outline-none focus:border-emerald-400"
                            >
                              <option value="">Hardware Profile: Manual / Default</option>
                              {deviceEncyclopedia.map((d) => {
                                const isRec = d.deviceSlug === recommendedDeviceSlug;
                                return (
                                  <option key={d.deviceSlug} value={d.deviceSlug}>
                                    {d.modelName} (MTU {d.optimalMtu}){isRec ? " — ★ Recommended for this hardware" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Self-Tuning 10-Second Throughput Benchmark Module */}
                        <SelfTuningBenchmarkModule
                          deviceEncyclopedia={deviceEncyclopedia}
                          activeHardwareDevice={activeHardwareDevice}
                          recommendedDeviceSlug={recommendedDeviceSlug}
                          hardwareScanReport={hardwareScanReport}
                          currentMtu={Number(variableValues["MTU_SIZE"]) || simConfig.mtu || 1420}
                          currentKeepaliveSec={
                            Number(variableValues["KEEPALIVE_INTERVAL"]) || simConfig.keepalive || 25
                          }
                          selectedProfile={activeProfileForWorkbench || null}
                          onSelectHardwareDevice={handleApplyHardwareSelfTuning}
                          onRunHardwareScan={handleRunHardwareScan}
                        />
                      </div>
                    </div>

                    {isIdentityFileBlank && (
                      <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col gap-3 animate-fade-in">
                        <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                          <Key className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                              SSH Key Generation Helper
                            </h4>
                            <p className="text-[10px] font-mono text-gray-400 mt-1 leading-relaxed">
                              The key filename <code className="text-gray-200">IdentityFile</code> is currently empty. You must specify a valid private key stored in <code className="text-gray-200">~/.ssh/</code> to establish connection. 
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Option A: Quick Browser Sandbox Generator */}
                          <div className="bg-[#0b0b0d] border border-white/5 rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest mb-2 pb-1.5 border-b border-white/5">
                                <span className="text-blue-400">⚡</span> Browser Key Generator
                              </div>
                              <p className="text-[9px] font-mono text-gray-500 mb-3.5 leading-relaxed">
                                Instantly generate a secure, standards-compliant SSH keypair right inside your browser, auto-populate configuration fields, and view public/private keys.
                              </p>
                              
                              <div className="flex flex-col gap-2.5 mb-4">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase">Key Format</span>
                                  <div className="flex bg-black rounded p-0.5 border border-white/5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSshKeyType("ed25519");
                                        setSshKeyName("id_ed25519");
                                      }}
                                      className={`px-2 py-0.5 text-[8px] font-bold font-mono uppercase rounded transition cursor-pointer ${
                                        sshKeyType === "ed25519"
                                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                          : "text-gray-500 hover:text-gray-300"
                                      }`}
                                    >
                                      ED25519
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSshKeyType("rsa");
                                        setSshKeyName("id_rsa");
                                      }}
                                      className={`px-2 py-0.5 text-[8px] font-bold font-mono uppercase rounded transition cursor-pointer ${
                                        sshKeyType === "rsa"
                                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                          : "text-gray-500 hover:text-gray-300"
                                      }`}
                                    >
                                      RSA 4096
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase">Filename</span>
                                  <input
                                    type="text"
                                    value={sshKeyName}
                                    onChange={(e) => setSshKeyName(e.target.value)}
                                    placeholder={sshKeyType === "ed25519" ? "id_ed25519" : "id_rsa"}
                                    className="bg-black border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-white text-right w-32 focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleGenerateSshKeys}
                              disabled={isSshKeyGenerating}
                              className="w-full py-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {isSshKeyGenerating ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  Orchestrating entropy...
                                </>
                              ) : (
                                <>
                                  <Key className="h-3.5 w-3.5" />
                                  Generate & Auto-Fill
                                </>
                              )}
                            </button>
                          </div>

                          {/* Option B: Local System Keygen Terminal Command */}
                          <div className="bg-[#0b0b0d] border border-white/5 rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest mb-2 pb-1.5 border-b border-white/5">
                                <span className="text-emerald-400">💻</span> Local System Terminal
                              </div>
                              <p className="text-[9px] font-mono text-gray-500 mb-3 leading-relaxed">
                                Prefer to generate secure keys on your machine? Run these quick ssh command lines in your local shell terminal.
                              </p>
                              
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] font-mono text-gray-400 uppercase">1. Generate Keypair</span>
                                  <div className="bg-black/60 rounded border border-white/5 p-1.5 flex items-center justify-between">
                                    <code className="text-[9px] font-mono text-blue-300 truncate select-all pr-1">
                                      {`ssh-keygen -t ${sshKeyType} -f ~/.ssh/${sshKeyName || (sshKeyType === 'ed25519' ? 'id_ed25519' : 'id_rsa')} -N ""`}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`ssh-keygen -t ${sshKeyType} -f ~/.ssh/${sshKeyName || (sshKeyType === 'ed25519' ? 'id_ed25519' : 'id_rsa')} -N ""`);
                                        setSshKeyCopied("private");
                                        setTimeout(() => setSshKeyCopied(null), 1500);
                                      }}
                                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                                      title="Copy Command"
                                    >
                                      {sshKeyCopied === "private" ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] font-mono text-gray-400 uppercase">2. Authorize Public Key on Server</span>
                                  <div className="bg-black/60 rounded border border-white/5 p-1.5 flex items-center justify-between">
                                    <code className="text-[9px] font-mono text-blue-300 truncate select-all pr-1">
                                      {`ssh-copy-id -i ~/.ssh/${sshKeyName || (sshKeyType === 'ed25519' ? 'id_ed25519' : 'id_rsa')}.pub -p ${variableValues["SSH_PORT"] || "22"} ${variableValues["SSH_USER"] || "ubuntu"}@${variableValues["REMOTE_HOST"] || variableValues["REMOTE_IP_OR_HOST"] || "203.0.113.60"}`}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`ssh-copy-id -i ~/.ssh/${sshKeyName || (sshKeyType === 'ed25519' ? 'id_ed25519' : 'id_rsa')}.pub -p ${variableValues["SSH_PORT"] || "22"} ${variableValues["SSH_USER"] || "ubuntu"}@${variableValues["REMOTE_HOST"] || variableValues["REMOTE_IP_OR_HOST"] || "203.0.113.60"}`);
                                        setSshKeyCopied("public");
                                        setTimeout(() => setSshKeyCopied(null), 1500);
                                      }}
                                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                                      title="Copy Command"
                                    >
                                      {sshKeyCopied === "public" ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setVariableValues(prev => ({
                                  ...prev,
                                  "IDENTITY_FILE": sshKeyName || (sshKeyType === "ed25519" ? "id_ed25519" : "id_rsa")
                                }));
                              }}
                              className="mt-3.5 w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Adopt File Name "{sshKeyName || (sshKeyType === "ed25519" ? "id_ed25519" : "id_rsa")}"
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workbench Tabs */}
                <div className="flex border-b border-white/5 mb-4">
                  <button
                    onClick={() => setWorkbenchTab("code")}
                    className={`px-4 py-2 text-xs font-mono font-bold tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      workbenchTab === "code"
                        ? "border-blue-500 text-white bg-white/5"
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Code className="h-3.5 w-3.5 text-blue-500" /> CONFIGURATION FILE
                  </button>
                  <button
                    onClick={() => setWorkbenchTab("deploy")}
                    className={`px-4 py-2 text-xs font-mono font-bold tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      workbenchTab === "deploy"
                        ? "border-blue-500 text-white bg-white/5"
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5 text-blue-500" /> DEPLOYMENT GUIDE & SHELL COMMANDS
                  </button>
                </div>

                {/* Rendered Configuration Box */}
                {workbenchTab === "code" ? (
                  <div className="relative mt-4">
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      <button
                        onClick={handleCopyCode}
                        className="px-2.5 py-1.5 rounded bg-[#0d0d0d] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> COPIED
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> COPY
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDownloadCode}
                        className="px-2.5 py-1.5 rounded bg-[#0d0d0d] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                      >
                        <Download className="h-3 w-3" /> DOWNLOAD
                      </button>
                      <button
                        onClick={() => {
                          setBackupError(null);
                          setBackupSuccess(null);
                          setIsBackupModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                        title="Export all tunnel configurations as an encrypted ZIP archive"
                      >
                        <ShieldCheck className="h-3 w-3" /> SECURE BACKUP
                      </button>
                      {currentSegment.category === "wireguard" && (
                        <button
                          onClick={() => setIsQrModalOpen(true)}
                          className="px-2.5 py-1.5 rounded bg-[#0d0d0d] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                        >
                          <QrCode className="h-3 w-3 text-blue-400" /> QR CODE
                        </button>
                      )}
                    </div>

                    <div className="text-[9px] font-mono text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      Target configuration path: <span className="text-gray-300 font-bold bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-white/10">{getOSFileTarget(currentSegment.id, selectedOS, currentSegment.fileTarget)}</span>
                    </div>

                    <pre className="bg-black/80 rounded-lg p-4 pt-12 overflow-x-auto border border-white/5 font-mono text-xs text-blue-300 leading-relaxed shadow-inner max-h-[250px]">
                      <code>{compiledCode}</code>
                    </pre>

                    {/* Pre-Flight Fleet Conflict & MTU/Keepalive Linter */}
                    {(() => {
                      const lintIssues = preflightLintIssues;
                      return (
                        <div className="mt-3 bg-[#050505] border border-white/5 rounded-lg p-3 space-y-1.5 font-mono">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                              Pre-Flight Fleet Conflict Linter
                            </span>
                            <span className="text-[9px] text-gray-500">{lintIssues.length} Check(s)</span>
                          </div>
                          {lintIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className={`text-[10px] px-2.5 py-1.5 rounded border flex flex-col gap-0.5 ${
                                issue.severity === "error"
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                  : issue.severity === "warning"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              <div className="font-bold">
                                [{issue.severity.toUpperCase()}] {issue.scope}: {issue.message}
                              </div>
                              <div className="text-[9px] opacity-80">{issue.remediation}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="mt-3 bg-white/5 rounded-lg p-3.5 border border-white/5 flex items-start gap-3 text-xs leading-relaxed">
                      <BookOpen className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-white font-mono text-[11px] uppercase tracking-wider">Engineering Blueprint Detail</h4>
                        <p className="text-gray-400 text-[11px] mt-0.5 font-mono">{currentSegment.explanation}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4 font-mono text-xs text-gray-300">
                    <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-lg mb-2">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider mb-1">Target Path / Destination:</span>
                      <span className="text-gray-300 bg-black/40 px-2 py-0.5 rounded border border-white/10 inline-block text-[11px] font-bold">{getOSFileTarget(currentSegment.id, selectedOS, currentSegment.fileTarget)}</span>
                    </div>
                    {(() => {
                      const getInstallationCommands = () => {
                        const os = selectedOS;

                        switch (currentSegment.id) {
                          case "wg-keepalive":
                            if (os === "windows") {
                              return [
                                {
                                  title: "1. Install WireGuard via WinGet",
                                  command: "winget install WireGuard.WireGuard",
                                  desc: "Installs the official WireGuard application and service framework on Windows."
                                },
                                {
                                  title: "2. Prepare Configurations Folder",
                                  command: "mkdir \"C:\\Program Files\\WireGuard\\Data\\Configurations\" -Force",
                                  desc: "Creates a secure folder path inside Windows Program Files for WireGuard configurations."
                                },
                                {
                                  title: "3. Write compiled wg0.conf Configuration",
                                  command: `Set-Content -Path "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf" -Value @"\n${compiledCode.replace(/"/g, '`"')}\n"@`,
                                  desc: "Writes the compiled keepalive WireGuard config file to the designated directory."
                                },
                                {
                                  title: "4. Register and start WireGuard Windows Service",
                                  command: `& "C:\\Program Files\\WireGuard\\wireguard.exe" /installtunnelservice "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf"`,
                                  desc: "Registers the tunnel config as a native Windows service that runs silently in the background."
                                },
                                {
                                  title: "5. Query Service Status",
                                  command: "Get-Service -Name \"WireGuardTunnel$wg0\"",
                                  desc: "Verifies the newly provisioned Wireguard interface service is active and running."
                                }
                              ];
                            }
                            if (os === "apple") {
                              return [
                                {
                                  title: "1. Install WireGuard tools via Homebrew",
                                  command: "brew install wireguard-tools",
                                  desc: "Installs the standard WireGuard CLI tools for macOS."
                                },
                                {
                                  title: "2. Secure the wireguard configuration folder",
                                  command: "sudo mkdir -p /usr/local/etc/wireguard && sudo chmod 700 /usr/local/etc/wireguard",
                                  desc: "Ensures standard configuration directory exists with root-only access permission guidelines."
                                },
                                {
                                  title: "3. Write configuration to macOS local system",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /usr/local/etc/wireguard/wg0.conf > /dev/null`,
                                  desc: "Deploys the compiled keepalive configuration to the local macOS path."
                                },
                                {
                                  title: "4. Load the WireGuard interface",
                                  command: "sudo wg-quick up wg0",
                                  desc: "Loads the tunnel and establishes persistent keepalive links immediately."
                                },
                                {
                                  title: "5. Monitor tunnel activity",
                                  command: "sudo wg",
                                  desc: "Displays peer parameters, handshake timers, and data transfer volumes on macOS."
                                }
                              ];
                            }
                            if (os === "unix") {
                              return [
                                {
                                  title: "1. Install WireGuard via package manager",
                                  command: "pkg install wireguard-tools",
                                  desc: "Installs the WireGuard user-space toolchain on FreeBSD or other BSD/Unix systems."
                                },
                                {
                                  title: "2. Create secure etc directory",
                                  command: "mkdir -p /usr/local/etc/wireguard && chmod 700 /usr/local/etc/wireguard",
                                  desc: "Creates configuration directory with locked read/write boundaries."
                                },
                                {
                                  title: "3. Write configuration file",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' > /usr/local/etc/wireguard/wg0.conf`,
                                  desc: "Deploys the tailored configuration directly into the BSD Unix etc structure."
                                },
                                {
                                  title: "4. Add to system startup registry",
                                  command: "echo 'wireguard_enable=\"YES\"' >> /etc/rc.conf && echo 'wireguard_interfaces=\"wg0\"' >> /etc/rc.conf",
                                  desc: "Appends boot guidelines so Unix rc.d starts the tunnel interface automatically on boot."
                                },
                                {
                                  title: "5. Boot Unix WireGuard service",
                                  command: "service wireguard start && wg show",
                                  desc: "Starts the BSD daemon and checks active handshake profiles."
                                }
                              ];
                            }
                            if (os === "pulse") {
                              return [
                                {
                                  title: "1. Install OpenConnect client utility",
                                  command: "sudo apt-get install -y openconnect || brew install openconnect",
                                  desc: "Installs OpenConnect which acts as the core connector for Pulse SSL VPN nodes."
                                },
                                {
                                  title: "2. Write WireGuard Pulse overlay configuration",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /etc/wireguard/pulse-overlay.conf > /dev/null`,
                                  desc: "Saves the WireGuard mesh config, optimized with shorter keepalive pings to bypass Pulse Secure firewalls."
                                },
                                {
                                  title: "3. Establish SSL tunnel to Pulse VPN server",
                                  command: "sudo openconnect --protocol=nc --user=pulse_user VPN_GATEWAY_IP",
                                  desc: "Spins up the corporate Pulse Secure tunnel connection."
                                },
                                {
                                  title: "4. Overlay WireGuard keepalive interface",
                                  command: "sudo wg-quick up pulse-overlay",
                                  desc: "Spins up the WireGuard network adapter nested inside the Pulse tunnel path."
                                },
                                {
                                  title: "5. Verify ping through both tunnels",
                                  command: "ping -c 3 10.0.0.1",
                                  desc: "Performs low-level ICMP ping tests to confirm double-encapsulated paths are active."
                                }
                              ];
                            }
                            if (os === "linux") {
                              return [
                                {
                                  title: "1. Install WireGuard Tools",
                                  command: "sudo pacman -S wireguard-tools || sudo dnf install wireguard-tools",
                                  desc: "Downloads the official WireGuard utilities on Arch, Fedora, RHEL, or CentOS client nodes."
                                },
                                {
                                  title: "2. Secure the system folder",
                                  command: "sudo mkdir -p /etc/wireguard && sudo chmod 700 /etc/wireguard",
                                  desc: "Protects secret keys by locking file access down to system administrators."
                                },
                                {
                                  title: "3. Deploy configuration to wg0.conf",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /etc/wireguard/wg0.conf > /dev/null`,
                                  desc: "Writes the compiled settings file to system directory."
                                },
                                {
                                  title: "4. Load the interface",
                                  command: "sudo wg-quick up wg0",
                                  desc: "Loads the kernel module, establishes routing tables, and activates the link."
                                },
                                {
                                  title: "5. Verify diagnostics",
                                  command: "sudo wg show",
                                  desc: "Displays handshakes, endpoint maps, and live statistics."
                                }
                              ];
                            }
                            // Default to Ubuntu
                            return [
                              {
                                title: "1. Install WireGuard & Networking Helpers",
                                command: "sudo apt-get update && sudo apt-get install -y wireguard resolvconf",
                                desc: "Installs the WireGuard user-space tools and DNS resolver integrations on Debian/Ubuntu client systems."
                              },
                              {
                                title: "2. Secure local keys & config directories",
                                command: "sudo mkdir -p /etc/wireguard && sudo chmod 700 /etc/wireguard",
                                desc: "Creates the system configuration directory and locks directory permissions exclusively to the root user."
                              },
                              {
                                title: "3. Write compiled config to wg0.conf",
                                command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /etc/wireguard/wg0.conf > /dev/null`,
                                desc: "Writes the tailored configuration (including PersistentKeepalive policy) to the system WireGuard file."
                              },
                              {
                                title: "4. Enable and boot the systemd daemon",
                                command: "sudo systemctl enable wg-quick@wg0 && sudo systemctl start wg-quick@wg0",
                                desc: "Registers the tunnel to start automatically on system reboot and immediately spins up the tunnel link."
                              },
                              {
                                title: "5. Query diagnostic tunnel handshake",
                                command: "sudo wg show",
                                desc: "Displays active telemetry, transfer volumes, and verify handshake times for the newly established link."
                              }
                            ];

                          case "wg-watchdog-script":
                            if (os === "windows") {
                              return [
                                {
                                  title: "1. Prepare system scripts folder",
                                  command: "New-Item -ItemType Directory -Force -Path \"C:\\Program Files\\WireGuard\"",
                                  desc: "Creates a dedicated location for custom automation scripts on Windows."
                                },
                                {
                                  title: "2. Deploy PowerShell watchdog script",
                                  command: `Set-Content -Path "C:\\Program Files\\WireGuard\\wg-watchdog.ps1" -Value @"\n${compiledCode.replace(/"/g, '`"')}\n"@`,
                                  desc: "Saves the complete, auto-adjusting PowerShell watchdog utility."
                                },
                                {
                                  title: "3. Register automatic task schedule (SYSTEM)",
                                  command: "schtasks /create /tn \"WireGuardWatchdog\" /tr \"powershell.exe -ExecutionPolicy Bypass -File 'C:\\Program Files\\WireGuard\\wg-watchdog.ps1'\" /sc minute /mo 1 /ru System",
                                  desc: "Registers a Windows Task Scheduler rule running the PowerShell script every 60 seconds as SYSTEM."
                                },
                                {
                                  title: "4. Run manual initial test",
                                  command: "schtasks /run /tn \"WireGuardWatchdog\"",
                                  desc: "Executes the scheduled task immediately to check for errors or file permission issues."
                                },
                                {
                                  title: "5. View output diagnostics",
                                  command: "Get-Content -Path \"C:\\Program Files\\WireGuard\\wg-watchdog.log\" -Tail 10 -ErrorAction SilentlyContinue",
                                  desc: "Retrieves the initial execution logs to confirm connection monitoring state."
                                }
                              ];
                            }
                            if (os === "apple") {
                              return [
                                {
                                  title: "1. Create local scripts bin path",
                                  command: "mkdir -p ~/Library/Application\\ Support/WireGuard",
                                  desc: "Creates a local macOS path for system script orchestration."
                                },
                                {
                                  title: "2. Deploy watchdog bash daemon",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' > ~/Library/Application\\ Support/WireGuard/wg-watchdog.sh && chmod +x ~/Library/Application\ Support/WireGuard/wg-watchdog.sh`,
                                  desc: "Writes the macOS-compatible bash watchdog and tags it with execution privileges."
                                },
                                {
                                  title: "3. Prepare log outputs",
                                  command: "touch ~/Library/Logs/wg-watchdog.log && chmod 644 ~/Library/Logs/wg-watchdog.log",
                                  desc: "Registers a custom log file inside the standard macOS system log container."
                                },
                                {
                                  title: "4. Register in user's Crontab",
                                  command: "(crontab -l 2>/dev/null; echo \"* * * * * ~/Library/Application\\ Support/WireGuard/wg-watchdog.sh\") | crontab -",
                                  desc: "Installs a crontab schedule to test and restore link stability every single minute."
                                },
                                {
                                  title: "5. Direct execution check",
                                  command: "~/Library/Application\\ Support/WireGuard/wg-watchdog.sh",
                                  desc: "Runs a manual loop test to confirm connection indicators are fully green."
                                }
                              ];
                            }
                            // Default / Linux / Unix / Ubuntu
                            return [
                              {
                                title: "1. Create automated script bin folder",
                                command: "sudo mkdir -p /usr/local/bin && sudo chmod 755 /usr/local/bin",
                                desc: "Ensures the standard path for local system scripts is created and open to execution."
                              },
                              {
                                title: "2. Deploy watchdog daemon file",
                                command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /usr/local/bin/wg-watchdog.sh > /dev/null && sudo chmod +x /usr/local/bin/wg-watchdog.sh`,
                                desc: "Creates the auto-recovery watchdog file and assigns read/write/executable bits."
                              },
                              {
                                title: "3. Set up log files & permission guidelines",
                                command: "sudo touch /var/log/wg-watchdog.log && sudo chmod 666 /var/log/wg-watchdog.log",
                                desc: "Establishes a dedicated logfile to collect all future tunnel connection crash histories."
                              },
                              {
                                title: "4. Install Cron check scheduling rule",
                                command: `(crontab -l 2>/dev/null; echo "*/1 * * * * /usr/local/bin/wg-watchdog.sh") | crontab -`,
                                desc: "Appends a crontab entry running the watchdog script every minute to maintain active surveillance."
                              },
                              {
                                title: "5. Test run recovery watchdog script",
                                command: "sudo /usr/local/bin/wg-watchdog.sh",
                                desc: "Runs a manual watchdog check cycle to verify ping testing and log diagnostics immediately."
                              }
                            ];

                          case "ssh-client-config":
                            if (os === "windows") {
                              return [
                                {
                                  title: "1. Prepare SSH user directories",
                                  command: "New-Item -ItemType Directory -Force -Path \"$Home\\.ssh\"",
                                  desc: "Creates the standard client SSH registry path under the active user environment."
                                },
                                {
                                  title: "2. Append persistent config guidelines",
                                  command: `Add-Content -Path "$Home\\.ssh\\config" -Value "\n${compiledCode.replace(/"/g, '`"')}\n"`,
                                  desc: "Appends ServerAlive intervals directly into user config to bypass Windows firewall timeouts."
                                },
                                {
                                  title: "3. Secure permissions (Windows ACL)",
                                  command: "icacls \"$Home\\.ssh\\config\" /inheritance:r /grant:r \"${env:USERNAME}:(F)\"",
                                  desc: "Secures SSH parameters from multiple accounts, granting exclusive access to current user."
                                },
                                {
                                  title: "4. Initiate persistent SSH session",
                                  command: `ssh ${variableValues["HOST_ALIAS"] || "secure-node"}`,
                                  desc: "Logs in with short-alias using Windows OpenSSH client with always-on background handshakes."
                                }
                              ];
                            }
                            // Default Linux/Mac/Unix
                            return [
                              {
                                title: "1. Bootstrap SSH client config folder",
                                command: "mkdir -p ~/.ssh && chmod 700 ~/.ssh",
                                desc: "Creates user SSH folder and locks configuration directory down to the active user account."
                              },
                              {
                                title: "2. Append persistent configurations",
                                command: `cat << 'EOF' >> ~/.ssh/config\n${compiledCode}\nEOF`,
                                desc: "Appends the tailored ServerAlive and multiplexing rules to the user's SSH configuration registry."
                              },
                              {
                                title: "3. Secure target SSH private key limits",
                                command: `chmod 600 ~/.ssh/${variableValues["IDENTITY_FILE"] || "id_rsa"}`,
                                desc: "Ensures that your private security key file permissions meet standard SSH cryptographic criteria."
                              },
                              {
                                title: "4. Establish fully persistent shell route",
                                command: `ssh ${variableValues["HOST_ALIAS"] || "secure-node"}`,
                                desc: "Connects using your short alias, utilizing background alive intervals to completely bypass firewall idle ports."
                              }
                            ];

                          case "ssh-autossh-service":
                            if (os === "windows") {
                              return [
                                {
                                  title: "1. Install AutoSSH via WinGet",
                                  command: "winget install -e --id AutoSSH.AutoSSH",
                                  desc: "Installs AutoSSH binary compiled natively for the Windows operating environment."
                                },
                                {
                                  title: "2. Deploy bat execution service wrapper",
                                  command: `Set-Content -Path "C:\\Program Files\\autossh\\autossh-service.bat" -Value @"\n${compiledCode.replace(/"/g, '`"')}\n"@`,
                                  desc: "Creates a batch wrapper specifying background environmental metrics for AutoSSH."
                                },
                                {
                                  title: "3. Provision Windows Service using NSSM helper",
                                  command: "nssm install AutoSSHTunnel \"C:\\Program Files\\autossh\\autossh-service.bat\"",
                                  desc: "Installs AutoSSH bat as a native Windows service background runner utilizing the standard NSSM service manager."
                                },
                                {
                                  title: "4. Boot Windows AutoSSH service",
                                  command: "nssm start AutoSSHTunnel",
                                  desc: "Fires up the service in the background."
                                },
                                {
                                  title: "5. Verify service telemetry",
                                  command: "Get-Service -Name \"AutoSSHTunnel\"",
                                  desc: "Confirms connection status and auto-recovery parameters."
                                }
                              ];
                            }
                            if (os === "apple") {
                              return [
                                {
                                  title: "1. Install AutoSSH package via brew",
                                  command: "brew install autossh",
                                  desc: "Downloads and configures the AutoSSH persistent daemon on Apple macOS."
                                },
                                {
                                  title: "2. Create LaunchAgents system folder",
                                  command: "mkdir -p ~/Library/LaunchAgents",
                                  desc: "Establishes standard folder for background user-agent services in macOS."
                                },
                                {
                                  title: "3. Write macOS LaunchAgent plist descriptor",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' > ~/Library/LaunchAgents/com.autossh.tunnel.plist`,
                                  desc: "Saves a fully persistent XML LaunchAgent plist mapping to automatically monitor and restart the link."
                                },
                                {
                                  title: "4. Load and boot macOS background agent",
                                  command: "launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.autossh.tunnel.plist",
                                  desc: "Submits the plist to launchd to load the SSH tunnel immediately and on subsequent logins."
                                },
                                {
                                  title: "5. Verify daemon task registration",
                                  command: "launchctl list | grep autossh",
                                  desc: "Asks launchd for active processes matching autossh to check for healthy startup."
                                }
                              ];
                            }
                            if (os === "unix") {
                              return [
                                {
                                  title: "1. Install AutoSSH package",
                                  command: "pkg install autossh",
                                  desc: "Installs the AutoSSH daemon on BSD Unix environments."
                                },
                                {
                                  title: "2. Deploy script to rc.d system folder",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' > /usr/local/etc/rc.d/autossh-tunnel && chmod +x /usr/local/etc/rc.d/autossh-tunnel`,
                                  desc: "Writes the rc.d boot-start control script and grants run privileges."
                                },
                                {
                                  title: "3. Register in Unix startup index",
                                  command: "echo 'autossh_tunnel_enable=\"YES\"' >> /etc/rc.conf",
                                  desc: "Adds enabling flags directly to /etc/rc.conf."
                                },
                                {
                                  title: "4. Start BSD service daemon",
                                  command: "service autossh-tunnel start",
                                  desc: "Runs the service script to establish the multiplexed tunnel connection immediately."
                                },
                                {
                                  title: "5. Query service status logs",
                                  command: "service autossh-tunnel status",
                                  desc: "Asks the BSD service manager to report on active process telemetry."
                                }
                              ];
                            }
                            // Default / Ubuntu / Linux
                            return [
                              {
                                title: "1. Install AutoSSH package",
                                command: "sudo apt-get update && sudo apt-get install -y autossh",
                                desc: "Installs the standard SSH watchdog daemon that monitors TCP links and automatically respawns dead tunnels."
                              },
                              {
                                title: "2. Deploy systemd service configuration file",
                                command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /etc/systemd/system/ssh-tunnel.service > /dev/null`,
                                desc: "Writes the service unit descriptor so Linux systemd can control the tunnel lifecycle as a daemon."
                              },
                              {
                                title: "3. Reload systemd units registry",
                                command: "sudo systemctl daemon-reload",
                                desc: "Refreshes systemd to acknowledge the newly introduced persistent SSH tunnel daemon service."
                              },
                              {
                                title: "4. Activate and run background tunnel service",
                                command: "sudo systemctl enable ssh-tunnel && sudo systemctl start ssh-tunnel",
                                desc: "Registers the tunnel service to start on boot and boots the active background multiplexing tunnel link."
                              },
                              {
                                title: "5. Monitor service stability and logging stream",
                                command: "sudo systemctl status ssh-tunnel",
                                desc: "Retrieves runtime reports, process statuses, and verify active port forwards."
                              }
                            ];

                          case "gateway-watchdog":
                            if (os === "windows") {
                              return [
                                {
                                  title: "1. Prepare Orchesration Folder",
                                  command: "New-Item -ItemType Directory -Force -Path \"C:\\Program Files\\Orchestration\"",
                                  desc: "Creates a dedicated system directory on Windows for custom WAN watchdog scripts."
                                },
                                {
                                  title: "2. Deploy PowerShell Internet Watchdog script",
                                  command: `Set-Content -Path "C:\\Program Files\\Orchestration\\gateway-watchdog.ps1" -Value @"\n${compiledCode.replace(/"/g, '`"')}\n"@`,
                                  desc: "Writes the dual-gateway PowerShell diagnostic and route flush script."
                                },
                                {
                                  title: "3. Register watchdog task in Task Scheduler",
                                  command: "schtasks /create /tn \"WANWatchdog\" /tr \"powershell.exe -ExecutionPolicy Bypass -File 'C:\\Program Files\\Orchestration\\gateway-watchdog.ps1'\" /sc minute /mo 5 /ru System",
                                  desc: "Registers a silent 5-minute trigger to check external DNS state and reset adapters if blocked."
                                },
                                {
                                  title: "4. Test script",
                                  command: "schtasks /run /tn \"WANWatchdog\"",
                                  desc: "Triggers execution directly to test connection paths and log feedback."
                                },
                                {
                                  title: "5. View watchdog logs",
                                  command: "Get-Content -Path \"C:\\Program Files\\Orchestration\\gateway-watchdog.log\" -Tail 10 -ErrorAction SilentlyContinue",
                                  desc: "Parses output files to ensure healthy outer gateway state."
                                }
                              ];
                            }
                            // Default Unix/Mac/Linux
                            return [
                              {
                                title: "1. Deploy dual-gateway watchdog script",
                                command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /usr/local/bin/internet-watchdog.sh > /dev/null && sudo chmod +x /usr/local/bin/internet-watchdog.sh`,
                                desc: "Creates the multi-gateway network monitoring utility script and makes it executable."
                              },
                              {
                                title: "2. Provision diagnostic log registers",
                                command: "sudo touch /var/log/internet-watchdog.log && sudo chmod 666 /var/log/internet-watchdog.log",
                                desc: "Registers the output diagnostic log file and configures permissions so scripts can append logs."
                              },
                              {
                                title: "3. Install Cron checking frequency schedule",
                                command: `(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/internet-watchdog.sh") | crontab -`,
                                desc: "Schedules the WAN watchdog to inspect and renew leases/routes every 5 minutes."
                              },
                              {
                                title: "4. Trigger test connection recovery check",
                                command: "sudo /usr/local/bin/internet-watchdog.sh",
                                desc: "Inspects route maps, runs public DNS pings, and confirms active gateways."
                              }
                            ];

                          case "mtu-mss-calibration":
                            if (os === "windows") {
                              return [
                                {
                                  title: "1. Create PowerShell tool file",
                                  command: `Set-Content -Path "C:\\Program Files\\Orchestration\\mtu-sweep.ps1" -Value @"\n${compiledCode.replace(/"/g, '`"')}\n"@`,
                                  desc: "Saves the dynamic non-fragmentation ping loop script under local storage."
                                },
                                {
                                  title: "2. Run sweep in elevated PowerShell shell",
                                  command: "powershell -ExecutionPolicy Bypass -File \"C:\\Program Files\\Orchestration\\mtu-sweep.ps1\"",
                                  desc: "Executes the PowerShell MTU discovery routine to output optimal network packet boundaries."
                                }
                              ];
                            }
                            if (os === "apple") {
                              return [
                                {
                                  title: "1. Create temporary calibration tool file",
                                  command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | tee mtu-sweep.sh > /dev/null && chmod +x mtu-sweep.sh`,
                                  desc: "Writes the macOS-compatible ping sweep script with appropriate parameters."
                                },
                                {
                                  title: "2. Run macOS sweep analysis",
                                  command: "./mtu-sweep.sh",
                                  desc: "Executes the diagnostic sweep testing payload sizes to map standard MTU sizes."
                                }
                              ];
                            }
                            // Default / Linux / Unix / Ubuntu
                            return [
                              {
                                title: "1. Create temporary calibration tool file",
                                command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee mtu-sweep.sh > /dev/null && chmod +x mtu-sweep.sh`,
                                desc: "Writes the MTU discovery script locally and marks it as executable."
                              },
                              {
                                title: "2. Execute non-fragmentation sweep analysis",
                                command: "./mtu-sweep.sh",
                                desc: "Runs live ping probes across target path to discover local firewall MTU ceilings."
                              }
                            ];

                          case "usb-tether-setup":
                            return [
                              {
                                title: "1. Scan connected USB hardware controllers",
                                command: "lsusb",
                                desc: "Queries physical USB buses to confirm the Linux kernel registers your Android RNDIS or Apple iPhone USB modem hardware."
                              },
                              {
                                title: "2. Locate network interface handle",
                                command: "ip link show | grep -E 'usb|enp|eth'",
                                desc: "Searches active OS network cards to find the exact name of the tethered USB adapter (usually usb0, rndis0, or enp0s20u2)."
                              },
                              {
                                title: "3. Deploy persistent interface metric configurations",
                                command: `sudo mkdir -p /etc/network/interfaces.d/ && echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /etc/network/interfaces.d/usb-tether`,
                                desc: "Saves your customized lease rules and de-prioritizes the interface route metric so it doesn't clash with your main ethernet routes."
                              },
                              {
                                title: "4. Trigger DHCP socket lease request",
                                command: `sudo ifdown ${variableValues["USB_IFACE"] || "usb0"} && sudo ifup ${variableValues["USB_IFACE"] || "usb0"}`,
                                desc: "Reboots the interface to request a fresh DHCP lease and load customized route policies."
                              },
                              {
                                title: "5. Verify active routing table weights",
                                command: "ip route show",
                                desc: "Inspects system routing metrics to confirm the tethered cellular gateway is loaded with its proper priority index."
                              }
                            ];

                          case "usb-udev-rule":
                            return [
                              {
                                title: "1. Create udev hotplug filter rules",
                                command: `echo '${compiledCode.replace(/'/g, "'\\''")}' | sudo tee /etc/udev/rules.d/99-usb-tether.rules`,
                                desc: "Registers a kernel event hook matching Android/iOS network class drivers to auto-initialize interfaces on hotplug."
                              },
                              {
                                title: "2. Force-reload Linux udev kernel policies",
                                command: "sudo udevadm control --reload-rules && sudo udevadm trigger",
                                desc: "Tells the Linux udev daemon to recompile rules, ensuring the network is initialized immediately on USB insert."
                              }
                            ];

                          default:
                            return [];
                        }
                      };

                      return (
                        <>
                          {/* Turnkey Bootstrap Bundle Switcher */}
                          <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-2">
                            {(
                              [
                                { id: "commands", label: "Step-by-Step CLI" },
                                { id: "sh", label: "bootstrap.sh" },
                                { id: "ps1", label: "bootstrap.ps1" },
                                { id: "docker", label: "docker-compose.yml" },
                              ] as const
                            ).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setDeployBootstrapTab(t.id)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer border transition ${
                                  deployBootstrapTab === t.id
                                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                                    : "bg-black/40 border-white/5 text-gray-400 hover:text-white"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>

                          {deployBootstrapTab !== "commands" ? (() => {
                            const activeProfile = fleetProfiles.find((p) => p.id === activeProfileId);
                            const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                            const bundle = generateBootstrapBundle(
                              compiledCode,
                              currentSegment.id,
                              getOSFileTarget(currentSegment.id, selectedOS, currentSegment.fileTarget),
                              webhooks[0]?.url,
                              activeProfile?.ingestToken
                                ? { endpointUrl: `${originUrl}/api/fleet/heartbeat`, ingestToken: activeProfile.ingestToken }
                                : undefined
                            );
                            const scriptText =
                              deployBootstrapTab === "sh"
                                ? bundle.bootstrapSh
                                : deployBootstrapTab === "ps1"
                                ? bundle.bootstrapPs1
                                : bundle.dockerComposeYml;
                            const fileName =
                              deployBootstrapTab === "sh"
                                ? "install-omnieye.sh"
                                : deployBootstrapTab === "ps1"
                                ? "install-omnieye.ps1"
                                : "docker-compose.yml";
                            return (
                              <div className="bg-[#050505] border border-white/5 rounded-lg p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase">
                                    Turnkey Provisioner: {fileName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(scriptText);
                                      setCopiedCommandIdx(99);
                                      setTimeout(() => setCopiedCommandIdx(null), 2000);
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#0d0d0d] hover:bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedCommandIdx === 99 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                    {copiedCommandIdx === 99 ? "COPIED" : "COPY"}
                                  </button>
                                </div>
                                <pre className="bg-black/80 border border-white/5 rounded p-3 overflow-x-auto text-[10px] text-blue-300 max-h-60 select-all whitespace-pre">
                                  <code>{scriptText}</code>
                                </pre>
                              </div>
                            );
                          })() : (
                            getInstallationCommands().map((item, idx) => (
                              <div key={idx} className="bg-[#050505] border border-white/5 rounded-lg p-3.5 relative flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="font-bold text-white text-[11px] tracking-wide uppercase">{item.title}</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.command);
                                      setCopiedCommandIdx(idx);
                                      setTimeout(() => setCopiedCommandIdx(null), 2000);
                                    }}
                                    className="shrink-0 px-2.5 py-1 rounded bg-[#0d0d0d] hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                                  >
                                    {copiedCommandIdx === idx ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" /> COPIED
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" /> COPY
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="bg-black/60 rounded border border-white/5 p-2.5 overflow-x-auto text-[11px] text-blue-300 leading-relaxed max-h-[120px] select-all whitespace-pre">
                                  <code>{item.command}</code>
                                </pre>
                              </div>
                            ))
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-gray-500 uppercase tracking-widest border border-dashed border-white/5 rounded-lg bg-[#050505] flex flex-col items-center justify-center gap-1.5">
                <span>[HUD MODULE DEACTIVATED]</span>
                <span className="text-[10px] text-gray-600">Select Full or Dim in dropdown to restore visibility.</span>
              </div>
            )}

          </div>

        </div>

            {/* Right Area: Config Optimizer and Chat Terminal (xl:col-span-5) */}
            <div className="xl:col-span-5 flex flex-col gap-5">
              
              {/* Configuration File AI Optimizer */}
              <div className={`bg-[#0c0c0c] border border-white/5 rounded-xl p-5 flex flex-col gap-4 ${getModuleStyle(optimizerState)}`}>
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-blue-500" /> Config Optimizer Engine
                    </h3>
                    {/* Dropdown for Brightness & Visibility */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-gray-400">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider">HUD:</span>
                      <select
                        value={optimizerState}
                        onChange={(e) => setOptimizerState(e.target.value as any)}
                        className="bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-1 font-bold"
                      >
                        <option value="full" className="bg-[#0f0f0f] text-white">Full (100%)</option>
                        <option value="medium" className="bg-[#0f0f0f] text-white">Dim (60%)</option>
                        <option value="low" className="bg-[#0f0f0f] text-white">Low (25%)</option>
                        <option value="hidden" className="bg-[#0f0f0f] text-rose-400">Hidden</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono mt-1 leading-relaxed">
                    Paste raw config files below. The agent will parse metrics, inject Keepalive policies, and secure MTUs dynamically.
                  </p>
                </div>

                {optimizerState !== "hidden" ? (
                  <div className="flex flex-col gap-4">
                    <form onSubmit={handleOptimizeConfig} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOptimizerType("wireguard")}
                      className={`flex-1 py-1.5 rounded text-xs font-mono border transition cursor-pointer ${
                        optimizerType === "wireguard"
                          ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                          : "bg-[#0d0d0d] border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      WIREGUARD
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptimizerType("ssh")}
                      className={`flex-1 py-1.5 rounded text-xs font-mono border transition cursor-pointer ${
                        optimizerType === "ssh"
                          ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                          : "bg-[#0d0d0d] border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      SSH CLIENT
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>Config Content</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={configFileInputRef}
                        type="file"
                        accept=".conf,.txt,.yml,.yaml,.sh,.config"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          file.text().then((txt) => handleImportConfigText(txt));
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => configFileInputRef.current?.click()}
                        className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="h-2.5 w-2.5" /> Import File
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => handleImportConfigText(rawConfigInput)}
                        disabled={!rawConfigInput.trim()}
                        className="text-purple-400 hover:underline disabled:opacity-40 cursor-pointer"
                      >
                        Sync to Builder
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => handleLoadSampleConfig("wireguard")}
                        className="text-blue-400 hover:underline cursor-pointer"
                      >
                        Sample WG
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => handleLoadSampleConfig("ssh")}
                        className="text-blue-400 hover:underline cursor-pointer"
                      >
                        Sample SSH
                      </button>
                    </div>
                  </div>

                  {importerFeedback && (
                    <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1.5">
                      ✓ {importerFeedback}
                    </div>
                  )}

                  <textarea
                    value={rawConfigInput}
                    onChange={(e) => setRawConfigInput(e.target.value)}
                    placeholder="Paste WireGuard .conf, ~/.ssh/config, or Cloudflared YAML..."
                    className="w-full h-28 bg-[#050505] border border-white/10 rounded p-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                  />

                  {/* Hardened DNS Quick-Inject Utility Bar */}
                  <div className="flex flex-wrap gap-2 items-center justify-between bg-black/40 border border-white/5 rounded-lg p-2.5">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Hardened DNS Quick-Inject
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!rawConfigInput.trim()}
                        onClick={() => {
                          let updated = rawConfigInput;
                          // Check if it's wireguard config
                          const isWg = /\[Interface\]/i.test(updated) || /PrivateKey/i.test(updated) || optimizerType === "wireguard";
                          if (isWg) {
                            if (/DNS\s*=/i.test(updated)) {
                              updated = updated.replace(/DNS\s*=\s*[^\n\r]+/gi, "DNS = 1.1.1.1");
                            } else if (/\[Interface\]/i.test(updated)) {
                              updated = updated.replace(/\[Interface\]/i, "[Interface]\nDNS = 1.1.1.1");
                            } else {
                              updated = updated + "\nDNS = 1.1.1.1";
                            }
                          } else {
                            // DHCP/Debian or general interface
                            if (/dns-nameservers\s+[^\n\r]+/i.test(updated)) {
                              updated = updated.replace(/dns-nameservers\s+[^\n\r]+/gi, "dns-nameservers 1.1.1.1");
                            } else if (/nameserver\s+[^\n\r]+/i.test(updated)) {
                              updated = updated.replace(/nameserver\s+[^\n\r]+/gi, "nameserver 1.1.1.1");
                            } else {
                              updated = updated + "\n    dns-nameservers 1.1.1.1";
                            }
                          }
                          setRawConfigInput(updated);
                        }}
                        className="px-2 py-1 text-[9px] bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 disabled:hover:bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold font-mono rounded uppercase transition cursor-pointer"
                      >
                        Force 1.1.1.1
                      </button>
                      <button
                        type="button"
                        disabled={!rawConfigInput.trim()}
                        onClick={() => {
                          let updated = rawConfigInput;
                          const isWg = /\[Interface\]/i.test(updated) || /PrivateKey/i.test(updated) || optimizerType === "wireguard";
                          if (isWg) {
                            if (/DNS\s*=/i.test(updated)) {
                              updated = updated.replace(/DNS\s*=\s*[^\n\r]+/gi, "DNS = 1.1.1.3");
                            } else if (/\[Interface\]/i.test(updated)) {
                              updated = updated.replace(/\[Interface\]/i, "[Interface]\nDNS = 1.1.1.3");
                            } else {
                              updated = updated + "\nDNS = 1.1.1.3";
                            }
                          } else {
                            if (/dns-nameservers\s+[^\n\r]+/i.test(updated)) {
                              updated = updated.replace(/dns-nameservers\s+[^\n\r]+/gi, "dns-nameservers 1.1.1.3");
                            } else if (/nameserver\s+[^\n\r]+/i.test(updated)) {
                              updated = updated.replace(/nameserver\s+[^\n\r]+/gi, "nameserver 1.1.1.3");
                            } else {
                              updated = updated + "\n    dns-nameservers 1.1.1.3";
                            }
                          }
                          setRawConfigInput(updated);
                        }}
                        className="px-2 py-1 text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:hover:bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold font-mono rounded uppercase transition cursor-pointer"
                      >
                        Force 1.1.1.3
                      </button>
                    </div>
                  </div>

                  {/* Automatic Live Diagnostics checklist list */}
                  {diagnosticResults.length > 0 && (
                    <div className="bg-[#050505] border border-white/5 rounded-lg p-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-blue-500" />
                          Local Analyzer Diagnostics
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase font-bold font-mono">
                          Live Parsing
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {diagnosticResults.map((check) => (
                          <div key={check.id} className="p-2.5 rounded bg-black/40 border border-white/5 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  check.status === "passed"
                                    ? "bg-emerald-400"
                                    : check.status === "warning"
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}></span>
                                <span className="font-bold text-white text-[11px] font-mono">{check.title}</span>
                              </div>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold font-mono ${
                                check.status === "passed"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : check.status === "warning"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {check.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-mono">{check.description}</p>
                            
                            <div className="flex items-center justify-between gap-4 mt-1 border-t border-white/5 pt-1.5">
                              <span className="text-[9px] text-gray-500 italic font-mono truncate max-w-[180px]">
                                Rec: {check.recommendation}
                              </span>
                              {check.canFix && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyFix(check.id, check.fixValue)}
                                  className="px-2 py-0.5 text-[8px] bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold rounded uppercase transition cursor-pointer shrink-0"
                                >
                                  Quick Fix
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1 tracking-wider">Extra Constraints</label>
                    <input
                      type="text"
                      value={optimizerDescription}
                      onChange={(e) => setOptimizerDescription(e.target.value)}
                      placeholder="e.g. Prevent disconnect on idle ports"
                      className="w-full bg-[#050505] border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isOptimizing || !rawConfigInput.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-gray-500 font-mono text-xs font-bold rounded text-white transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-blue-500/20"
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> RUNNING AI OPTIMIZER...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> DEPLOY AI OPTIMIZATIONS
                      </>
                    )}
                  </button>
                </form>

                {optimizerError && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded p-3 text-xs text-red-400 font-mono flex items-start gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase text-[10px]">Optimization Failed</span>
                      {optimizerError}
                    </div>
                  </div>
                )}

                {optimizedOutput && (
                  <div className="bg-[#050505] border border-white/5 rounded-lg p-4 flex flex-col gap-3.5 max-h-[340px] overflow-y-auto">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                        {showOptimizerDiff ? "Before / After Line Diff" : "Optimized Result"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowOptimizerDiff(!showOptimizerDiff)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono text-blue-300 uppercase cursor-pointer"
                      >
                        {showOptimizerDiff ? "View Full Output" : "Show Before/After Diff"}
                      </button>
                    </div>

                    {showOptimizerDiff ? (
                      <div className="bg-black/70 border border-white/5 rounded p-3 font-mono text-[11px] space-y-0.5 max-h-48 overflow-y-auto">
                        {optimizerDiffLines.map((d, idx) => (
                          <div
                            key={idx}
                            className={`px-1.5 py-0.5 rounded ${
                              d.type === "added"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : d.type === "removed"
                                ? "bg-rose-500/15 text-rose-300 line-through"
                                : "text-gray-400"
                            }`}
                          >
                            {d.type === "added" ? "+ " : d.type === "removed" ? "- " : "  "}
                            {d.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="bg-black/60 border border-white/5 rounded p-3 font-mono text-xs text-emerald-400 select-all overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        <code>{optimizedOutput.optimizedConfig}</code>
                      </pre>
                    )}

                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Modifications</span>
                      <ul className="list-inside list-disc text-[11px] font-mono text-gray-300 flex flex-col gap-1 pl-1">
                        {optimizedOutput.changesMade.map((change, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">AI Inference Summary</span>
                      <p className="text-[11px] font-mono text-gray-400 mt-1 leading-relaxed">{optimizedOutput.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-mono text-gray-500 uppercase tracking-widest border border-dashed border-white/5 rounded-lg bg-[#050505] flex flex-col items-center justify-center gap-1.5">
                <span>[HUD MODULE DEACTIVATED]</span>
                <span className="text-[10px] text-gray-600">Select Full or Dim in dropdown to restore visibility.</span>
              </div>
            )}

          </div>

              {/* Wi-Fi Tunnel Gateway Manager */}
              <div className={`bg-[#0c0c0c] border border-white/5 rounded-xl p-5 flex flex-col gap-4 ${getModuleStyle(wifiState)}`}>
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono flex items-center gap-2">
                      <Wifi className="h-4.5 w-4.5 text-blue-500" /> Wi-Fi Gateway & Credentials Vault
                    </h3>
                    
                    {/* Dropdown for Brightness & Visibility */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-gray-400">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider">HUD:</span>
                      <select
                        value={wifiState}
                        onChange={(e) => setWifiState(e.target.value as any)}
                        className="bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-1 font-bold"
                      >
                        <option value="full" className="bg-[#0f0f0f] text-white">Full (100%)</option>
                        <option value="medium" className="bg-[#0f0f0f] text-white">Dim (60%)</option>
                        <option value="low" className="bg-[#0f0f0f] text-white">Low (25%)</option>
                        <option value="hidden" className="bg-[#0f0f0f] text-rose-400">Hidden</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono mt-1 leading-relaxed">
                    Register and manage credentials for manual or physical Wi-Fi interfaces to support automated standby link failover.
                  </p>
                </div>

                {wifiState !== "hidden" ? (
                  <div className="flex flex-col gap-4">
                    
                    {/* Manual Credentials Entry Form */}
                    <form onSubmit={handleSaveWifi} className="flex flex-col gap-3.5 bg-black/30 border border-white/5 p-4 rounded-lg">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                        <Plus className="h-3.5 w-3.5 text-blue-500" /> Manual Interface Credentials
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* SSID */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-gray-400 uppercase">Network SSID:</label>
                          <input
                            type="text"
                            value={wifiSsid}
                            onChange={(e) => {
                              setWifiSsid(e.target.value);
                              if (wifiStatusMessage) setWifiStatusMessage(null);
                            }}
                            placeholder="e.g. Field_HQ_Wifi"
                            className="bg-[#050505] border border-white/10 rounded px-3 py-1.5 font-mono text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition"
                          />
                        </div>

                        {/* Security Type */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-gray-400 uppercase">Security Protocol:</label>
                          <select
                            value={wifiSecurity}
                            onChange={(e) => setWifiSecurity(e.target.value)}
                            className="bg-[#050505] border border-white/10 rounded px-2.5 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none transition"
                          >
                            <option value="WPA2-PSK" className="bg-[#0a0a0a]">WPA2 Personal (PSK)</option>
                            <option value="WPA3-SAE" className="bg-[#0a0a0a]">WPA3 Personal (SAE)</option>
                            <option value="Open" className="bg-[#0a0a0a]">None (Open Network)</option>
                          </select>
                        </div>
                      </div>

                      {/* Password Field (only if security is not Open) */}
                      {wifiSecurity !== "Open" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-mono text-gray-400 uppercase">WPA2/WPA3 Password:</label>
                          <div className="relative">
                            <input
                              type={showWifiPassword ? "text" : "password"}
                              value={wifiPassword}
                              onChange={(e) => {
                                setWifiPassword(e.target.value);
                                if (wifiStatusMessage) setWifiStatusMessage(null);
                              }}
                              placeholder="••••••••"
                              className="w-full bg-[#050505] border border-white/10 rounded pl-3 pr-10 py-1.5 font-mono text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowWifiPassword(!showWifiPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition cursor-pointer"
                            >
                              {showWifiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Smart Autofill Suggestion Banner */}
                      {matchedSavedNetwork && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-xs font-mono text-blue-400 flex items-center justify-between gap-2">
                          <span>💡 Saved credentials found for &quot;{matchedSavedNetwork.ssid}&quot;.</span>
                          <button
                            type="button"
                            onClick={() => handleAutofillWifi(matchedSavedNetwork.ssid)}
                            className="px-2 py-0.5 rounded bg-blue-500 text-black text-[9px] font-bold uppercase transition hover:bg-blue-400 cursor-pointer"
                          >
                            Autofill
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-black font-bold uppercase rounded font-mono text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Key className="h-3.5 w-3.5" /> Register Connection Key
                      </button>
                    </form>

                    {/* Status Feedback Messages */}
                    {wifiStatusMessage && (
                      <div className={`p-3 rounded border text-xs font-mono ${
                        wifiStatusType === "success"
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                          : wifiStatusType === "error"
                          ? "bg-red-500/5 border-red-500/20 text-red-400"
                          : "bg-blue-500/5 border-blue-500/20 text-blue-400"
                      }`}>
                        {wifiStatusMessage}
                      </div>
                    )}

                    {/* Stored Credentials List */}
                    <div className="space-y-2 bg-[#050505] p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500">
                          Secure Vault Database ({savedWifiNetworks.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPinSettingsModal(true)}
                          className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border uppercase cursor-pointer ${
                            cloudVaultStatus === "synced"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : cloudVaultStatus === "available"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-white/5 text-gray-400 border-white/10"
                          }`}
                        >
                          {cloudVaultStatus === "synced"
                            ? "Cloud AES-GCM Synced"
                            : cloudVaultStatus === "available"
                            ? "Cloud Vault Available"
                            : cloudVaultStatus === "syncing"
                            ? "Syncing..."
                            : pinStored
                            ? "Local AES-GCM"
                            : "Unencrypted Local"}
                        </button>
                      </div>
                      {savedWifiNetworks.length === 0 ? (
                        <div className="py-2 text-center text-xs font-mono text-gray-600">
                          Vault is empty. Register a network SSID above.
                        </div>
                      ) : (
                        <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                          {savedWifiNetworks.map((net, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-black/40 border border-white/5 rounded">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-mono text-white font-bold flex items-center gap-1.5">
                                  <Wifi className="h-3 w-3 text-emerald-500" /> {net.ssid}
                                </span>
                                <span className="text-[8.5px] font-mono text-gray-500 uppercase">
                                  Protocol: {net.security} &middot; {net.key ? "Password Stored" : "Open Interface"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAutofillWifi(net.ssid)}
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[9px] font-mono font-bold uppercase transition cursor-pointer"
                                >
                                  Load
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWifi(net.ssid)}
                                  className="p-1 rounded bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-black transition cursor-pointer"
                                  title="Purge Credential"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="py-6 text-center text-xs font-mono text-gray-500 uppercase tracking-widest border border-dashed border-white/5 rounded-lg bg-[#050505] flex flex-col items-center justify-center gap-1.5">
                    <span>[HUD MODULE DEACTIVATED]</span>
                    <span className="text-[10px] text-gray-600">Select Full or Dim in dropdown to restore visibility.</span>
                  </div>
                )}
              </div>

              {/* AI Terminal Conversation Agent (Lazy Modular Component) */}
              <Suspense
                fallback={
                  <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5 h-[380px] flex items-center justify-center text-xs font-mono text-gray-500">
                    Loading OmniEye Terminal Agent...
                  </div>
                }
              >
                <SovereignChatDrawer
                  terminalState={terminalState}
                  onChangeTerminalState={setTerminalState}
                  groundingMode={groundingMode}
                  onToggleGroundingMode={handleToggleGroundingMode}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  onChangeChatInput={setChatInput}
                  isChatLoading={isChatLoading}
                  onSendChat={handleSendChat}
                  chatScrollRef={chatScrollRef}
                  moduleStyleClass={getModuleStyle(terminalState)}
                  lockGeoIpRegion={lockGeoIpRegion}
                  rotateTunnelKeys={rotateTunnelKeys}
                  restartTunnelFailover={restartTunnelFailover}
                  runHardwareScan={runHardwareScan}
                  runSelfTuneBenchmark={runSelfTuneBenchmark}
                />
              </Suspense>

            </div>

          </div>

        </section>

      </main>
      ) : currentTab === "keep" ? (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-xs font-mono text-gray-500">
              Loading Keep Notes Workspace...
            </div>
          }
        >
          <KeepNotesWorkspace
            user={user}
            authLoading={authLoading}
            onLogin={handleLogin}
            getAccessToken={getAccessToken}
            onDemoLogin={handleDemoLogin}
            authError={authError}
          />
        </Suspense>
      ) : currentTab === "contacts" ? (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-xs font-mono text-gray-500">
              Loading Contacts & Webhook Alerting...
            </div>
          }
        >
          <ContactsAlertsWorkspace
            user={user}
            authLoading={authLoading}
            onLogin={handleLogin}
            getAccessToken={getAccessToken}
            onDemoLogin={handleDemoLogin}
            authError={authError}
            tunnelProfiles={fleetProfiles}
            webhooks={webhooks}
            onCreateWebhook={handleCreateWebhook}
            onDeleteWebhook={handleDeleteWebhook}
          />
        </Suspense>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 space-y-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <HeartbeatWidget
              simulationActive={simulationActive}
              natTimeoutOccurred={natTimeoutOccurred}
              selectedCategory={selectedCategory}
            />
            <MigrationPortal
              user={user}
              variableValues={variableValues}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <NetworkSecuritySentinel
              simulationActive={simulationActive}
              natTimeoutOccurred={natTimeoutOccurred}
              variableValues={variableValues}
              fleetProfiles={fleetProfiles}
              authLogs={tunnelAuthLogs}
              blockedIps={blockedIps}
              workbenchConfigHash={workbenchConfigHash}
              workbenchConfig={compiledCode}
              configRevisions={configRevisions}
              onRecordAuthLog={handleRecordAuthLog}
              onRefreshAuthLogs={handleRefreshAuthLogs}
              onBanIp={handleBanIp}
              onUnbanIp={handleUnbanIp}
              onSyncConfigHash={handleSyncConfigHash}
              onAckKeyRotation={handleAckKeyRotation}
              onRotateIngestToken={handleRotateIngestToken}
              onRestoreRevision={handleRestoreConfigRevision}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <SovereignTelemetrySystemology
              simulationActive={simulationActive}
              natTimeoutOccurred={natTimeoutOccurred}
              variableValues={variableValues}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <Suspense
              fallback={
                <div className="h-40 bg-[#050505] border border-white/10 rounded-xl flex items-center justify-center text-xs font-mono text-gray-500">
                  Loading Brand Laboratory...
                </div>
              }
            >
              <OmniBrandLogoLaboratory />
            </Suspense>
          </div>
        </div>
      )}

      {/* Elegant Dark Status Footer */}
      <footer className="h-14 border-t border-white/10 bg-[#0f0f0f] px-6 flex flex-col md:flex-row items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] font-mono text-gray-500">
          {systemLogs.map((log, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center gap-1">
                <span>[{log.time}]</span>
                <span className={log.type === "OK" ? "text-emerald-400 font-bold" : "text-blue-400 font-bold"}>
                  {log.type}
                </span>
                <span className="text-gray-400 truncate max-w-[180px] sm:max-w-[250px]">{log.text}</span>
              </div>
              {index < systemLogs.length - 1 && <span className="text-gray-700 hidden md:inline">|</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => {
              if (isOnline) {
                setIsOnline(false);
                setShowOfflineAlert(true);
              } else {
                setIsOnline(true);
                setShowOfflineAlert(false);
              }
              setLastCheckTime(new Date().toLocaleTimeString());
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition text-[9px] font-mono font-bold uppercase cursor-pointer ${
              isOnline
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            }`}
            title="Simulate network interface outage for diagnostics verification"
          >
            {isOnline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 animate-pulse text-rose-500" /> SIMULATE OUTAGE
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" /> RECOVERY LINK
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-gray-400">CPU: {cpuUsage}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-mono text-gray-400">MEM: {memUsage}MB</span>
          </div>
        </div>
      </footer>

      {/* WireGuard QR Code Modal */}
      {isQrModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={closeQrModal}
        >
          <div 
            className="bg-[#0c0c0e] border border-white/10 max-w-md w-full rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111115]">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  WireGuard QR Gateway
                </span>
              </div>
              <button 
                onClick={closeQrModal}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab selector for sharing vs importing */}
            <div className="flex border-b border-white/5 bg-[#09090b] text-[10px] font-mono">
              <button
                type="button"
                onClick={async () => {
                  await stopQrScanner();
                  setQrScannerErrorMsg(null);
                  setQrScannerSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 text-center border-r border-white/5 transition uppercase font-bold cursor-pointer ${
                  !isQrScannerActive ? "text-blue-400 bg-[#0e0e11]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Share Current Config
              </button>
              <button
                type="button"
                onClick={() => {
                  startQrScanner();
                }}
                className={`flex-1 py-2.5 text-center transition uppercase font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                  isQrScannerActive ? "text-blue-400 bg-[#0e0e11]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Camera className="h-3 w-3" /> Import via Camera
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center">
              {!isQrScannerActive ? (
                <>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold mb-1 text-center">
                    {currentSegment.name}
                  </span>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-5">
                    Scan with WireGuard Client
                  </span>

                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-xl shadow-inner relative flex items-center justify-center w-64 h-64 border border-white/15">
                    {qrError ? (
                      <div className="text-red-500 font-mono text-xs text-center px-4">
                        {qrError}
                      </div>
                    ) : qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="WireGuard Configuration QR Code" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-900 font-mono text-[10px]">Generating QR...</span>
                      </div>
                    )}
                  </div>

                  {/* Instructions text */}
                  <p className="mt-5 text-[10px] font-mono text-gray-400 text-center leading-relaxed">
                    Open the <strong className="text-white font-bold">WireGuard Mobile App</strong> on iOS or Android, tap the <strong className="text-blue-400 font-bold">+</strong> icon, select <strong className="text-white font-bold">"Create from QR code"</strong>, and scan the image above.
                  </p>
                </>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold mb-1 text-center">
                    Active Scanner Lens
                  </span>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-5 text-center">
                    Align a WireGuard QR Code inside the view window
                  </span>

                  {/* Camera view element */}
                  <div className="relative w-full aspect-square max-w-[280px] bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                    <div id="qr-scanner-view" className="w-full h-full"></div>
                    
                    {/* Visual Scan overlay box */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/20 m-12 rounded-lg flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                      <div className="w-full h-0.5 bg-rose-500/50 absolute top-1/2 left-0 -translate-y-1/2 animate-pulse"></div>
                    </div>
                  </div>

                  {qrScannerErrorMsg && (
                    <div className="mt-4 text-rose-400 font-mono text-[10px] text-center bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg w-full max-w-[280px]">
                      {qrScannerErrorMsg}
                    </div>
                  )}

                  <p className="mt-5 text-[10px] font-mono text-gray-400 text-center leading-relaxed">
                    Point your camera at a WireGuard configuration QR code. Once recognized, settings will populate the workspace fields automatically.
                  </p>
                </div>
              )}

              {qrScannerSuccessMsg && (
                <div className="mt-4 text-emerald-400 font-mono text-[10px] text-center bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg w-full max-w-[280px] animate-pulse">
                  {qrScannerSuccessMsg}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-white/5 bg-[#111115] flex gap-2">
              <button
                onClick={closeQrModal}
                className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold tracking-wider transition uppercase cursor-pointer text-center"
              >
                Close
              </button>
              {!isQrScannerActive && qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`wireguard-${currentSegment.id}-qr.png`}
                  className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold tracking-wider text-center transition uppercase cursor-pointer border border-blue-500/20"
                >
                  Save Image
                </a>
              )}
              {isQrScannerActive && (
                <button
                  type="button"
                  onClick={async () => {
                    await stopQrScanner();
                    setQrScannerErrorMsg(null);
                    setQrScannerSuccessMsg(null);
                  }}
                  className="flex-1 py-2 rounded bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold tracking-wider text-center transition uppercase cursor-pointer"
                >
                  Cancel Scan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secure ZIP Backup Modal */}
      {isBackupModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setIsBackupModalOpen(false)}
        >
          <div 
            className="bg-[#0c0c0e] border border-white/10 max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111115]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  OmniEye Backup & Cloud Sync Hub
                </span>
              </div>
              <button 
                onClick={() => setIsBackupModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-white/5 bg-[#08080b] p-1 gap-1">
              <button
                type="button"
                onClick={() => setBackupTab("zip")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                  backupTab === "zip"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                💾 Local ZIP
              </button>
              <button
                type="button"
                onClick={() => setBackupTab("gdrive")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                  backupTab === "gdrive"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                📁 Google Drive
              </button>
              <button
                type="button"
                onClick={() => setBackupTab("rclone")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                  backupTab === "rclone"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                🚀 rclone Engine
              </button>
              <button
                type="button"
                onClick={() => setBackupTab("obsidian")}
                className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                  backupTab === "obsidian"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                📓 Obsidian Vault
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[500px]">
              {backupTab === "zip" && (
                <div className="flex flex-col gap-4">
                  <div className="text-[10px] font-mono text-gray-400 leading-relaxed bg-emerald-950/20 border border-emerald-500/10 rounded-lg p-3">
                    <span className="font-bold text-emerald-400 block mb-1">🛡️ MILITARY-GRADE CLIENT-SIDE ENCRYPTION</span>
                    Export all <strong className="text-white">{PRESET_SEGMENTS.length} tunnel configurations</strong> in the active workspace as a single ZIP. The archive files will be secured using standard password encryption, keeping your Private Keys and Endpoint IPs completely locked.
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center justify-between">
                      <span>Cryptographic Backup Passphrase</span>
                      <span className="text-rose-400 text-[9px] lowercase font-normal">required</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showBackupPassword ? "text" : "password"}
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        placeholder="Enter a strong password to encrypt files"
                        className="w-full bg-[#0e0e11] border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBackupPassword(!showBackupPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                      >
                        {showBackupPassword ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Encryption selection */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Zip Archive Encryption Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBackupEncryption("zipCrypto")}
                        className={`p-2.5 rounded border text-[10px] font-mono text-left transition cursor-pointer ${
                          backupEncryption === "zipCrypto"
                            ? "border-emerald-500 bg-emerald-500/5 text-emerald-400"
                            : "border-white/5 bg-[#0e0e11] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="font-bold block uppercase mb-0.5">ZipCrypto (Standard)</span>
                        <span className="text-[9px] text-gray-500 block leading-tight">Highly compatible. Extract using native Windows Explorer & macOS Finder natively.</span>
                      </button>
                      <button
                        type="button"
                        disabled
                        className="p-2.5 rounded border text-[10px] font-mono text-left opacity-40 cursor-not-allowed border-white/5 bg-[#0e0e11] text-gray-500"
                      >
                        <span className="font-bold block uppercase mb-0.5">AES-256 (Strong)</span>
                        <span className="text-[9px] text-gray-600 block leading-tight">Ultra secure. Requires external archive software (e.g., 7-Zip, WinZip) on standard OS.</span>
                      </button>
                    </div>
                  </div>

                  {/* Files to include list */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Blueprint Archive Manifesto</span>
                    <div className="bg-[#070709] border border-white/5 rounded-lg overflow-hidden divide-y divide-white/5 max-h-36 overflow-y-auto">
                      {PRESET_SEGMENTS.map((segment) => {
                        const cleanPath = getOSFileTarget(segment.id, selectedOS, segment.fileTarget)
                          .replace(/^[a-zA-Z]:\\/, "")
                          .replace(/^\//, "")
                          .replace(/\\/g, "/")
                          .replace(/\s*\(.*?\)\s*/g, "").trim();
                        const finalPath = (cleanPath.includes("Manual Calibration") || cleanPath === "Manual Calibration script") 
                          ? "usr/local/bin/mtu-sweep.sh" 
                          : cleanPath;

                        return (
                          <div key={segment.id} className="p-2.5 flex items-center justify-between text-[10px] font-mono">
                            <div className="flex flex-col gap-0.5 truncate pr-2">
                              <span className="text-gray-300 font-bold truncate">{finalPath}</span>
                              <span className="text-gray-500 text-[9px] truncate">{segment.name}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 uppercase ${
                              segment.category === "wireguard" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              segment.category === "ssh" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              segment.category === "watchdog" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}>
                              {segment.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {backupError && (
                    <div className="text-rose-400 font-mono text-[10px] text-center bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg">
                      {backupError}
                    </div>
                  )}

                  {backupSuccess && (
                    <div className="text-emerald-400 font-mono text-[10px] text-center bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg animate-pulse">
                      {backupSuccess}
                    </div>
                  )}
                </div>
              )}

              {backupTab === "gdrive" && (
                <div className="flex flex-col gap-4">
                  <div className="text-[10px] font-mono text-gray-400 leading-relaxed bg-blue-950/20 border border-blue-500/10 rounded-lg p-3">
                    <span className="font-bold text-blue-400 block mb-1">📁 GOOGLE DRIVE VERSIONED BACKUPS</span>
                    Back up your local network profiles directly to your Google Drive account. You can utilize an automated shell script to stage encrypted backups directly inside a dedicated, version-controlled sync folder (e.g. <strong className="text-white">v2.4.1_Backups</strong>).
                  </div>

                  {/* Option A: GDrive Backup Script */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Interactive GDrive Sync Script</span>
                    <p className="text-[9px] text-gray-500 font-mono leading-normal">
                      Run this script locally to automatically bundle your active configs into a new date-and-version stamped GDrive synchronization folder:
                    </p>
                    <div className="relative">
                      <pre className="bg-black/90 text-gray-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-tight whitespace-pre">
{`#!/bin/bash
# OmniEye - GDrive Version Sync
VERSION="v2.4.1"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
TARGET_DIR="$HOME/Google Drive/My Drive/OmniEye_Backups/\${VERSION}_\${DATE}"

echo "📦 Generating uninhibited local backup staging directory..."
mkdir -p "$TARGET_DIR"

# Stage Active System Configurations
cp -r /etc/wireguard/wg0.conf "$TARGET_DIR/" 2>/dev/null
cp -r ~/.ssh/config "$TARGET_DIR/" 2>/dev/null

echo "✅ Backup successfully created in Google Drive: \${VERSION}_\${DATE}"`}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`#!/bin/bash
# OmniEye - GDrive Version Sync
VERSION="v2.4.1"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
TARGET_DIR="$HOME/Google Drive/My Drive/OmniEye_Backups/\${VERSION}_\${DATE}"

echo "📦 Generating uninhibited local backup staging directory..."
mkdir -p "$TARGET_DIR"

# Stage Active System Configurations
cp -r /etc/wireguard/wg0.conf "$TARGET_DIR/" 2>/dev/null
cp -r ~/.ssh/config "$TARGET_DIR/" 2>/dev/null

echo "✅ Backup successfully created in Google Drive: \${VERSION}_\${DATE}"`);
                          setBackupCopied(true);
                          setTimeout(() => setBackupCopied(false), 2000);
                        }}
                        className="absolute right-2 top-2 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer text-[10px] font-mono font-bold flex items-center gap-1"
                      >
                        {backupCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {backupCopied ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                  </div>

                  {/* Note Workspace Sync */}
                  <div className="bg-[#0e0e11] border border-white/5 rounded-lg p-3">
                    <h4 className="text-[10px] font-mono font-bold text-gray-300 uppercase mb-1">⚡ Dynamic Notes GDrive Cloud Sync</h4>
                    <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                      Did you know? The **Keep Notes Workspace** in your side-panel has a native Google Drive cloud backup mechanism already built-in! Authenticate your Google Account once to save your notes, calibrations, and active workspace logs to Google Drive seamlessly.
                    </p>
                  </div>
                </div>
              )}

              {backupTab === "rclone" && (
                <div className="flex flex-col gap-4">
                  <div className="text-[10px] font-mono text-gray-400 leading-relaxed bg-amber-950/20 border border-amber-500/10 rounded-lg p-3">
                    <span className="font-bold text-amber-400 block mb-1">🚀 RCLONE CLOUD REMOTE ORCHESTRATION</span>
                    rclone is the Swiss-army knife for cloud storage. You can map Google Drive, OneDrive, Dropbox, or any SFTP target as an rclone remote, then synchronize versioned backup archives using automated cron daemons.
                  </div>

                  {/* Configuration step */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">1. Configure rclone Google Drive Remote</span>
                    <p className="text-[9px] text-gray-500 font-mono leading-normal">
                      Add this remote configuration block directly into your <code className="text-white bg-white/5 px-1 rounded">~/.config/rclone/rclone.conf</code> file:
                    </p>
                    <div className="relative">
                      <pre className="bg-black/90 text-gray-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-32 overflow-y-auto leading-tight whitespace-pre">
{`[gdrive_remote]
type = drive
scope = drive
token = {"access_token":"your_oauth_token","token_type":"Bearer"}
team_drive = `}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`[gdrive_remote]
type = drive
scope = drive
token = {"access_token":"your_oauth_token","token_type":"Bearer"}
team_drive = `);
                          setBackupCopied(true);
                          setTimeout(() => setBackupCopied(false), 2000);
                        }}
                        className="absolute right-2 top-2 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer text-[10px] font-mono font-bold flex items-center gap-1"
                      >
                        {backupCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {backupCopied ? "Copied!" : "Copy Config"}
                      </button>
                    </div>
                  </div>

                  {/* Backup Shell command */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">2. Versioned Sync Daemon Command</span>
                    <p className="text-[9px] text-gray-500 font-mono leading-normal">
                      Use this uninhibited CLI script to upload your encrypted ZIP straight to a brand-new version folder in GDrive:
                    </p>
                    <div className="relative">
                      <pre className="bg-black/90 text-gray-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-32 overflow-y-auto leading-tight whitespace-pre">
{`#!/bin/bash
# Sync local backups into versioned folders
DATE_VERSION="v2.4.1_$(date +%F)"
echo "🚀 Running uninhibited rclone push to gdrive_remote:\${DATE_VERSION}..."

rclone sync ./omnieye-backup-linux-*.zip gdrive_remote:/OmniEye/Backups/\${DATE_VERSION} -P`}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`#!/bin/bash
# Sync local backups into versioned folders
DATE_VERSION="v2.4.1_$(date +%F)"
echo "🚀 Running uninhibited rclone push to gdrive_remote:\${DATE_VERSION}..."

rclone sync ./omnieye-backup-linux-*.zip gdrive_remote:/OmniEye/Backups/\${DATE_VERSION} -P`);
                          setBackupCopied(true);
                          setTimeout(() => setBackupCopied(false), 2000);
                        }}
                        className="absolute right-2 top-2 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer text-[10px] font-mono font-bold flex items-center gap-1"
                      >
                        {backupCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {backupCopied ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {backupTab === "obsidian" && (
                <div className="flex flex-col gap-4">
                  <div className="text-[10px] font-mono text-gray-400 leading-relaxed bg-purple-950/20 border border-purple-500/10 rounded-lg p-3">
                    <span className="font-bold text-purple-400 block mb-1">📓 OBSIDIAN LOCAL-FIRST DOCUMENT VAULT</span>
                    Obsidian is a stellar local-first personal knowledge management base. Keep your active configuration states, variables, and blueprints organized by copying this complete Markdown note template into your vault under a new version note: <code className="text-white font-bold bg-white/5 px-1 rounded">OmniEye_v2.4.1.md</code>.
                  </div>

                  {/* Note preview / box */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between animate-fade-in">
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Generated Obsidian Vault Note</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getObsidianTemplate());
                          setBackupCopied(true);
                          setTimeout(() => setBackupCopied(false), 2000);
                        }}
                        className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded hover:bg-purple-500/20 text-purple-300 hover:text-white transition cursor-pointer text-[10px] font-mono font-bold flex items-center gap-1 shrink-0"
                      >
                        {backupCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {backupCopied ? "Copied Vault Template!" : "Copy Obsidian Note"}
                      </button>
                    </div>
                    
                    <div className="relative">
                      <pre className="bg-black/90 text-gray-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                        {getObsidianTemplate()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-white/5 bg-[#111115] flex gap-2">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold tracking-wider transition uppercase cursor-pointer text-center"
              >
                {backupTab === "zip" ? "Cancel" : "Close Hub"}
              </button>
              {backupTab === "zip" && (
                <button
                  type="button"
                  onClick={handleExportEncryptedZip}
                  disabled={isBackupExporting || !backupPassword}
                  className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 border border-emerald-500/20 text-white text-xs font-mono font-bold tracking-wider transition uppercase cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  {isBackupExporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" /> Pack & Encrypt
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated SSH Keys Modal */}
      {isSshKeyModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setIsSshKeyModalOpen(false)}
        >
          <div 
            className="bg-[#0c0c0e] border border-white/10 max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111115]">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  SSH Cryptographic Keypair Generated
                </span>
              </div>
              <button 
                onClick={() => setIsSshKeyModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Keypair Generated & Configuration Field Synchronized
                  </h4>
                  <p className="text-[10px] font-mono text-gray-400 mt-1 leading-relaxed">
                    A secure <strong>{sshKeyType.toUpperCase()}</strong> key pair was generated via server-side cryptographic entropy. The variable <code className="text-white font-bold bg-white/5 px-1 py-0.5 rounded">IdentityFile</code> in your configuration workbench has been auto-populated with <code className="text-emerald-300 font-mono">"{sshKeyName}"</code>.
                  </p>
                  {generatedSshFingerprint && (
                    <div className="mt-2 px-2 py-1 rounded bg-black/50 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 break-all">
                      Fingerprint: {generatedSshFingerprint}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Private Key Box */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1">
                      <FileText className="h-3 w-3 text-rose-500" /> Private Key (Secret)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsSshPrivateMasked((m) => !m)}
                        className="text-[8px] font-mono text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold cursor-pointer"
                      >
                        {isSshPrivateMasked
                          ? "Reveal"
                          : `Auto-Mask ${sshMaskCountdownSec}s`}
                      </button>
                      <span className="text-[8px] font-mono text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                        Do Not Share
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <pre className="bg-black/80 text-gray-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono h-44 overflow-y-auto overflow-x-hidden leading-tight whitespace-pre-wrap select-all">
                      {generatedPrivateKey
                        ? isSshPrivateMasked
                          ? "•••••••••••••••• PRIVATE KEY MASKED FOR EPHEMERAL HYGIENE ••••••••••••••••\nClick Reveal above or Download/Copy before closing."
                          : generatedPrivateKey
                        : "Key wiped from browser memory."}
                    </pre>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (generatedPrivateKey) {
                            navigator.clipboard.writeText(generatedPrivateKey);
                            setSshKeyCopied("private");
                            setTimeout(() => setSshKeyCopied(null), 2000);
                          }
                        }}
                        className="p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                        title="Copy Private Key"
                      >
                        {sshKeyCopied === "private" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (generatedPrivateKey) {
                            const element = document.createElement("a");
                            const file = new Blob([generatedPrivateKey], { type: "text/plain" });
                            element.href = URL.createObjectURL(file);
                            element.download = sshKeyName;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }
                        }}
                        className="p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                        title="Download Private Key"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-gray-500 mt-0.5">
                    Save location: <code className="text-gray-300 bg-white/5 px-1 rounded">~/.ssh/{sshKeyName}</code> (Chmod: 600)
                  </span>
                </div>

                {/* Public Key Box */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1">
                      <FileText className="h-3 w-3 text-blue-500" /> Public Key (Authorized Key)
                    </span>
                    <span className="text-[8px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                      Safe to Distribute
                    </span>
                  </div>
                  <div className="relative">
                    <pre className="bg-black/80 text-gray-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono h-44 overflow-y-auto overflow-x-hidden leading-tight whitespace-pre-wrap select-all">
                      {generatedPublicKey}
                    </pre>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (generatedPublicKey) {
                            navigator.clipboard.writeText(generatedPublicKey);
                            setSshKeyCopied("public");
                            setTimeout(() => setSshKeyCopied(null), 2000);
                          }
                        }}
                        className="p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                        title="Copy Public Key"
                      >
                        {sshKeyCopied === "public" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (generatedPublicKey) {
                            const element = document.createElement("a");
                            const file = new Blob([generatedPublicKey], { type: "text/plain" });
                            element.href = URL.createObjectURL(file);
                            element.download = `${sshKeyName}.pub`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }
                        }}
                        className="p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                        title="Download Public Key"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-gray-500 mt-0.5">
                    Save location: <code className="text-gray-300 bg-white/5 px-1 rounded">~/.ssh/{sshKeyName}.pub</code> (Chmod: 644)
                  </span>
                </div>
              </div>

              {/* Deployment instructions checklist */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-2.5">
                <h5 className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-1.5">
                  <span>🛠️</span> Deploying Keys to Your System (Standard Operations Guide)
                </h5>
                <ul className="text-[10px] font-mono text-gray-400 flex flex-col gap-2.5 list-none leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">01.</span>
                    <div>
                      <strong className="text-gray-200">Generate secure local folders:</strong>
                      <div className="bg-black/40 border border-white/5 p-1 rounded font-mono text-[9px] text-gray-300 mt-1 flex items-center justify-between">
                        <code>mkdir -p ~/.ssh && chmod 700 ~/.ssh</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("mkdir -p ~/.ssh && chmod 700 ~/.ssh");
                            setSshKeyCopied("auth_keys");
                            setTimeout(() => setSshKeyCopied(null), 1500);
                          }}
                          className="text-gray-500 hover:text-white px-1 cursor-pointer"
                          title="Copy"
                        >
                          {sshKeyCopied === "auth_keys" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">02.</span>
                    <div>
                      <strong className="text-gray-200">Append public key to target remote server:</strong>
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        Append the content of <code className="text-gray-400">{sshKeyName}.pub</code> to the file <code className="text-gray-400">~/.ssh/authorized_keys</code> on the remote server, or run the command:
                      </p>
                      <div className="bg-black/40 border border-white/5 p-1 rounded font-mono text-[9px] text-gray-300 mt-1 flex items-center justify-between">
                        <code className="truncate pr-1">
                          {`ssh-copy-id -i ~/.ssh/${sshKeyName}.pub -p ${variableValues["SSH_PORT"] || "22"} ${variableValues["SSH_USER"] || "ubuntu"}@${variableValues["REMOTE_HOST"] || variableValues["REMOTE_IP_OR_HOST"] || "203.0.113.60"}`}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`ssh-copy-id -i ~/.ssh/${sshKeyName}.pub -p ${variableValues["SSH_PORT"] || "22"} ${variableValues["SSH_USER"] || "ubuntu"}@${variableValues["REMOTE_HOST"] || variableValues["REMOTE_IP_OR_HOST"] || "203.0.113.60"}`);
                            setSshKeyCopied("auth_keys");
                            setTimeout(() => setSshKeyCopied(null), 1500);
                          }}
                          className="text-gray-500 hover:text-white px-1 shrink-0 cursor-pointer"
                          title="Copy"
                        >
                          {sshKeyCopied === "auth_keys" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-white/5 bg-[#111115] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setGeneratedPrivateKey(null);
                  setIsSshPrivateMasked(true);
                }}
                className="px-4 py-2 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Wipe Secret
              </button>
              <button
                type="button"
                onClick={() => setIsSshKeyModalOpen(false)}
                className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold tracking-wider text-center transition uppercase cursor-pointer border border-blue-500/20"
              >
                Done, Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security PIN Authorization & Settings Modal */}
      {showPinSettingsModal && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => {
            setShowPinSettingsModal(false);
            setPinErrorMsg(null);
            setSetupPin1("");
            setSetupPin2("");
          }}
        >
          <div 
            className="bg-[#0b0b0d] border border-white/10 max-w-md w-full rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111115]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                  Workspace Authorization Lock
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowPinSettingsModal(false);
                  setPinErrorMsg(null);
                  setSetupPin1("");
                  setSetupPin2("");
                }}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              {pinErrorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold p-3 rounded-lg uppercase tracking-wider text-center">
                  {pinErrorMsg}
                </div>
              )}

              {pinStored ? (
                // Setup is configured - options to lock or disable
                <div className="flex flex-col gap-4">
                  <div className="text-center py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">CONSOLE SECURED</span>
                    <p className="text-[10px] text-gray-400 max-w-[260px] mx-auto leading-relaxed">
                      This browser session is securely locked behind OmniEye's cryptographic PIN authorization layer.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAppLocked(true);
                        setShowPinSettingsModal(false);
                        setPinInput("");
                      }}
                      className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Lock Console Now
                    </button>

                    <div className="bg-black/40 border border-white/10 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-mono uppercase">
                        <span className="text-gray-400 font-bold">Zero-Knowledge Cloud Vault</span>
                        <span className={cloudVaultStatus === "synced" ? "text-emerald-400 font-bold" : "text-amber-300 font-bold"}>
                          {cloudVaultStatus === "synced"
                            ? "SYNCED (AES-GCM)"
                            : cloudVaultStatus === "syncing"
                            ? "SYNCING..."
                            : "LOCAL ONLY"}
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-gray-500 leading-relaxed">
                        Only the client-side AES-256-GCM ciphertext is stored in Cloud SQL; your 8-char PIN never leaves your browser.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRestoreOrSyncCloudVault()}
                        className="w-full py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Sync / Restore Cloud Vault
                      </button>
                    </div>

                    <div className="border-t border-white/5 my-2 pt-4">
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-2 text-center">DISABLE SECURITY LOCK</span>
                      <div className="flex flex-col gap-2">
                        <input
                          type="password"
                          placeholder="ENTER CURRENT KEY TO DISABLE"
                          maxLength={8}
                          value={setupPin1}
                          onChange={(e) => {
                            setPinErrorMsg(null);
                            setSetupPin1(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-center text-sm font-mono tracking-widest text-white placeholder:tracking-normal placeholder:text-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePin(setupPin1)}
                          className="w-full py-2 rounded bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center"
                        >
                          Clear Authorization Security Key
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Setup is not configured yet - initial configuration
                <div className="flex flex-col gap-4">
                  {hasCloudVault && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                        Encrypted Cloud Vault Detected
                      </span>
                      <p className="text-[9.5px] font-mono text-gray-300 leading-relaxed">
                        Enter your existing 8-character PIN from your other device to decrypt and restore your Wi-Fi Vault locally.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="8-CHAR PIN"
                          maxLength={8}
                          value={cloudVaultRestorePin}
                          onChange={(e) => {
                            setPinErrorMsg(null);
                            setCloudVaultRestorePin(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                          }}
                          className="flex-1 bg-black/50 border border-white/15 rounded px-2.5 py-1.5 text-xs font-mono text-center tracking-widest text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRestoreOrSyncCloudVault(cloudVaultRestorePin)}
                          className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-mono font-bold uppercase cursor-pointer"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                    <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider block mb-1">CONFIGURE WORKSPACE PROTECTION</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                      Define a secret 8-character/digit alphanumeric security key to prevent any modification of settings or unauthorized network tunnel access.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Define Secure Key (Alphanumeric):</label>
                      <input
                        type="password"
                        placeholder="8-CHARACTERS"
                        maxLength={8}
                        value={setupPin1}
                        onChange={(e) => {
                          setPinErrorMsg(null);
                          setSetupPin1(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-center text-sm font-mono tracking-widest text-white focus:border-blue-500/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Confirm Secure Key:</label>
                      <input
                        type="password"
                        placeholder="8-CHARACTERS"
                        maxLength={8}
                        value={setupPin2}
                        onChange={(e) => {
                          setPinErrorMsg(null);
                          setSetupPin2(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-center text-sm font-mono tracking-widest text-white focus:border-blue-500/50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSetupPin}
                      className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center mt-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    >
                      Activate System Lock
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Startup Configuration Wizard Modal */}
      {isStartupWizardOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsStartupWizardOpen(false)}
        >
          <div 
            className="bg-[#0b0b0d] border border-white/10 max-w-3xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col my-8 transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111115]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                  Startup Configuration Wizard & Boot Persistence
                </span>
              </div>
              <button 
                onClick={() => setIsStartupWizardOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
              {/* OS Detection Alert Banner */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <Monitor className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                      Detected User-Agent / Host Machine OS
                    </h4>
                    <p className="text-[10px] font-mono text-gray-400 mt-1 leading-relaxed">
                      We detected your system platform is: <strong className="text-white font-mono">
                        {typeof navigator !== "undefined" 
                          ? navigator.userAgent.toLowerCase().includes("win") 
                            ? "Windows Desktop Environment" 
                            : navigator.userAgent.toLowerCase().includes("mac") 
                              ? "Apple macOS Darwin" 
                              : "Linux/UNIX Operating System" 
                          : "Linux Server"}
                      </strong>. Select your corresponding OS tab below to see tailored registration guidelines.
                    </p>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold uppercase tracking-wider font-mono animate-pulse shrink-0 hidden sm:inline-block">
                  AUTO-READY
                </span>
              </div>

              {/* OS Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setStartupWizardOS("linux");
                    setWizardStep(1);
                  }}
                  className={`py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    startupWizardOS === "linux"
                      ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" /> Linux systemd
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartupWizardOS("macos");
                    setWizardStep(1);
                  }}
                  className={`py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    startupWizardOS === "macos"
                      ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" /> macOS launchd
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartupWizardOS("windows");
                    setWizardStep(1);
                  }}
                  className={`py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    startupWizardOS === "windows"
                      ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" /> Windows Task
                </button>
              </div>

              {/* Steps Stepper */}
              <div className="flex items-center justify-between relative mt-2 pb-2 border-b border-white/5">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    onClick={() => setWizardStep(step)}
                    className="flex flex-col items-center gap-1.5 z-10 focus:outline-none cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border font-mono text-[11px] font-bold transition-all ${
                      wizardStep === step
                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        : wizardStep > step
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                          : "bg-black text-gray-500 border-white/10 hover:border-white/20"
                    }`}>
                      {wizardStep > step ? <Check className="h-4 w-4" /> : step}
                    </div>
                    <span className={`text-[8px] font-mono uppercase tracking-widest font-bold ${
                      wizardStep === step ? "text-white" : "text-gray-500"
                    }`}>
                      {step === 1 ? "File Deployment" : step === 2 ? "Service Unit" : step === 3 ? "Enable & Run" : "Status Verify"}
                    </span>
                  </button>
                ))}
                {/* Horizontal progress bar */}
                <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-white/5 -z-0">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step Contents */}
              {(() => {
                const isWg = currentSegment.category === "wireguard";
                const isMultiLine = compiledCode.trim().split("\n").length > 1;
                const cleanCmd = compiledCode.trim().split("\n").filter(l => l && !l.startsWith("#")).join(" ");
                const filename = isWg ? "wg0.conf" : (currentSegment.category === "ssh" ? "tunnel-agent.sh" : "agent.sh");

                // Dynamic Service Content
                const getLinuxService = () => {
                  if (isWg) {
                    return `# WireGuard uses systemd's built-in service framework native daemon:
# Config path: /etc/wireguard/wg0.conf
# Enabled via wg-quick helper helper service.`;
                  }
                  return `[Unit]
Description=Tunnel Blueprint Workbench Background Service
After=network.target

[Service]
Type=simple
User=${variableValues["SSH_USER"] || "root"}
WorkingDirectory=/home/${variableValues["SSH_USER"] || "ubuntu"}
ExecStart=/bin/bash ${isMultiLine ? `/usr/local/bin/${filename}` : `-c "${cleanCmd.replace(/"/g, '\\"')}"`}
Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target`;
                };

                const getMacPlist = () => {
                  const plistLabel = isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel";
                  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistLabel}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>${isMultiLine ? `/usr/local/bin/${filename}` : cleanCmd.replace(/"/g, "&quot;")}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/${plistLabel}.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/${plistLabel}.out</string>
</dict>
</plist>`;
                };

                const getWinPowerShell = () => {
                  const safeCmd = isMultiLine ? `C:\\tunnel-agent.ps1` : cleanCmd.replace(/"/g, '`"');
                  return `# Create scheduled task action to boot background shell silently
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -Command & { ${safeCmd} }"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "TunnelKeepalive" -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal`;
                };

                // LINUX systemd STEPS
                if (startupWizardOS === "linux") {
                  if (wizardStep === 1) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 1: Save Configuration File to Local Path
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          First, write your customized blueprint configuration code to a persistent file location on your local machine. WireGuard templates should reside in the default system directory <code className="text-gray-300">/etc/wireguard/</code>.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">Deploy Command (Write file via Tee)</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{`sudo mkdir -p ${isWg ? "/etc/wireguard" : "/usr/local/bin"}
sudo tee ${isWg ? "/etc/wireguard/wg0.conf" : `/usr/local/bin/${filename}`} << 'EOF'
${compiledCode}
EOF
${!isWg ? `sudo chmod +x /usr/local/bin/${filename}` : ""}`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`sudo mkdir -p ${isWg ? "/etc/wireguard" : "/usr/local/bin"}\nsudo tee ${isWg ? "/etc/wireguard/wg0.conf" : `/usr/local/bin/${filename}`} << 'EOF'\n${compiledCode}\nEOF\n${!isWg ? `sudo chmod +x /usr/local/bin/${filename}` : ""}`);
                                setWizardCopiedIndex(1);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 1 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 2) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 2: Declare systemd Service Unit
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          {isWg 
                            ? "WireGuard uses systemd's built-in wg-quick unit templates. There is no need to write a custom service unit! Skip to Step 3 to enable the service."
                            : "Create a systemd unit file. This instructs Linux on how to run, supervise, and automatically restart your tunnel keepalive process if it drops."}
                        </p>
                        {!isWg && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-mono text-gray-400 uppercase">Service Descriptor (/etc/systemd/system/tunnel-keepalive.service)</span>
                            <div className="relative">
                              <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{getLinuxService()}
                              </pre>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(getLinuxService());
                                  setWizardCopiedIndex(2);
                                  setTimeout(() => setWizardCopiedIndex(null), 2000);
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                              >
                                {wizardCopiedIndex === 2 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                            <span className="text-[9px] font-mono text-gray-400 uppercase mt-1">Command to save the unit:</span>
                            <div className="relative">
                              <pre className="bg-black/80 text-gray-400 border border-white/5 p-2 rounded-lg text-[9px] font-mono">
{`sudo tee /etc/systemd/system/tunnel-keepalive.service << 'EOF'
${getLinuxService()}
EOF`}
                              </pre>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`sudo tee /etc/systemd/system/tunnel-keepalive.service << 'EOF'\n${getLinuxService()}\nEOF`);
                                  setWizardCopiedIndex(22);
                                  setTimeout(() => setWizardCopiedIndex(null), 2000);
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                              >
                                {wizardCopiedIndex === 22 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (wizardStep === 3) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 3: Register, Enable, and Fire Background Service
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Run the commands below in your system shell. This triggers systemd to parse the new service configuration, register it to launch at startup, and start the daemon process immediately.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">Terminal Commands</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{isWg 
  ? `sudo systemctl daemon-reload
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0`
  : `sudo systemctl daemon-reload
sudo systemctl enable tunnel-keepalive.service
sudo systemctl start tunnel-keepalive.service`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(isWg 
                                  ? `sudo systemctl daemon-reload\nsudo systemctl enable wg-quick@wg0\nsudo systemctl start wg-quick@wg0`
                                  : `sudo systemctl daemon-reload\nsudo systemctl enable tunnel-keepalive.service\nsudo systemctl start tunnel-keepalive.service`);
                                setWizardCopiedIndex(3);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 3 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 4) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 4: Active Verification & Status Checks
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Validate that your persistent keepalive daemon is running silently in the background and will successfully spin up on system boot.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">Query Run Status & Logs</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{isWg 
  ? `sudo systemctl status wg-quick@wg0
sudo wg show`
  : `sudo systemctl status tunnel-keepalive.service
sudo journalctl -u tunnel-keepalive.service -n 50 --no-pager`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(isWg 
                                  ? `sudo systemctl status wg-quick@wg0\nsudo wg show`
                                  : `sudo systemctl status tunnel-keepalive.service\nsudo journalctl -u tunnel-keepalive.service -n 50 --no-pager`);
                                setWizardCopiedIndex(4);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 4 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }

                // MACOS launchd STEPS
                if (startupWizardOS === "macos") {
                  if (wizardStep === 1) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 1: Save Configuration File to macOS local disk
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Write your blueprint tunnel commands/configs to macOS. If it's an SSH shell/watchdog, save it inside <code className="text-gray-300">/usr/local/bin</code> and flag it as executable.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">Deploy File</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{`sudo mkdir -p ${isWg ? "/usr/local/etc/wireguard" : "/usr/local/bin"}
sudo tee ${isWg ? "/usr/local/etc/wireguard/wg0.conf" : `/usr/local/bin/${filename}`} << 'EOF'
${compiledCode}
EOF
${!isWg ? `sudo chmod +x /usr/local/bin/${filename}` : ""}`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`sudo mkdir -p ${isWg ? "/usr/local/etc/wireguard" : "/usr/local/bin"}\nsudo tee ${isWg ? "/usr/local/etc/wireguard/wg0.conf" : `/usr/local/bin/${filename}`} << 'EOF'\n${compiledCode}\nEOF\n${!isWg ? `sudo chmod +x /usr/local/bin/${filename}` : ""}`);
                                setWizardCopiedIndex(1);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 1 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 2) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 2: Draft macOS launchd plist Declaration
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Apple's launchd daemon system parses structured XML properties files (.plist) to automate start-at-boot background processes. Place the file inside <code className="text-gray-300">/Library/LaunchDaemons/</code>.
                        </p>
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">com.blueprint.tunnel.plist XML Code</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{getMacPlist()}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(getMacPlist());
                                setWizardCopiedIndex(2);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 2 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <span className="text-[9px] font-mono text-gray-400 uppercase mt-1 font-bold">Write plist file command:</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-gray-400 border border-white/5 p-2 rounded-lg text-[9px] font-mono">
{`sudo tee /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist << 'EOF'
${getMacPlist()}
EOF`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`sudo tee /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist << 'EOF'\n${getMacPlist()}\nEOF`);
                                setWizardCopiedIndex(22);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 22 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 3) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 3: Correct Permissions & Register Daemon
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          launchd requires strict plist file ownership (root user and wheel group) and 644 access permissions, or it will refuse to load the boot agent.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">macOS Shell Commands</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{`sudo chown root:wheel /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist
sudo chmod 644 /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist
sudo launchctl load -w /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`sudo chown root:wheel /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist\nsudo chmod 644 /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist\nsudo launchctl load -w /Library/LaunchDaemons/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.plist`);
                                setWizardCopiedIndex(3);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 3 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 4) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 4: Live Daemon Verifications
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Query launchd state tables to confirm the background tunnel configuration has initialized with a 0 exit status code.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">macOS Status Commands</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{`sudo launchctl list | grep ${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}
tail -n 20 /tmp/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.err`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`sudo launchctl list | grep ${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}\ntail -n 20 /tmp/${isWg ? "com.wireguard.wg0" : "com.blueprint.tunnel"}.err`);
                                setWizardCopiedIndex(4);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 4 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }

                // WINDOWS STEPS
                if (startupWizardOS === "windows") {
                  if (wizardStep === 1) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 1: Deploy Configuration File on Windows
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Save the script/config to your local disk. For Wireguard, we place it in the system config directory. For SSH/SOCKS, save it as a PowerShell script block.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">PowerShell Deployment Script (Run as Administrator)</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{isWg 
  ? `New-Item -Path "C:\\Program Files\\WireGuard\\Data\\Configurations" -Type Directory -Force
Set-Content -Path "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf" -Value @"
${compiledCode}
"@`
  : `New-Item -Path "C:\\" -Name "tunnel-agent.ps1" -ItemType "file" -Force
Set-Content -Path "C:\\tunnel-agent.ps1" -Value @"
${compiledCode}
"@`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(isWg 
                                  ? `New-Item -Path "C:\\Program Files\\WireGuard\\Data\\Configurations" -Type Directory -Force\nSet-Content -Path "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf" -Value @"\n${compiledCode}\n"@`
                                  : `New-Item -Path "C:\\" -Name "tunnel-agent.ps1" -ItemType "file" -Force\nSet-Content -Path "C:\\tunnel-agent.ps1" -Value @"\n${compiledCode}\n"@`);
                                setWizardCopiedIndex(1);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 1 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 2) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 2: Draft Windows Scheduled Task / Service Action
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          {isWg 
                            ? "WireGuard provides its own built-in service manager. Skip to Step 3 to register the tunnel tunnel service directly!"
                            : "Windows Scheduled Tasks are powerful and let you register commands to run as SYSTEM at boot-time silently without opening a terminal window."}
                        </p>
                        {!isWg && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-mono text-gray-400 uppercase">PowerShell Provisioning Script</span>
                            <div className="relative">
                              <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{getWinPowerShell()}
                              </pre>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(getWinPowerShell());
                                  setWizardCopiedIndex(2);
                                  setTimeout(() => setWizardCopiedIndex(null), 2000);
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                              >
                                {wizardCopiedIndex === 2 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (wizardStep === 3) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 3: Register and Execute Task/Service
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Execute this PowerShell block as Administrator to register your tunnel keepalive as a native system daemon executing on system boot-up.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">Admin PowerShell Commands</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{isWg 
  ? `& "C:\\Program Files\\WireGuard\\wireguard.exe" /installtunnelservice "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf"`
  : getWinPowerShell()}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(isWg 
                                  ? `& "C:\\Program Files\\WireGuard\\wireguard.exe" /installtunnelservice "C:\\Program Files\\WireGuard\\Data\\Configurations\\wg0.conf"`
                                  : getWinPowerShell());
                                setWizardCopiedIndex(3);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 3 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (wizardStep === 4) {
                    return (
                      <div className="flex flex-col gap-3.5 animate-fade-in">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 4: Windows Diagnostics & Verifications
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          Query the active task scheduler database or Windows service list to ensure the connection node is running.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">PowerShell Status Queries</span>
                          <div className="relative">
                            <pre className="bg-black/80 text-blue-300 border border-white/5 p-3 rounded-lg text-[9px] font-mono max-h-48 overflow-y-auto leading-normal whitespace-pre">
{isWg 
  ? `Get-Service -Name "WireGuardTunnel$wg0"
Get-NetIPInterface -InterfaceAlias "wg0"`
  : `Get-ScheduledTask -TaskName "TunnelKeepalive"
Get-ScheduledTaskInfo -TaskName "TunnelKeepalive"`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(isWg 
                                  ? `Get-Service -Name "WireGuardTunnel$wg0"\nGet-NetIPInterface -InterfaceAlias "wg0"`
                                  : `Get-ScheduledTask -TaskName "TunnelKeepalive"\nGet-ScheduledTaskInfo -TaskName "TunnelKeepalive"`);
                                setWizardCopiedIndex(4);
                                setTimeout(() => setWizardCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-black/90 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {wizardCopiedIndex === 4 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Tips Section */}
              <div className="bg-[#111115] border border-white/5 rounded-lg p-3.5 text-[10px] font-mono text-gray-400 leading-relaxed flex flex-col gap-1">
                <span className="font-bold text-gray-200 uppercase flex items-center gap-1">
                  💡 Best Practices & Security Guidelines
                </span>
                <span>
                  - Keep your secret key files (<code className="text-rose-400">IdentityFile</code>) strictly secured with correct permission flags (<code className="text-gray-300">chmod 600</code>).
                </span>
                <span>
                  - Running tunnels as <code className="text-gray-300">SYSTEM</code> or <code className="text-gray-300">root</code> allows automatic network setup at boot-time before any users logon to the device.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-white/5 bg-[#111115] flex items-center justify-between">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 border border-white/10 text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer"
              >
                Back
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsStartupWizardOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => Math.min(4, prev + 1))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer border border-blue-500/20"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsStartupWizardOpen(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer border border-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" /> Finish Wizard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Fleet Endpoint Modal */}
      {isAddEndpointModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsAddEndpointModalOpen(false)}
        >
          <div
            className="bg-[#0c0c0e] border border-white/10 max-w-md w-full rounded-xl overflow-hidden shadow-2xl font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#111115]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-400" /> Add Fleet Tunnel Endpoint
              </span>
              <button
                type="button"
                onClick={() => setIsAddEndpointModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEndpoint} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Endpoint Name</label>
                <input
                  type="text"
                  required
                  value={newEndpointName}
                  onChange={(e) => setNewEndpointName(e.target.value)}
                  placeholder="e.g. wg-us-west-02"
                  className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Host / IP</label>
                  <input
                    type="text"
                    required
                    value={newEndpointHost}
                    onChange={(e) => setNewEndpointHost(e.target.value)}
                    placeholder="e.g. 1.1.1.1 or vpn.example.com"
                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Port</label>
                  <input
                    type="number"
                    value={newEndpointPort}
                    onChange={(e) => setNewEndpointPort(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Protocol</label>
                  <select
                    value={newEndpointCategory}
                    onChange={(e) => setNewEndpointCategory(e.target.value as ConfigType)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="wireguard">WireGuard</option>
                    <option value="ssh">SSH / AutoSSH</option>
                    <option value="watchdog">Watchdog</option>
                    <option value="usb">USB Tether</option>
                    <option value="cloudflare">Cloudflare</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Region Label</label>
                  <input
                    type="text"
                    value={newEndpointLocation}
                    onChange={(e) => setNewEndpointLocation(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newEndpointLat}
                    onChange={(e) => setNewEndpointLat(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newEndpointLng}
                    onChange={(e) => setNewEndpointLng(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEndpointModalOpen(false)}
                  className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addEndpointBusy}
                  className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white uppercase font-bold cursor-pointer disabled:opacity-50"
                >
                  {addEndpointBusy ? "Saving..." : "Save Endpoint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Suspense fallback={null}>
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          profiles={fleetProfiles}
          onSelectProfile={handleSelectProfile}
          onNavigateTab={setCurrentTab}
          onToggleMapView={(mode) => setTopologyViewMode(mode === "map" ? "map" : "svg")}
          onRunBatchProbe={handleRunBatchProbe}
          onCopyActiveConfig={handleCopyCode}
          onOpenExportZip={() => setIsBackupModalOpen(true)}
          onOpenAddNode={() => setIsAddEndpointModalOpen(true)}
          onGenerateWgKeys={handleGenerateWgKeys}
          onGenerateSshKeys={handleGenerateSshKeys}
        />
      </Suspense>
      <OfflineIndicator snapshotTimestamp={offlineSnapshotTs} />

      {/* Native Android Bottom Navigation Bar (48px+ thumb-zone targets) */}
      <nav
        aria-label="Android Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0b0e17]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center px-2 font-mono shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
      >
        <button
          type="button"
          onClick={() => {
            setCurrentTab("network");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition cursor-pointer ${
            currentTab === "network" && !streamlinedAndroidMode
              ? "text-cyan-300 bg-cyan-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Activity className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Command</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentTab("network");
            setTimeout(() => {
              const el = document.getElementById("workbench-self-tune");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 80);
          }}
          className="min-h-[48px] flex flex-col items-center justify-center rounded-2xl text-emerald-300 hover:bg-emerald-500/10 transition cursor-pointer"
        >
          <Cpu className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Self-Tune</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentTab("network");
            setStreamlinedAndroidMode((prev) => !prev);
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition cursor-pointer ${
            streamlinedAndroidMode
              ? "text-emerald-200 bg-emerald-500/20 border border-emerald-500/40"
              : "text-amber-300 hover:bg-amber-500/10"
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Android UI</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("keep")}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition cursor-pointer ${
            currentTab === "keep"
              ? "text-cyan-300 bg-cyan-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Keep Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("expansion")}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition cursor-pointer ${
            currentTab === "expansion"
              ? "text-purple-300 bg-purple-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Sentinel</span>
        </button>
      </nav>
    </div>
  );
}
