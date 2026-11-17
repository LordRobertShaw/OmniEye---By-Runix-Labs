import React, { useEffect, useState } from "react";
import {
  Activity,
  Archive,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  Lock,
  Play,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import {
  AuditLedgerEntry,
  ChaosDrillReport,
  DeviceEncyclopediaEntry,
  DohResolverAuditResult,
  HardwareScanReport,
  NodeCommandEntry,
  PmtudProfileResult,
  TelemetryRetentionStats,
  TunnelProfile,
  VQueryVerifyReport,
  WebhookDeliveryEntry,
  runLocalHardwareWasmScan,
} from "../utils/networkTools";
import SelfTuningBenchmarkModule from "./SelfTuningBenchmarkModule";

interface FailoverAndDeliveryPanelProps {
  profiles: TunnelProfile[];
  webhookDeliveries: WebhookDeliveryEntry[];
  retentionStats: TelemetryRetentionStats | null;
  nodeCommands?: NodeCommandEntry[];
  auditLedger?: AuditLedgerEntry[];
  deviceEncyclopedia?: DeviceEncyclopediaEntry[];
  userRole?: "owner" | "operator" | "auditor";
  activeHardwareDevice?: DeviceEncyclopediaEntry | null;
  hardwareScanReport?: HardwareScanReport | null;
  recommendedDeviceSlug?: string;
  currentMtu?: number;
  currentKeepaliveSec?: number;
  onUpdateFailoverPolicy: (
    profileId: number | string,
    failoverRole: "primary" | "backup" | "standalone",
    failoverTargetId: number | null
  ) => Promise<void> | void;
  onSetMaintenanceWindow?: (
    profileId: number | string,
    maintenanceUntil: string | null
  ) => Promise<void> | void;
  onTriggerCanaryRollout?: () => Promise<void> | void;
  onEnqueueNodeCommand?: (
    profileId: number | string,
    commandType: "reload_nft_blocklist" | "rotate_wg_key" | "run_mtr_trace" | "sync_geoip_rules"
  ) => Promise<void> | void;
  onSwitchRbacRole?: (role: "owner" | "operator" | "auditor") => Promise<void> | void;
  onRunChaosDrill?: () => Promise<ChaosDrillReport | null> | void;
  onApplyHardwareSelfTuning?: (device: DeviceEncyclopediaEntry | null) => void;
  onRunHardwareScan?: () => Promise<HardwareScanReport | null> | void;
  onApplyOptimalMtu?: (mtu: number, dns?: string) => void;
  onRetryWebhookDelivery: (deliveryId: number | string) => Promise<void> | void;
  onCompactRetention: (retentionDays?: number) => Promise<void> | void;
}

export default function FailoverAndDeliveryPanel({
  profiles,
  webhookDeliveries,
  retentionStats,
  nodeCommands = [],
  auditLedger = [],
  deviceEncyclopedia = [],
  userRole = "owner",
  activeHardwareDevice = null,
  hardwareScanReport = null,
  recommendedDeviceSlug = "",
  currentMtu = 1420,
  currentKeepaliveSec = 25,
  onUpdateFailoverPolicy,
  onSetMaintenanceWindow,
  onTriggerCanaryRollout,
  onEnqueueNodeCommand,
  onSwitchRbacRole,
  onRunChaosDrill,
  onApplyHardwareSelfTuning,
  onRunHardwareScan,
  onApplyOptimalMtu,
  onRetryWebhookDelivery,
  onCompactRetention,
}: FailoverAndDeliveryPanelProps) {
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [compacting, setCompacting] = useState(false);
  const [canaryBusy, setCanaryBusy] = useState(false);

  // Pull-Based Node Command Queue state
  const [selectedCmdProfileId, setSelectedCmdProfileId] = useState<string>(
    String(profiles[0]?.id ?? "")
  );
  const [selectedCmdType, setSelectedCmdType] = useState<
    "reload_nft_blocklist" | "rotate_wg_key" | "run_mtr_trace" | "sync_geoip_rules"
  >("reload_nft_blocklist");
  const [cmdBusy, setCmdBusy] = useState(false);

  // vquery -> device_encyclopedia discovery & self-tuning state
  const [vquerySearch, setVquerySearch] = useState("");
  const [vqueryCategory, setVqueryCategory] = useState("all");
  const [vqueryResults, setVqueryResults] = useState<DeviceEncyclopediaEntry[]>(deviceEncyclopedia);
  const [vqueryLatencyMs, setVqueryLatencyMs] = useState<number | null>(null);
  const [vqueryVerifyReport, setVqueryVerifyReport] = useState<VQueryVerifyReport | null>(null);
  const [verifyingVquery, setVerifyingVquery] = useState(false);
  const [localScanReport, setLocalScanReport] = useState<HardwareScanReport | null>(null);

  // Live DoH & Adaptive PMTUD state
  const [dohResults, setDohResults] = useState<DohResolverAuditResult[] | null>(null);
  const [dohBusy, setDohBusy] = useState(false);
  const [pmtudResult, setPmtudResult] = useState<PmtudProfileResult | null>(null);
  const [pmtudBusy, setPmtudBusy] = useState(false);

  // Chaos Drill & Prometheus Metrics preview
  const [chaosReport, setChaosReport] = useState<ChaosDrillReport | null>(null);
  const [chaosBusy, setChaosBusy] = useState(false);
  const [metricsPreview, setMetricsPreview] = useState<string | null>(null);
  const [metricsBusy, setMetricsBusy] = useState(false);

  useEffect(() => {
    if (deviceEncyclopedia.length > 0 && vqueryResults.length === 0) {
      setVqueryResults(deviceEncyclopedia);
    }
  }, [deviceEncyclopedia, vqueryResults.length]);

  const handleRunVquerySearch = async (queryOverride?: string, catOverride?: string) => {
    const q = queryOverride !== undefined ? queryOverride : vquerySearch;
    const cat = catOverride !== undefined ? catOverride : vqueryCategory;
    try {
      const res = await fetch(
        `/api/vquery/device-encyclopedia?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`
      );
      if (res.ok) {
        const data = await res.json();
        setVqueryResults(Array.isArray(data.devices) ? data.devices : []);
        setVqueryLatencyMs(typeof data.latencyMs === "number" ? data.latencyMs : 2);
      }
    } catch {
      // fallback to local prop filter
    }
  };

  const handleVerifyVqueryBridge = async () => {
    setVerifyingVquery(true);
    try {
      const res = await fetch("/api/vquery/verify");
      if (res.ok) {
        const report = await res.json();
        setVqueryVerifyReport(report);
      }
    } finally {
      setVerifyingVquery(false);
    }
  };

  const handleAutoDetectHardware = async () => {
    if (onRunHardwareScan) {
      const rep = await onRunHardwareScan();
      if (rep) {
        setLocalScanReport(rep);
        setVquerySearch("");
        await handleRunVquerySearch("", "all");
        return;
      }
    }
    const rep = await runLocalHardwareWasmScan(deviceEncyclopedia);
    setLocalScanReport(rep);
    const matched = deviceEncyclopedia.find((d) => d.deviceSlug === rep.recommendedDeviceSlug);
    if (matched) {
      onApplyHardwareSelfTuning?.(matched);
    }
    setVquerySearch("");
    await handleRunVquerySearch("", "all");
  };

  const handleRunDohAudit = async () => {
    setDohBusy(true);
    try {
      const res = await fetch("/api/diagnostics/doh-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: profiles[0]?.endpointHost || "cloudflare.com" }),
      });
      if (res.ok) {
        const data = await res.json();
        setDohResults(data.resolvers || []);
      }
    } finally {
      setDohBusy(false);
    }
  };

  const handleRunPmtudProfile = async () => {
    setPmtudBusy(true);
    try {
      const activeProf = profiles.find((p) => p.isActive) || profiles[0];
      const res = await fetch("/api/diagnostics/pmtud-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: activeProf?.endpointHost || "1.1.1.1",
          port: activeProf?.endpointPort || 443,
          linkType: activeProf?.category || "auto",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPmtudResult(data);
      }
    } finally {
      setPmtudBusy(false);
    }
  };

  const handleLoadPrometheusMetrics = async () => {
    setMetricsBusy(true);
    try {
      const token = profiles[0]?.ingestToken || "";
      const res = await fetch(`/api/metrics?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const text = await res.text();
        setMetricsPreview(text);
      }
    } finally {
      setMetricsBusy(false);
    }
  };

  const backupCandidates = profiles.filter(
    (p) => p.failoverRole === "backup" || profiles.length > 1
  );

  const localCores =
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8;

  const effectiveScanReport = hardwareScanReport || localScanReport;
  const effectiveRecommendedSlug =
    recommendedDeviceSlug || effectiveScanReport?.recommendedDeviceSlug || "";
  const activeProf = profiles.find((p) => p.isActive) || profiles[0];

  return (
    <div className="space-y-4 font-mono">
      {/* 0. vquery -> device_encyclopedia Hardware Discovery & Self-Tuning Workbench */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-[#0b0e16] to-cyan-950/30 border border-cyan-500/30 rounded-lg p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <div>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                vquery → device_encyclopedia Hardware Discovery &amp; Device-Specific Self-Tuning
              </span>
              <span className="text-[9px] text-gray-400">
                Queries indexed NIC drivers, PCIe/USB bus quirks, CPU crypto extensions &amp; BBRv3 sysctl profiles ({localCores} local CPU threads detected)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleVerifyVqueryBridge}
              disabled={verifyingVquery}
              className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="h-3 w-3" />
              {verifyingVquery ? "Verifying vquery..." : "Verify device_encyclopedia Access"}
            </button>
            <button
              type="button"
              onClick={handleAutoDetectHardware}
              className="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3 w-3" />
              Run Hardware Scan
            </button>
          </div>
        </div>

        {vqueryVerifyReport && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-md p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <div className="space-y-0.5">
              <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                vquery Connected: {vqueryVerifyReport.projectSource} • Table: {vqueryVerifyReport.databaseTable}
              </div>
              <div className="text-[9px] text-gray-300">
                Indexed Hardware Profiles: <span className="text-white font-bold">{vqueryVerifyReport.indexedDeviceCount}</span> • Query Latency:{" "}
                <span className="text-emerald-300 font-bold">{vqueryVerifyReport.queryLatencyMs}ms</span> • Status: {vqueryVerifyReport.externalBridgeStatus}
              </div>
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 uppercase font-bold">
              VERIFIED {new Date(vqueryVerifyReport.verifiedAt).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* vquery Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={vquerySearch}
              onChange={(e) => {
                setVquerySearch(e.target.value);
                handleRunVquerySearch(e.target.value, vqueryCategory);
              }}
              placeholder="vquery device_encyclopedia (e.g., hp realtek, samsung tab s9 rndis, dragon-hub intel, iphone ipheth, rpi5)..."
              className="w-full bg-black/70 border border-white/15 rounded pl-8 pr-3 py-1.5 text-[10px] text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <select
            value={vqueryCategory}
            onChange={(e) => {
              setVqueryCategory(e.target.value);
              handleRunVquerySearch(vquerySearch, e.target.value);
            }}
            className="bg-black/70 border border-white/15 rounded px-2.5 py-1.5 text-[10px] text-gray-200"
          >
            <option value="all">All Hardware Classes</option>
            <option value="workstation">Workstation / Laptop</option>
            <option value="mobile_tether">5G / USB Tether Gateway</option>
            <option value="edge_router">Sovereign Edge Server</option>
            <option value="arm_sbc">ARM64 Watchdog SBC</option>
            <option value="cloud_vps">Cloud Bastion VirtIO</option>
          </select>
          {vqueryLatencyMs !== null && (
            <span className="text-[9px] text-cyan-300">
              vquery: {vqueryResults.length} match(es) in {vqueryLatencyMs}ms
            </span>
          )}
        </div>

        {/* Hardware Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(vqueryResults.length > 0 ? vqueryResults : deviceEncyclopedia).slice(0, 6).map((dev) => {
            const isSelected = activeHardwareDevice?.deviceSlug === dev.deviceSlug;
            const isRecommended = effectiveRecommendedSlug === dev.deviceSlug;
            return (
              <div
                key={dev.deviceSlug}
                className={`rounded-md p-2.5 border transition-all flex flex-col justify-between gap-2 text-[10px] ${
                  isSelected
                    ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                    : isRecommended
                    ? "bg-emerald-950/25 border-emerald-500/40"
                    : "bg-black/60 border-white/10 hover:border-white/25"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="space-y-0.5">
                      <span className="text-white font-bold leading-tight block">{dev.modelName}</span>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[8px] font-bold uppercase">
                          <Sparkles className="h-2.5 w-2.5" />
                          Recommended for this hardware
                        </span>
                      )}
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[8px] uppercase shrink-0">
                      MTU {dev.optimalMtu}
                    </span>
                  </div>
                  <div className="text-[9px] text-amber-300/90 font-mono">
                    {dev.usbOrPciId} • Driver: {dev.nicDriver} • {dev.cpuArch}
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-2">{dev.technicalNotes}</div>
                  <div className="bg-black/70 border border-white/5 rounded px-2 py-1 text-[8px] text-emerald-300 truncate">
                    Quirk: {dev.kernelQuirks}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/5">
                  <span className="text-[8px] text-gray-500">
                    Keepalive: {dev.optimalKeepaliveSec}s • QLen: {dev.txQueueLen}
                  </span>
                  <button
                    type="button"
                    onClick={() => onApplyHardwareSelfTuning?.(isSelected ? null : dev)}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? "bg-emerald-500/20 border border-emerald-400 text-emerald-200"
                        : "bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200"
                    }`}
                  >
                    <Wrench className="h-2.5 w-2.5" />
                    {isSelected ? "Active in Workbench" : "Self-Tune Workbench"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Embedded Self-Tuning 10s Throughput Benchmark Module */}
        {onApplyHardwareSelfTuning && (
          <SelfTuningBenchmarkModule
            deviceEncyclopedia={deviceEncyclopedia}
            activeHardwareDevice={activeHardwareDevice}
            recommendedDeviceSlug={effectiveRecommendedSlug}
            hardwareScanReport={effectiveScanReport}
            currentMtu={currentMtu}
            currentKeepaliveSec={currentKeepaliveSec}
            selectedProfile={activeProf || null}
            onSelectHardwareDevice={onApplyHardwareSelfTuning}
            onRunHardwareScan={async () => {
              if (onRunHardwareScan) {
                const res = await onRunHardwareScan();
                if (res) {
                  setLocalScanReport(res);
                  return res;
                }
              }
              const rep = await runLocalHardwareWasmScan(deviceEncyclopedia);
              setLocalScanReport(rep);
              const matched = deviceEncyclopedia.find(
                (d) => d.deviceSlug === rep.recommendedDeviceSlug
              );
              if (matched) onApplyHardwareSelfTuning(matched);
              return rep;
            }}
          />
        )}
      </div>

      {/* 1. Automated Failover, Maintenance Windows, Canary Rollout & Route-Flap Correlation */}
      <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
            Automated Failover Hysteresis, Maintenance Windows &amp; Canary Staged Rollouts
          </span>
          <div className="flex items-center gap-2">
            {onTriggerCanaryRollout && (
              <button
                type="button"
                disabled={canaryBusy}
                onClick={async () => {
                  setCanaryBusy(true);
                  try {
                    await onTriggerCanaryRollout();
                  } finally {
                    setCanaryBusy(false);
                  }
                }}
                className="px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-2.5 w-2.5" />
                {canaryBusy ? "Staging Canary..." : "Run Canary Config Rollout"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {profiles.map((prof) => {
            const role = (prof.failoverRole || "standalone") as "primary" | "backup" | "standalone";
            const healthState = prof.healthState || "healthy";
            const isFailedOver = healthState === "failed_over";
            const isDegraded = healthState === "degraded";
            const targetObj = profiles.find((p) => Number(p.id) === Number(prof.failoverTargetId));
            const inMaint = Boolean(
              prof.maintenanceUntil && new Date(prof.maintenanceUntil).getTime() > Date.now()
            );

            return (
              <div
                key={prof.id}
                className="bg-[#0b0d10] border border-white/10 rounded-md p-2.5 flex flex-col gap-2 text-[10px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate flex items-center gap-1.5">
                      <span>{prof.name}</span>
                      {prof.restrictToRegion && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] uppercase">
                          Geo-Locked
                        </span>
                      )}
                      {prof.canaryStatus === "promoted" && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[8px] uppercase">
                          Canary OK
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-500">
                      Faults: {prof.consecutiveFailures ?? 0}/3 • Flaps: {prof.routeFlapCount ?? 0}
                      {prof.lastResolvedIp ? ` • IP: ${prof.lastResolvedIp}` : ""}
                      {targetObj ? ` • Backup → ${targetObj.name}` : ""}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase shrink-0 ${
                      inMaint
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                        : isFailedOver
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse"
                        : isDegraded
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {inMaint ? "MAINTENANCE" : healthState.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={role}
                    disabled={busyProfileId === String(prof.id)}
                    onChange={async (e) => {
                      const nextRole = e.target.value as "primary" | "backup" | "standalone";
                      setBusyProfileId(String(prof.id));
                      try {
                        await onUpdateFailoverPolicy(
                          prof.id,
                          nextRole,
                          nextRole === "primary" ? (prof.failoverTargetId ?? null) : null
                        );
                      } finally {
                        setBusyProfileId(null);
                      }
                    }}
                    className="bg-black border border-white/15 rounded px-1.5 py-1 text-[9px] text-gray-200"
                  >
                    <option value="standalone">Standalone</option>
                    <option value="primary">Primary Node</option>
                    <option value="backup">Warm Backup</option>
                  </select>

                  <select
                    value={prof.failoverTargetId ?? ""}
                    disabled={role !== "primary" || busyProfileId === String(prof.id)}
                    onChange={async (e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setBusyProfileId(String(prof.id));
                      try {
                        await onUpdateFailoverPolicy(prof.id, role, val);
                      } finally {
                        setBusyProfileId(null);
                      }
                    }}
                    className="bg-black border border-white/15 rounded px-1.5 py-1 text-[9px] text-gray-200 disabled:opacity-40"
                  >
                    <option value="">No Backup</option>
                    {backupCandidates
                      .filter((cand) => String(cand.id) !== String(prof.id) && typeof cand.id === "number")
                      .map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          → {cand.name}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const nextMaint = inMaint
                        ? null
                        : new Date(Date.now() + 60 * 60_000).toISOString();
                      onSetMaintenanceWindow?.(prof.id, nextMaint);
                    }}
                    className={`px-2 py-1 rounded border text-[9px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer ${
                      inMaint
                        ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-200"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                    }`}
                  >
                    <CalendarClock className="h-2.5 w-2.5" />
                    {inMaint ? "End Maint" : "Maint +1h"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Pull-Based Node Command Queue & Live DoH / PMTUD Profilers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Pull-Based Node Command Queue */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              Pull-Based Node Command Queue (Zero-Inbound-SSH)
            </span>
            <span className="text-[9px] text-gray-500">HMAC-SHA256 Signed Heartbeat Pull</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={selectedCmdProfileId}
              onChange={(e) => setSelectedCmdProfileId(e.target.value)}
              className="bg-black border border-white/15 rounded px-2 py-1 text-[10px] text-gray-200"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCmdType}
              onChange={(e) => setSelectedCmdType(e.target.value as any)}
              className="bg-black border border-white/15 rounded px-2 py-1 text-[10px] text-gray-200 flex-1"
            >
              <option value="reload_nft_blocklist">reload_nft_blocklist (Sync Auto-Ban Set)</option>
              <option value="sync_geoip_rules">sync_geoip_rules (Enforce Regional Firewall)</option>
              <option value="rotate_wg_key">rotate_wg_key (Cycle Ephemeral PSK)</option>
              <option value="run_mtr_trace">run_mtr_trace (Capture Hop Telemetry)</option>
            </select>

            <button
              type="button"
              disabled={cmdBusy || !onEnqueueNodeCommand}
              onClick={async () => {
                if (!onEnqueueNodeCommand) return;
                setCmdBusy(true);
                try {
                  await onEnqueueNodeCommand(
                    selectedCmdProfileId || profiles[0]?.id,
                    selectedCmdType
                  );
                } finally {
                  setCmdBusy(false);
                }
              }}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[9px] font-bold uppercase cursor-pointer disabled:opacity-50"
            >
              {cmdBusy ? "Queueing..." : "Queue Command"}
            </button>
          </div>

          <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
            {nodeCommands.length === 0 ? (
              <div className="text-[9px] text-gray-500 bg-black/40 border border-white/5 rounded p-2 text-center">
                No queued node commands. Commands queued here are pulled &amp; executed on the node&apos;s next heartbeat.
              </div>
            ) : (
              nodeCommands.slice(0, 8).map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-black/60 border border-white/5 rounded px-2 py-1.5 flex items-center justify-between gap-2 text-[9px]"
                >
                  <div className="truncate">
                    <span className="text-white font-bold">{cmd.tunnelName}</span> •{" "}
                    <span className="text-cyan-300">{cmd.commandType}</span>{" "}
                    <span className="text-gray-500">(HMAC {cmd.signatureHmac.slice(0, 8)})</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded uppercase text-[8px] font-bold ${
                      cmd.status === "acked"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : cmd.status === "dispatched"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {cmd.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live DoH Resolver Audit & Adaptive PMTUD Profiler */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-indigo-400" />
              Live DoH Leak Audit &amp; Adaptive Path MTU Profiler
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={dohBusy}
                onClick={handleRunDohAudit}
                className="px-2 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-[9px] font-bold uppercase cursor-pointer"
              >
                {dohBusy ? "Auditing DoH..." : "Audit DoH Resolvers"}
              </button>
              <button
                type="button"
                disabled={pmtudBusy}
                onClick={handleRunPmtudProfile}
                className="px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-[9px] font-bold uppercase cursor-pointer"
              >
                {pmtudBusy ? "Profiling MTU..." : "Profile Path MTU"}
              </button>
            </div>
          </div>

          {dohResults && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9px]">
              {dohResults.map((r) => (
                <div
                  key={r.resolver}
                  className="bg-black/60 border border-white/10 rounded p-1.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{r.resolver}</span>
                    <span className="text-emerald-300 font-bold">{r.rttMs}ms</span>
                  </div>
                  <div className="text-[8px] text-gray-400 truncate">{r.name}</div>
                </div>
              ))}
            </div>
          )}

          {pmtudResult && (
            <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
              <div>
                <span className="text-cyan-200 font-bold">
                  Optimal WireGuard MTU: {pmtudResult.optimalWireGuardMtu}B
                </span>{" "}
                • SSH MSS: {pmtudResult.recommendedSshMss}B •{" "}
                {pmtudResult.cgnatDetected ? "Carrier CGNAT Overhead (80B)" : "Direct IPv4/v6 (60B)"}
              </div>
              {onApplyOptimalMtu && (
                <button
                  type="button"
                  onClick={() => onApplyOptimalMtu(pmtudResult.optimalWireGuardMtu, "1.1.1.3")}
                  className="px-2 py-0.5 rounded bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 font-bold uppercase cursor-pointer"
                >
                  Apply {pmtudResult.optimalWireGuardMtu} MTU
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Durable Webhook Delivery Ledger & Retention Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Webhook Delivery Ledger (2 cols) */}
        <div className="lg:col-span-2 bg-black/50 border border-white/10 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-amber-400" />
              Persistent Webhook Delivery Ledger &amp; Backoff Queue
            </span>
            <span className="text-[9px] text-gray-500">
              {webhookDeliveries.length} recorded attempt(s) • 15s auto-retry worker
            </span>
          </div>

          {webhookDeliveries.length === 0 ? (
            <div className="text-[10px] text-gray-500 bg-black/40 border border-white/5 rounded px-3 py-3 text-center">
              No webhook deliveries recorded yet. Breach alerts, drift events, or failover switches will log delivery receipts here.
            </div>
          ) : (
            <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
              {webhookDeliveries.slice(0, 20).map((del) => {
                const isOk = del.status === "delivered";
                const isRetrying = del.status === "retrying";
                return (
                  <div
                    key={del.id}
                    className="bg-black/60 border border-white/5 rounded px-2.5 py-2 flex items-center justify-between gap-2 text-[10px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            isOk
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                              : isRetrying
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                          }`}
                        >
                          {del.status} ({del.attemptCount}/{del.maxAttempts})
                        </span>
                        <span className="text-white font-bold truncate">{del.title}</span>
                        <span className="text-[9px] text-gray-500">
                          via {del.webhookName} ({del.provider})
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-400 truncate mt-0.5">
                        {del.lastError
                          ? `Last error: ${del.lastError}`
                          : `HTTP ${del.httpStatus ?? 200} • ${del.rttMs ?? 0}ms`}
                      </div>
                    </div>

                    {!isOk && (
                      <button
                        type="button"
                        disabled={retryingId === String(del.id)}
                        onClick={async () => {
                          setRetryingId(String(del.id));
                          try {
                            await onRetryWebhookDelivery(del.id);
                          } finally {
                            setRetryingId(null);
                          }
                        }}
                        className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-2.5 w-2.5 ${retryingId === String(del.id) ? "animate-spin" : ""}`}
                        />
                        Retry
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cloud SQL Retention & Compaction (1 col) */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3 flex flex-col justify-between gap-2.5">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              14-Day Data Retention &amp; Compaction
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-black/60 border border-white/5 rounded p-2">
                <span className="text-[8px] text-gray-500 uppercase block">Probe Logs</span>
                <span className="text-sm font-bold text-white">
                  {retentionStats?.probeLogRows ?? 0}
                </span>
              </div>
              <div className="bg-black/60 border border-white/5 rounded p-2">
                <span className="text-[8px] text-gray-500 uppercase block">Auth Audits</span>
                <span className="text-sm font-bold text-white">
                  {retentionStats?.authLogRows ?? 0}
                </span>
              </div>
              <div className="bg-black/60 border border-white/5 rounded p-2">
                <span className="text-[8px] text-gray-500 uppercase block">SLA Rollups</span>
                <span className="text-sm font-bold text-emerald-300">
                  {retentionStats?.slaRollupRows ?? 0}
                </span>
              </div>
              <div className="bg-black/60 border border-white/5 rounded p-2">
                <span className="text-[8px] text-gray-500 uppercase block">Revisions</span>
                <span className="text-sm font-bold text-cyan-300">
                  {retentionStats?.configRevisionRows ?? 0}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={compacting}
            onClick={async () => {
              setCompacting(true);
              try {
                await onCompactRetention(14);
              } finally {
                setCompacting(false);
              }
            }}
            className="w-full py-1.5 px-3 rounded bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-gray-200 hover:text-emerald-300 text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {compacting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Archive className="h-3 w-3" />
            )}
            {compacting ? "Compacting..." : "Compact Logs >14 Days"}
          </button>
        </div>
      </div>

      {/* 4. Hash-Chained Audit Ledger, RBAC Tier, Prometheus Metrics & Game-Day Chaos Drill */}
      <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              Tamper-Evident SHA-256 Audit Ledger, RBAC &amp; Game-Day Chaos Drill
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onSwitchRbacRole && (
              <select
                value={userRole}
                onChange={(e) => onSwitchRbacRole(e.target.value as any)}
                className="bg-black border border-white/15 rounded px-2 py-1 text-[9px] text-amber-200 font-bold uppercase"
              >
                <option value="owner">RBAC: Owner</option>
                <option value="operator">RBAC: Operator</option>
                <option value="auditor">RBAC: Auditor</option>
              </select>
            )}

            <button
              type="button"
              disabled={metricsBusy}
              onClick={handleLoadPrometheusMetrics}
              className="px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold uppercase cursor-pointer"
            >
              {metricsBusy ? "Loading /metrics..." : "Preview Prometheus /metrics"}
            </button>

            {onRunChaosDrill && (
              <button
                type="button"
                disabled={chaosBusy}
                onClick={async () => {
                  setChaosBusy(true);
                  try {
                    const rep = await onRunChaosDrill();
                    if (rep) setChaosReport(rep);
                  } finally {
                    setChaosBusy(false);
                  }
                }}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <Flame className="h-3 w-3 text-rose-400" />
                {chaosBusy ? "Running Game-Day Drill..." : "Run Game-Day Chaos Drill"}
              </button>
            )}
          </div>
        </div>

        {chaosReport && (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded p-2.5 space-y-1.5 text-[9px]">
            <div className="flex items-center justify-between text-rose-200 font-bold">
              <span>
                {chaosReport.drillId} • Completed in {chaosReport.durationMs}ms • Standby Promoted:{" "}
                {chaosReport.failoverPromotedNode || "Verified"}
              </span>
              <span className="text-emerald-300">Audit Chain SHA-256: {chaosReport.auditHash.slice(0, 14)}...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {chaosReport.steps.map((s) => (
                <div key={s.step} className="bg-black/60 border border-white/5 rounded p-1.5">
                  <div className="text-emerald-300 font-bold">{s.step}</div>
                  <div className="text-gray-400">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {metricsPreview && (
          <div className="bg-black/80 border border-cyan-500/30 rounded p-2 text-[9px] text-cyan-200 max-h-[110px] overflow-y-auto whitespace-pre font-mono">
            {metricsPreview}
          </div>
        )}

        {auditLedger.length > 0 && (
          <div className="max-h-[115px] overflow-y-auto space-y-1 pr-1">
            {auditLedger.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="bg-black/60 border border-white/5 rounded px-2 py-1 flex items-center justify-between gap-2 text-[9px]"
              >
                <div className="truncate">
                  <span className="text-amber-300 font-bold uppercase">{entry.actionType}</span> •{" "}
                  <span className="text-white">{entry.targetName}</span>:{" "}
                  <span className="text-gray-400">{entry.details}</span>
                </div>
                <span className="text-[8px] text-emerald-400/90 font-mono shrink-0">
                  #{entry.entryHash.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
