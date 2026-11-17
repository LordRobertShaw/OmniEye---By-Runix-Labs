import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Copy,
  Download,
  Filter,
  History,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Terminal,
  XCircle,
} from "lucide-react";
import {
  AuthOutcome,
  AuthProtocol,
  TunnelAuthLogEntry,
  TunnelProfile,
} from "../utils/networkTools";

interface TunnelAuthHistorySectionProps {
  fleetProfiles: TunnelProfile[];
  authLogs: TunnelAuthLogEntry[];
  onRecordAuthLog: (entry: {
    profileId?: number | string | null;
    tunnelName: string;
    protocol: AuthProtocol;
    outcome: AuthOutcome;
    actor: string;
    sourceIp: string;
    authMethod: string;
    reason: string;
  }) => Promise<void> | void;
  onRefreshAuthLogs?: () => Promise<void> | void;
  onSecurityFeedNote?: (
    category: string,
    message: string,
    type: "info" | "warning" | "success"
  ) => void;
}

const PROTOCOL_META: Record<
  AuthProtocol,
  {
    label: string;
    short: string;
    badgeClass: string;
    defaultMethod: string;
    defaultActor: string;
    defaultReasonOk: string;
    defaultReasonFail: string;
  }
> = {
  ssh: {
    label: "SSH Session History",
    short: "SSH",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    defaultMethod: "ed25519-key",
    defaultActor: "ubuntu",
    defaultReasonOk: "Accepted publickey SHA256 session handshake via sshd.",
    defaultReasonFail: "PAM authentication rejected; invalid key or unauthorized user.",
  },
  cloudflare: {
    label: "Cloudflare Access & Tunnel",
    short: "Cloudflare",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    defaultMethod: "cf-access-jwt",
    defaultActor: "cf-access-service-token",
    defaultReasonOk: "Cloudflared origin edge registration & Zero Trust JWT verified.",
    defaultReasonFail: "Zero Trust Access policy denied connection: expired JWT or missing mTLS cert.",
  },
  tailscale: {
    label: "Tailscale Mesh & ACL",
    short: "Tailscale",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    defaultMethod: "tailscale-ssh-acl",
    defaultActor: "admin-node@tailnet",
    defaultReasonOk: "Tailnet WireGuard node key + ACL check mode passed.",
    defaultReasonFail: "Tailscale ACL policy rejected peer session attempt.",
  },
  wireguard: {
    label: "WireGuard Peer Handshakes",
    short: "WireGuard",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    defaultMethod: "noise-ikpsk2-handshake",
    defaultActor: "wg-peer:X25519",
    defaultReasonOk: "Curve25519 Noise_IKpsk2 handshake authenticated and session keys derived.",
    defaultReasonFail: "Dropped peer handshake: MAC1 verification failed or unknown public key.",
  },
};

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return iso;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString();
}

function ProtocolIcon({ protocol, className = "h-3.5 w-3.5" }: { protocol: AuthProtocol; className?: string }) {
  if (protocol === "ssh") return <Terminal className={className} />;
  if (protocol === "cloudflare") return <Cloud className={className} />;
  if (protocol === "tailscale") return <Shield className={className} />;
  return <KeyRound className={className} />;
}

export const TunnelAuthHistorySection: React.FC<TunnelAuthHistorySectionProps> = ({
  fleetProfiles,
  authLogs,
  onRecordAuthLog,
  onRefreshAuthLogs,
  onSecurityFeedNote,
}) => {
  const [protocolFilter, setProtocolFilter] = useState<"all" | AuthProtocol>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | AuthOutcome>("all");
  const [tunnelFilter, setTunnelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showRecordForm, setShowRecordForm] = useState<boolean>(false);
  const [showForwarderSnippet, setShowForwarderSnippet] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedHook, setCopiedHook] = useState<boolean>(false);

  const activeTunnels = useMemo(
    () => fleetProfiles.filter((p) => p.isActive),
    [fleetProfiles]
  );

  const activeTunnelNamesSet = useMemo(
    () => new Set(activeTunnels.map((p) => p.name)),
    [activeTunnels]
  );

  // Form state for recording a new auth attempt
  const [newProtocol, setNewProtocol] = useState<AuthProtocol>("ssh");
  const [newTunnelName, setNewTunnelName] = useState<string>(
    () => activeTunnels.find((p) => p.category === "ssh")?.name || activeTunnels[0]?.name || "ssh-db-tunnel"
  );
  const [newOutcome, setNewOutcome] = useState<AuthOutcome>("success");
  const [newActor, setNewActor] = useState<string>("ubuntu");
  const [newSourceIp, setNewSourceIp] = useState<string>("203.0.113.60");
  const [newMethod, setNewMethod] = useState<string>("ed25519-key");
  const [newReason, setNewReason] = useState<string>(
    "Accepted publickey SHA256 session handshake via sshd."
  );

  const tunnelOptions = useMemo(() => {
    const names = new Set<string>();
    fleetProfiles.forEach((p) => names.add(p.name));
    authLogs.forEach((l) => names.add(l.tunnelName));
    return Array.from(names);
  }, [fleetProfiles, authLogs]);

  const statsByProtocol = useMemo(() => {
    const base: Record<AuthProtocol, { total: number; success: number; failed: number }> = {
      ssh: { total: 0, success: 0, failed: 0 },
      cloudflare: { total: 0, success: 0, failed: 0 },
      tailscale: { total: 0, success: 0, failed: 0 },
      wireguard: { total: 0, success: 0, failed: 0 },
    };
    authLogs.forEach((log) => {
      const bucket = base[log.protocol];
      if (!bucket) return;
      bucket.total += 1;
      if (log.outcome === "failed") bucket.failed += 1;
      else bucket.success += 1;
    });
    return base;
  }, [authLogs]);

  const totalSuccess = useMemo(
    () => authLogs.filter((l) => l.outcome === "success").length,
    [authLogs]
  );
  const totalFailed = useMemo(
    () => authLogs.filter((l) => l.outcome === "failed").length,
    [authLogs]
  );

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return authLogs.filter((log) => {
      if (protocolFilter !== "all" && log.protocol !== protocolFilter) return false;
      if (outcomeFilter !== "all" && log.outcome !== outcomeFilter) return false;
      if (tunnelFilter !== "all" && log.tunnelName !== tunnelFilter) return false;
      if (q) {
        const hay = `${log.tunnelName} ${log.protocol} ${log.actor} ${log.sourceIp} ${log.authMethod} ${log.reason}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [authLogs, protocolFilter, outcomeFilter, tunnelFilter, searchQuery]);

  const handleProtocolPresetChange = (proto: AuthProtocol) => {
    setNewProtocol(proto);
    const meta = PROTOCOL_META[proto];
    setNewMethod(meta.defaultMethod);
    setNewActor(meta.defaultActor);
    setNewReason(newOutcome === "success" ? meta.defaultReasonOk : meta.defaultReasonFail);
    const matchedProfile =
      activeTunnels.find((p) =>
        proto === "cloudflare"
          ? p.category === "cloudflare"
          : proto === "wireguard"
          ? p.category === "wireguard" || p.category === "watchdog"
          : proto === "ssh"
          ? p.category === "ssh"
          : p.name.toLowerCase().includes("tailscale")
      ) || activeTunnels[0];
    if (matchedProfile) {
      setNewTunnelName(matchedProfile.name);
      setNewSourceIp(matchedProfile.endpointHost);
    } else if (proto === "tailscale") {
      setNewTunnelName("tailscale-dragon-hub");
      setNewSourceIp("100.96.247.22");
    } else if (proto === "cloudflare") {
      setNewTunnelName("cf-edge-ingress");
      setNewSourceIp("172.64.155.14");
    }
  };

  const handleOutcomePresetChange = (outcome: AuthOutcome) => {
    setNewOutcome(outcome);
    const meta = PROTOCOL_META[newProtocol];
    setNewReason(outcome === "success" ? meta.defaultReasonOk : meta.defaultReasonFail);
    if (outcome === "failed" && newProtocol === "ssh") {
      setNewMethod("password-rejected");
      setNewActor("root");
      setNewSourceIp("198.51.100.42");
    } else if (outcome === "success") {
      setNewMethod(meta.defaultMethod);
      setNewActor(meta.defaultActor);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTunnelName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const matched = fleetProfiles.find((p) => p.name === newTunnelName.trim());
      await onRecordAuthLog({
        profileId: typeof matched?.id === "number" ? matched.id : null,
        tunnelName: newTunnelName.trim(),
        protocol: newProtocol,
        outcome: newOutcome,
        actor: newActor.trim() || "operator",
        sourceIp: newSourceIp.trim() || "0.0.0.0",
        authMethod: newMethod.trim() || PROTOCOL_META[newProtocol].defaultMethod,
        reason: newReason.trim() || "Manual audit event recorded.",
      });
      onSecurityFeedNote?.(
        newProtocol === "ssh" ? "SSH-AUDIT" : `${newProtocol.toUpperCase()}-AUDIT`,
        `${newOutcome === "failed" ? "FAILED" : "VERIFIED"} ${newProtocol.toUpperCase()} auth on ${newTunnelName.trim()} (${newActor.trim()} @ ${newSourceIp.trim()})`,
        newOutcome === "failed" ? "warning" : "success"
      );
      setShowRecordForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTestAttempt = async (protocol: AuthProtocol, outcome: AuthOutcome) => {
    const meta = PROTOCOL_META[protocol];
    const matched = activeTunnels.find((p) =>
      protocol === "cloudflare"
        ? p.category === "cloudflare"
        : protocol === "wireguard"
        ? p.category === "wireguard" || p.category === "watchdog"
        : protocol === "ssh"
        ? p.category === "ssh"
        : p.name.toLowerCase().includes("tailscale")
    );
    const tunnelName =
      matched?.name ||
      (protocol === "ssh"
        ? "ssh-db-tunnel"
        : protocol === "cloudflare"
        ? "cf-edge-ingress"
        : protocol === "tailscale"
        ? "tailscale-dragon-hub"
        : "wg-primary-01");
    await onRecordAuthLog({
      profileId: typeof matched?.id === "number" ? matched.id : null,
      tunnelName,
      protocol,
      outcome,
      actor: outcome === "failed" ? "rogue-probe" : meta.defaultActor,
      sourceIp: outcome === "failed" ? "198.51.100.99" : matched?.endpointHost || "100.96.247.22",
      authMethod: outcome === "failed" ? `${protocol}-auth-denied` : meta.defaultMethod,
      reason: outcome === "failed" ? meta.defaultReasonFail : meta.defaultReasonOk,
    });
    onSecurityFeedNote?.(
      `${protocol.toUpperCase()}-AUDIT`,
      `${outcome === "failed" ? "Blocked failed" : "Recorded valid"} ${protocol.toUpperCase()} auth attempt on ${tunnelName}.`,
      outcome === "failed" ? "warning" : "success"
    );
  };

  const handleRefresh = async () => {
    if (!onRefreshAuthLogs || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshAuthLogs();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnieye-tunnel-auth-history-${protocolFilter}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedHookNode = activeTunnels.find((p) => p.ingestToken) || activeTunnels[0];
  const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const pamCurlSnippet = `curl -fsS -X POST "${originUrl}/api/fleet/auth-logs/ingest" -H "Content-Type: application/json" -d '{"ingestToken":"${selectedHookNode?.ingestToken || "YOUR_NODE_INGEST_TOKEN"}","protocol":"ssh","outcome":"success","tunnelName":"${selectedHookNode?.name || "ssh-db-tunnel"}","actor":"'"$PAM_USER"'","sourceIp":"'"$PAM_RHOST"'","authMethod":"pam_exec","reason":"PAM session opened"}'`;

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-4 font-mono text-xs">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            SSH Session History // Multi-Tunnel Auth Audit
          </h4>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Tracks successful and failed authentication attempts across active fleet tunnels (SSH, Cloudflare, Tailscale &amp; WireGuard).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRecordForm((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="h-3 w-3" />
            Log Auth Event
          </button>
          <button
            type="button"
            onClick={() => setShowForwarderSnippet((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition"
          >
            <Lock className="h-3 w-3 text-cyan-400" />
            PAM / Daemon Hook
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition"
          >
            <Download className="h-3 w-3 text-amber-400" />
            Export
          </button>
          {onRefreshAuthLogs && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync
            </button>
          )}
        </div>
      </div>

      {/* Protocol Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-gray-500 uppercase font-bold">Active Fleet Tunnels</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-black text-white">{activeTunnels.length}</span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {totalSuccess} OK / <span className={totalFailed > 0 ? "text-red-400" : "text-gray-500"}>{totalFailed} FAIL</span>
            </span>
          </div>
        </div>

        {(["ssh", "cloudflare", "tailscale", "wireguard"] as AuthProtocol[]).map((proto) => {
          const s = statsByProtocol[proto];
          const meta = PROTOCOL_META[proto];
          const isSelected = protocolFilter === proto;
          return (
            <button
              key={proto}
              type="button"
              onClick={() => setProtocolFilter(isSelected ? "all" : proto)}
              className={`text-left rounded-lg p-2.5 border transition cursor-pointer ${
                isSelected
                  ? "bg-white/10 border-white/30"
                  : "bg-[#0d0d0d] border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex items-center gap-1 ${meta.badgeClass}`}>
                  <ProtocolIcon protocol={proto} className="h-2.5 w-2.5" />
                  {meta.short}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">{s.total} events</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px]">
                <span className="text-emerald-400 font-bold">✓ {s.success}</span>
                <span className={s.failed > 0 ? "text-red-400 font-bold" : "text-gray-500"}>
                  ✕ {s.failed} failed
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Collapsible PAM / Node Log Forwarder Snippet */}
      {showForwarderSnippet && (
        <div className="bg-[#080c10] border border-cyan-500/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-cyan-400 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              Real-Time Node Auth Forwarder (sshd pam_exec / cloudflared / tailscaled / wg)
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(pamCurlSnippet);
                setCopiedHook(true);
                setTimeout(() => setCopiedHook(false), 2000);
              }}
              className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer"
            >
              <Copy className="h-2.5 w-2.5" />
              {copiedHook ? "Copied" : "Copy cURL"}
            </button>
          </div>
          <pre className="text-[10px] text-gray-300 bg-black/70 p-2 rounded border border-white/5 overflow-x-auto whitespace-pre-wrap break-all">
            {pamCurlSnippet}
          </pre>
        </div>
      )}

      {/* Collapsible Log Event Drawer + Quick Simulate Buttons */}
      {showRecordForm && (
        <form
          onSubmit={handleSubmitEvent}
          className="bg-[#0e1012] border border-emerald-500/20 rounded-lg p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase">
              Record Tunnel Authentication Attempt
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] text-gray-500 uppercase mr-1">Quick Test:</span>
              {(["ssh", "cloudflare", "tailscale", "wireguard"] as AuthProtocol[]).map((proto) => (
                <button
                  key={proto}
                  type="button"
                  onClick={() => handleQuickTestAttempt(proto, "failed")}
                  className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[9px] font-bold uppercase cursor-pointer"
                >
                  + Fail {PROTOCOL_META[proto].short}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Protocol</label>
              <select
                value={newProtocol}
                onChange={(e) => handleProtocolPresetChange(e.target.value as AuthProtocol)}
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              >
                <option value="ssh">SSH</option>
                <option value="cloudflare">Cloudflare</option>
                <option value="tailscale">Tailscale</option>
                <option value="wireguard">WireGuard</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Fleet Tunnel</label>
              <input
                type="text"
                list="omnieye-tunnel-names"
                value={newTunnelName}
                onChange={(e) => setNewTunnelName(e.target.value)}
                placeholder="e.g. ssh-db-tunnel"
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              />
              <datalist id="omnieye-tunnel-names">
                {tunnelOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Outcome</label>
              <select
                value={newOutcome}
                onChange={(e) => handleOutcomePresetChange(e.target.value as AuthOutcome)}
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              >
                <option value="success">Success (Authorized)</option>
                <option value="failed">Failed (Blocked / Rejected)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Actor / Identity</label>
              <input
                type="text"
                value={newActor}
                onChange={(e) => setNewActor(e.target.value)}
                placeholder="ubuntu / cf-token / peer"
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Source IP</label>
              <input
                type="text"
                value={newSourceIp}
                onChange={(e) => setNewSourceIp(e.target.value)}
                placeholder="203.0.113.60"
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Auth Method</label>
              <input
                type="text"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                placeholder="ed25519-key"
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[9px] text-gray-500 uppercase mb-1">Session / Failure Reason</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Audit detail..."
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRecordForm(false)}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Commit to Audit Log"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-[#090909] border border-white/5 rounded-lg p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "ssh", "cloudflare", "tailscale", "wireguard"] as const).map((proto) => (
            <button
              key={proto}
              type="button"
              onClick={() => setProtocolFilter(proto)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
                protocolFilter === proto
                  ? "bg-white text-black"
                  : "bg-black/60 text-gray-400 hover:text-white border border-white/10"
              }`}
            >
              {proto !== "all" && <ProtocolIcon protocol={proto} className="h-3 w-3" />}
              {proto === "all" ? `All (${authLogs.length})` : PROTOCOL_META[proto].short}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-black border border-white/10 rounded overflow-hidden">
            {(["all", "success", "failed"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOutcomeFilter(o)}
                className={`px-2 py-1 text-[10px] font-bold uppercase cursor-pointer transition ${
                  outcomeFilter === o
                    ? o === "failed"
                      ? "bg-red-500/20 text-red-400"
                      : o === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/15 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-black border border-white/10 rounded px-2 py-1">
            <Filter className="h-3 w-3 text-gray-500" />
            <select
              value={tunnelFilter}
              onChange={(e) => setTunnelFilter(e.target.value)}
              className="bg-transparent text-[10px] text-gray-300 focus:outline-none"
            >
              <option value="all" className="bg-black">
                All Fleet Tunnels
              </option>
              {tunnelOptions.map((name) => (
                <option key={name} value={name} className="bg-black">
                  {name} {activeTunnelNamesSet.has(name) ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="h-3 w-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter actor, IP, method..."
              className="bg-black border border-white/10 rounded pl-6 pr-2 py-1 text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 w-44"
            />
          </div>
        </div>
      </div>

      {/* Session & Auth History Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/70 max-h-[360px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-2">
            <ShieldAlert className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-[11px]">No authentication events match the active filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111] text-[9px] text-gray-400 uppercase tracking-wider sticky top-0 z-10 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Fleet Tunnel</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Actor / Peer</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Audit Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {filteredLogs.map((log) => {
                const meta = PROTOCOL_META[log.protocol] || PROTOCOL_META.ssh;
                const isActiveNode = activeTunnelNamesSet.has(log.tunnelName);
                const isFailed = log.outcome === "failed";
                return (
                  <tr
                    key={log.id}
                    className={`transition ${
                      isFailed ? "bg-red-950/15 hover:bg-red-950/25" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="py-2 px-3 whitespace-nowrap text-gray-400" title={new Date(log.createdAt).toLocaleString()}>
                      {formatRelativeTime(log.createdAt)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${meta.badgeClass}`}
                      >
                        <ProtocolIcon protocol={log.protocol} className="h-2.5 w-2.5" />
                        {meta.short}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-bold text-white">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActiveNode ? "bg-emerald-400" : "bg-gray-600"
                          }`}
                          title={isActiveNode ? "Active Fleet Tunnel" : "Historical / Edge Tunnel"}
                        />
                        {log.tunnelName}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {isFailed ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-black uppercase">
                          <XCircle className="h-2.5 w-2.5" />
                          FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          SUCCESS
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-gray-200">{log.actor}</td>
                    <td className="py-2 px-3 whitespace-nowrap text-cyan-300 font-semibold">
                      {log.sourceIp}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-gray-400">{log.authMethod}</td>
                    <td className="py-2 px-3 text-gray-400 max-w-[300px] truncate" title={log.reason}>
                      {isFailed && <AlertTriangle className="h-3 w-3 text-red-400 inline mr-1 -mt-0.5" />}
                      {log.reason || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
