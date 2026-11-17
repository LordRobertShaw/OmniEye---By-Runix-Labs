import React, { useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  Check,
  Copy,
  Crosshair,
  Gauge,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  AuditLedgerEntry,
  ChaosDrillReport,
  DeviceEncyclopediaEntry,
  HardwareScanReport,
  NodeCommandEntry,
  ProbeLogEntry,
  SlaRollupEntry,
  TelemetryRetentionStats,
  TunnelProfile,
  WebhookDeliveryEntry,
} from "../utils/networkTools";
import FailoverAndDeliveryPanel from "./FailoverAndDeliveryPanel";

interface FleetSlaTelemetryPanelProps {
  profiles: TunnelProfile[];
  selectedProfile: TunnelProfile | null;
  probeLogs: ProbeLogEntry[];
  slaRollups?: SlaRollupEntry[];
  webhookDeliveries?: WebhookDeliveryEntry[];
  retentionStats?: TelemetryRetentionStats | null;
  nodeCommands?: NodeCommandEntry[];
  auditLedger?: AuditLedgerEntry[];
  deviceEncyclopedia?: DeviceEncyclopediaEntry[];
  userRole?: "owner" | "operator" | "auditor";
  activeHardwareDevice?: DeviceEncyclopediaEntry | null;
  hardwareScanReport?: HardwareScanReport | null;
  recommendedDeviceSlug?: string;
  currentMtu?: number;
  currentKeepaliveSec?: number;
  autoPollSec: 0 | 30 | 60;
  onChangeAutoPollSec: (sec: 0 | 30 | 60) => void;
  isBatchProbing: boolean;
  onRunBatchProbe: () => void;
  onRunServerWatchdog?: () => Promise<void> | void;
  onUpdateAlertThreshold: (profileId: number | string, thresholdMs: number) => void;
  onSendTestHeartbeat: (profile: TunnelProfile) => Promise<void>;
  onUpdateFailoverPolicy?: (
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
  onRetryWebhookDelivery?: (deliveryId: number | string) => Promise<void> | void;
  onCompactRetention?: (retentionDays?: number) => Promise<void> | void;
  lastAutoAlertNotice?: string | null;
  lastWatchdogNotice?: string | null;
}

function formatBytes(bytes: number | null | undefined): string {
  const b = Number(bytes || 0);
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

export default function FleetSlaTelemetryPanel({
  profiles,
  selectedProfile,
  probeLogs,
  slaRollups = [],
  webhookDeliveries = [],
  retentionStats = null,
  nodeCommands = [],
  auditLedger = [],
  deviceEncyclopedia = [],
  userRole = "owner",
  activeHardwareDevice = null,
  hardwareScanReport = null,
  recommendedDeviceSlug = "",
  currentMtu = 1420,
  currentKeepaliveSec = 25,
  autoPollSec,
  onChangeAutoPollSec,
  isBatchProbing,
  onRunBatchProbe,
  onRunServerWatchdog,
  onUpdateAlertThreshold,
  onSendTestHeartbeat,
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
  lastAutoAlertNotice,
  lastWatchdogNotice,
}: FleetSlaTelemetryPanelProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [heartbeatSending, setHeartbeatSending] = useState(false);
  const [watchdogSweeping, setWatchdogSweeping] = useState(false);

  const slaStats = useMemo(() => {
    if (probeLogs.length === 0) {
      return {
        uptimePct: 100,
        avgRtt: selectedProfile?.lastRttMs ?? 18,
        p95Rtt: selectedProfile?.lastRttMs ?? 24,
        jitterMs: 3,
        totalSamples: 0,
        series: [14, 16, 15, 19, 13, 18],
      };
    }

    const relevant = selectedProfile
      ? probeLogs.filter(
          (l) =>
            String(l.profileId) === String(selectedProfile.id) ||
            l.target === selectedProfile.endpointHost
        )
      : probeLogs;
    const pool = relevant.length > 0 ? relevant : probeLogs;

    const onlineCount = pool.filter((l) => l.status !== "offline").length;
    const uptimePct = Math.round((onlineCount / pool.length) * 1000) / 10;
    const rtts = pool
      .map((l) => Number(l.rttMs))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avgRtt =
      rtts.length > 0 ? Math.round(rtts.reduce((a, b) => a + b, 0) / rtts.length) : 0;
    const sorted = [...rtts].sort((a, b) => a - b);
    const p95Rtt =
      sorted.length > 0 ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
    const jitterMs = sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0;

    return {
      uptimePct,
      avgRtt,
      p95Rtt,
      jitterMs,
      totalSamples: pool.length,
      series: rtts.slice(0, 20).reverse(),
    };
  }, [probeLogs, selectedProfile]);

  const sparklinePath = useMemo(() => {
    const pts = slaStats.series.length > 1 ? slaStats.series : [15, 15];
    const maxVal = Math.max(...pts, 40);
    const minVal = Math.min(...pts, 0);
    const range = Math.max(1, maxVal - minVal);
    return pts
      .map((val, idx) => {
        const x = (idx / (pts.length - 1)) * 220;
        const y = 38 - ((val - minVal) / range) * 32;
        return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [slaStats.series]);

  const activeThreshold = selectedProfile?.alertThresholdMs ?? 200;
  const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const ingestToken = selectedProfile?.ingestToken || "omnieye-node-token";
  const curlSnippet = `curl -sS -X POST "${originUrl}/api/fleet/heartbeat" -H "Content-Type: application/json" -d '{"ingestToken":"${ingestToken}","rxBytes":10485760,"txBytes":4194304,"handshakeAgeSec":12,"rttMs":19,"interfaceUp":true}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1800);
  };

  const handleTriggerHeartbeat = async () => {
    if (!selectedProfile) return;
    setHeartbeatSending(true);
    try {
      await onSendTestHeartbeat(selectedProfile);
    } finally {
      setHeartbeatSending(false);
    }
  };

  const handleTriggerWatchdog = async () => {
    if (!onRunServerWatchdog) return;
    setWatchdogSweeping(true);
    try {
      await onRunServerWatchdog();
    } finally {
      setWatchdogSweeping(false);
    }
  };

  return (
    <div className="bg-[#08080a] border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="h-4 w-4 text-emerald-400" />
            Closed-Loop SLA, Batch Poller & Node Heartbeat Telemetry
          </h4>
          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
            Driven by persisted probe logs & host wg-dump heartbeats (pauses automatically when browser tab is backgrounded)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-white/10 bg-black/50 p-0.5 text-[10px] font-mono">
            <span className="px-2 text-gray-500">Auto-Poll:</span>
            {([0, 30, 60] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onChangeAutoPollSec(sec)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  autoPollSec === sec
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {sec === 0 ? "Off" : `${sec}s`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRunBatchProbe}
            disabled={isBatchProbing || profiles.length === 0}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {isBatchProbing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Crosshair className="h-3 w-3" />
            )}
            {isBatchProbing ? "Probing Fleet..." : `Batch Probe (${profiles.length})`}
          </button>
          {onRunServerWatchdog && (
            <button
              type="button"
              onClick={handleTriggerWatchdog}
              disabled={watchdogSweeping || profiles.length === 0}
              className="px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {watchdogSweeping ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )}
              {watchdogSweeping ? "Sweeping..." : "24/7 Watchdog Sweep"}
            </button>
          )}
        </div>
      </div>

      {lastAutoAlertNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2 text-[11px] font-mono text-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{lastAutoAlertNotice}</span>
        </div>
      )}

      {lastWatchdogNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center gap-2 text-[11px] font-mono text-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{lastWatchdogNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-black/60 border border-white/5 rounded-lg p-3">
          <span className="text-[9px] font-mono text-gray-500 uppercase block">Node Uptime SLA</span>
          <span className="text-lg font-mono font-bold text-emerald-400">
            {slaStats.uptimePct}%
          </span>
          <span className="text-[9px] font-mono text-gray-500 block">
            {slaStats.totalSamples} recorded samples
          </span>
        </div>

        <div className="bg-black/60 border border-white/5 rounded-lg p-3">
          <span className="text-[9px] font-mono text-gray-500 uppercase block">Avg / P95 RTT</span>
          <span className="text-lg font-mono font-bold text-white">
            {slaStats.avgRtt}ms
          </span>
          <span className="text-[9px] font-mono text-blue-400 block">
            P95: {slaStats.p95Rtt}ms • Jitter: {slaStats.jitterMs}ms
          </span>
        </div>

        <div className="bg-black/60 border border-white/5 rounded-lg p-3">
          <span className="text-[9px] font-mono text-gray-500 uppercase block">Host Heartbeat RX/TX</span>
          <span className="text-sm font-mono font-bold text-cyan-300">
            {formatBytes(selectedProfile?.rxBytes)} / {formatBytes(selectedProfile?.txBytes)}
          </span>
          <span className="text-[9px] font-mono text-gray-500 block">
            {selectedProfile?.handshakeAgeSec !== undefined &&
            selectedProfile?.handshakeAgeSec !== null
              ? `WG Handshake: ${selectedProfile.handshakeAgeSec}s ago`
              : "Awaiting wg-dump pulse"}
          </span>
        </div>

        <div className="bg-black/60 border border-white/5 rounded-lg p-3 col-span-2 flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
              Historical RTT Sparkline
            </span>
            <svg width="220" height="42" className="overflow-visible">
              <path
                d={sparklinePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <Activity className="h-5 w-5 text-emerald-500/50 shrink-0" />
        </div>
      </div>

      {selectedProfile && (
        <div className="bg-black/50 border border-white/10 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                <HeartPulse className="h-3.5 w-3.5" />
                Live Ingest Hook ({selectedProfile.name})
              </span>
              <span className="text-gray-500">•</span>
              <label className="text-gray-400 flex items-center gap-1.5">
                <BellRing className="h-3 w-3 text-amber-400" />
                Alert Threshold (ms):
                <input
                  type="number"
                  min={20}
                  max={5000}
                  value={activeThreshold}
                  onChange={(e) =>
                    onUpdateAlertThreshold(selectedProfile.id, Number(e.target.value) || 200)
                  }
                  className="w-16 bg-black border border-white/15 rounded px-1.5 py-0.5 text-[10px] text-amber-300 font-mono"
                />
              </label>
            </div>
            <div className="text-[10px] font-mono text-gray-400 truncate bg-black/70 px-2 py-1 rounded border border-white/5">
              {curlSnippet}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyCurl}
              className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-gray-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedCurl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copiedCurl ? "Copied" : "Copy cURL"}
            </button>
            <button
              type="button"
              onClick={handleTriggerHeartbeat}
              disabled={heartbeatSending}
              className="px-2.5 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <HeartPulse className="h-3 w-3" />
              {heartbeatSending ? "Sending..." : "Pulse Heartbeat"}
            </button>
          </div>
        </div>
      )}

      {/* 24/7 Server Watchdog Hourly SLA Rollups */}
      <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Persisted Hourly SLA Rollups (24/7 Watchdog)
          </span>
          <span className="text-[9px] font-mono text-gray-500">
            Auto-sweeps every 5m server-side • {slaRollups.length} hourly bucket(s)
          </span>
        </div>

        {slaRollups.length === 0 ? (
          <div className="text-[10px] font-mono text-gray-500 bg-black/40 border border-white/5 rounded px-3 py-2">
            No hourly SLA rollup buckets recorded yet. Click "24/7 Watchdog Sweep" above or wait for the 5-minute server loop.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto pr-1">
            {slaRollups.slice(0, 9).map((rollup) => (
              <div
                key={rollup.id}
                className="bg-black/60 border border-white/5 rounded px-2.5 py-2 flex items-center justify-between gap-2 text-[10px] font-mono"
              >
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">{rollup.tunnelName}</div>
                  <div className="text-[9px] text-gray-500">{rollup.bucketHour}</div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-bold ${
                      rollup.uptimePct >= 99
                        ? "text-emerald-400"
                        : rollup.uptimePct >= 90
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {rollup.uptimePct}% SLA
                  </div>
                  <div className="text-[9px] text-gray-400">
                    {rollup.avgRttMs}ms / P95 {rollup.p95RttMs}ms
                    {rollup.staleHeartbeats > 0 && (
                      <span className="text-amber-400 ml-1">• {rollup.staleHeartbeats} stale</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {onUpdateFailoverPolicy && onRetryWebhookDelivery && onCompactRetention && (
        <FailoverAndDeliveryPanel
          profiles={profiles}
          webhookDeliveries={webhookDeliveries}
          retentionStats={retentionStats}
          nodeCommands={nodeCommands}
          auditLedger={auditLedger}
          deviceEncyclopedia={deviceEncyclopedia}
          userRole={userRole}
          activeHardwareDevice={activeHardwareDevice}
          hardwareScanReport={hardwareScanReport}
          recommendedDeviceSlug={recommendedDeviceSlug}
          currentMtu={currentMtu}
          currentKeepaliveSec={currentKeepaliveSec}
          onUpdateFailoverPolicy={onUpdateFailoverPolicy}
          onSetMaintenanceWindow={onSetMaintenanceWindow}
          onTriggerCanaryRollout={onTriggerCanaryRollout}
          onEnqueueNodeCommand={onEnqueueNodeCommand}
          onSwitchRbacRole={onSwitchRbacRole}
          onRunChaosDrill={onRunChaosDrill}
          onApplyHardwareSelfTuning={onApplyHardwareSelfTuning}
          onRunHardwareScan={onRunHardwareScan}
          onApplyOptimalMtu={onApplyOptimalMtu}
          onRetryWebhookDelivery={onRetryWebhookDelivery}
          onCompactRetention={onCompactRetention}
        />
      )}
    </div>
  );
}
