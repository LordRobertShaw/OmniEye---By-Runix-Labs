import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck2,
  GitCompare,
  KeyRound,
  Network,
  Plus,
  RefreshCw,
  Shield,
  ShieldBan,
  Trash2,
} from "lucide-react";
import {
  AuthProtocol,
  BlockedIpEntry,
  ConfigRevisionEntry,
  generateTailscaleHujsonAcl,
  generateWireGuardMeshBundle,
  TunnelProfile,
} from "../utils/networkTools";

interface SecurityEnforcementAndLifecyclePanelProps {
  fleetProfiles: TunnelProfile[];
  blockedIps: BlockedIpEntry[];
  workbenchConfigHash?: string;
  workbenchConfig?: string;
  configRevisions?: ConfigRevisionEntry[];
  onBanIp: (input: {
    ipAddress: string;
    protocol: AuthProtocol;
    reason: string;
  }) => Promise<void> | void;
  onUnbanIp: (blockId: number | string) => Promise<void> | void;
  onSyncConfigHash: (profileId: number | string) => Promise<void> | void;
  onAckKeyRotation: (profileId: number | string) => Promise<void> | void;
  onRotateIngestToken?: (profileId: number | string) => Promise<void> | void;
  onRestoreRevision?: (revision: ConfigRevisionEntry) => void;
}

function formatDaysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
}

function formatDaysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.ceil((ts - Date.now()) / 86_400_000);
}

export const SecurityEnforcementAndLifecyclePanel: React.FC<
  SecurityEnforcementAndLifecyclePanelProps
> = ({
  fleetProfiles,
  blockedIps,
  workbenchConfigHash,
  workbenchConfig = "",
  configRevisions = [],
  onBanIp,
  onUnbanIp,
  onSyncConfigHash,
  onAckKeyRotation,
  onRotateIngestToken,
  onRestoreRevision,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"autoban" | "lifecycle" | "mesh">(
    "autoban"
  );

  // Auto-ban form & blocklist export
  const [banIpInput, setBanIpInput] = useState("");
  const [banProtoInput, setBanProtoInput] = useState<AuthProtocol>("ssh");
  const [banReasonInput, setBanReasonInput] = useState("Manual operator firewall drop");
  const [blocklistFormat, setBlocklistFormat] = useState<"nft" | "ufw" | "plain">("nft");
  const [copiedBlocklistCmd, setCopiedBlocklistCmd] = useState(false);

  // Mesh & Tailscale ACL planner
  const [plannerMode, setPlannerMode] = useState<"hub-spoke" | "full-mesh" | "tailscale-acl">(
    "hub-spoke"
  );
  const [tailscaleGroup, setTailscaleGroup] = useState("group:netops");
  const [tailscaleSshCheck, setTailscaleSshCheck] = useState(true);
  const [copiedPlanner, setCopiedPlanner] = useState(false);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [diffRevisionId, setDiffRevisionId] = useState<string | number | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | number | null>(null);

  const primaryTokenNode = fleetProfiles.find((p) => p.ingestToken) || fleetProfiles[0];
  const originUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const blocklistPullCmd = `curl -fsS "${originUrl}/api/fleet/blocklist.txt?token=${
    primaryTokenNode?.ingestToken || "YOUR_INGEST_TOKEN"
  }&format=${blocklistFormat}"${
    blocklistFormat === "nft"
      ? " | sudo nft -f -"
      : blocklistFormat === "ufw"
      ? " | sudo bash"
      : " | sudo tee /etc/omnieye/blocklist.txt"
  }`;

  const meshBundle = useMemo(
    () =>
      generateWireGuardMeshBundle(
        fleetProfiles,
        plannerMode === "full-mesh" ? "full-mesh" : "hub-spoke"
      ),
    [fleetProfiles, plannerMode]
  );

  const tailscaleAclText = useMemo(
    () =>
      generateTailscaleHujsonAcl(fleetProfiles, {
        adminGroup: tailscaleGroup,
        enforceSshCheck: tailscaleSshCheck,
      }),
    [fleetProfiles, tailscaleGroup, tailscaleSshCheck]
  );

  const plannerOutput =
    plannerMode === "tailscale-acl" ? tailscaleAclText : meshBundle.config;

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIpInput.trim()) return;
    await onBanIp({
      ipAddress: banIpInput.trim(),
      protocol: banProtoInput,
      reason: banReasonInput.trim() || "Manual operator ban",
    });
    setBanIpInput("");
  };

  const handleCopyPlanner = () => {
    navigator.clipboard.writeText(plannerOutput);
    setCopiedPlanner(true);
    setTimeout(() => setCopiedPlanner(false), 1800);
  };

  const handleDownloadPlanner = () => {
    const filename =
      plannerMode === "tailscale-acl"
        ? "tailscale-policy.hujson"
        : `omnieye-wg-${plannerMode}.conf`;
    const blob = new Blob([plannerOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const driftCount = fleetProfiles.filter(
    (p) =>
      p.expectedConfigHash &&
      p.reportedConfigHash &&
      p.expectedConfigHash !== p.reportedConfigHash
  ).length;

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-4 font-mono text-xs">
      {/* Section Header + Sub-tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldBan className="h-4 w-4 text-rose-400" />
            Active Enforcement, Drift &amp; Mesh Policy Suite
          </h4>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Automated brute-force IP bans, key rotation &amp; TLS cert expiry tracking, SHA-256 config drift, and WireGuard/Tailscale mesh policy generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab("autoban")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "autoban"
                ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                : "bg-black/50 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            Auto-Ban Firewall ({blockedIps.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("lifecycle")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "lifecycle"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-black/50 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Keys, Certs &amp; Drift {driftCount > 0 ? `(${driftCount} Drift)` : ""}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("mesh")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "mesh"
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                : "bg-black/50 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            WireGuard Mesh &amp; Tailscale ACL
          </button>
        </div>
      </div>

      {/* TAB 1: AUTO-BAN FIREWALL BLOCKLIST */}
      {activeSubTab === "autoban" && (
        <div className="space-y-3">
          <div className="bg-[#0d080a] border border-rose-500/20 rounded-lg p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Auto-Ban Policy: 3+ failed auth attempts within 15m triggers automatic blocklist + webhook
              </span>
              <div className="text-[10px] text-gray-400 bg-black/70 px-2.5 py-1.5 rounded border border-white/5 break-all">
                {blocklistPullCmd}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={blocklistFormat}
                onChange={(e) => setBlocklistFormat(e.target.value as "nft" | "ufw" | "plain")}
                className="bg-black border border-white/15 rounded px-2 py-1.5 text-[10px] text-white"
              >
                <option value="nft">nftables</option>
                <option value="ufw">UFW</option>
                <option value="plain">Plain IPs</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(blocklistPullCmd);
                  setCopiedBlocklistCmd(true);
                  setTimeout(() => setCopiedBlocklistCmd(false), 1800);
                }}
                className="px-2.5 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                {copiedBlocklistCmd ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedBlocklistCmd ? "Copied" : "Copy Sync Hook"}
              </button>
            </div>
          </div>

          <form
            onSubmit={handleManualBan}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-black/40 border border-white/5 rounded-lg p-2.5"
          >
            <input
              type="text"
              value={banIpInput}
              onChange={(e) => setBanIpInput(e.target.value)}
              placeholder="IPv4 / IPv6 to block (e.g. 198.51.100.42)"
              className="sm:col-span-4 bg-black border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white"
            />
            <select
              value={banProtoInput}
              onChange={(e) => setBanProtoInput(e.target.value as AuthProtocol)}
              className="sm:col-span-2 bg-black border border-white/10 rounded px-2 py-1.5 text-[11px] text-white"
            >
              <option value="ssh">SSH</option>
              <option value="cloudflare">Cloudflare</option>
              <option value="tailscale">Tailscale</option>
              <option value="wireguard">WireGuard</option>
            </select>
            <input
              type="text"
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              placeholder="Ban reason..."
              className="sm:col-span-4 bg-black border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase text-[10px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Block IP
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/70 max-h-[240px] overflow-y-auto">
            {blockedIps.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-[11px]">
                No IPs currently blocked. Trigger 3+ failed auth attempts from the same IP or add a manual rule above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111] text-[9px] text-gray-400 uppercase border-b border-white/10">
                  <tr>
                    <th className="py-2 px-3">Blocked IP</th>
                    <th className="py-2 px-3">Protocol</th>
                    <th className="py-2 px-3">Failures</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {blockedIps.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.03]">
                      <td className="py-2 px-3 font-bold text-rose-300">{item.ipAddress}</td>
                      <td className="py-2 px-3 uppercase text-[10px] text-gray-300">
                        {item.protocol}
                      </td>
                      <td className="py-2 px-3 text-amber-300 font-bold">{item.failCount}</td>
                      <td className="py-2 px-3 text-gray-400 max-w-[320px] truncate" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onUnbanIp(item.id)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 text-[9px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KEY ROTATION, TLS CERT EXPIRY & CONFIG DRIFT */}
      {activeSubTab === "lifecycle" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 border border-white/5 rounded-lg p-2.5 text-[10px]">
            <span className="text-gray-400">
              Active Workbench Config SHA-256:{" "}
              <code className="text-cyan-300 font-bold">
                {workbenchConfigHash ? `${workbenchConfigHash.slice(0, 16)}...` : "Computing..."}
              </code>
            </span>
            <span className="text-gray-500">
              Run probes in TLS mode to inspect peer certificate expiry dates automatically.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fleetProfiles.map((prof) => {
              const rotatedDays = formatDaysSince(prof.lastRotatedAt);
              const policyDays = prof.rotationPolicyDays ?? 90;
              const rotationOverdue = rotatedDays !== null && rotatedDays >= policyDays;
              const certDaysLeft = formatDaysUntil(prof.certExpiresAt);
              const certWarning = certDaysLeft !== null && certDaysLeft <= 21;

              const driftState = !prof.expectedConfigHash
                ? "unpinned"
                : !prof.reportedConfigHash
                ? "awaiting-checkin"
                : prof.expectedConfigHash === prof.reportedConfigHash
                ? "synced"
                : "drifted";

              return (
                <div
                  key={prof.id}
                  className="bg-[#0b0c0e] border border-white/10 rounded-lg p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">{prof.name}</span>
                      <span className="ml-2 text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                        {prof.category}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        driftState === "synced"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : driftState === "drifted"
                          ? "bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse"
                          : "bg-white/5 border-white/10 text-gray-400"
                      }`}
                    >
                      {driftState === "synced"
                        ? "HASH SYNCED"
                        : driftState === "drifted"
                        ? "CONFIG DRIFT"
                        : driftState === "awaiting-checkin"
                        ? "PINNED (AWAITING NODE)"
                        : "HASH UNPINNED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-black/50 border border-white/5 rounded p-2">
                      <span className="text-gray-500 text-[9px] uppercase flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 text-amber-400" /> Key Age ({policyDays}d policy)
                      </span>
                      <span
                        className={`font-bold block mt-0.5 ${
                          rotationOverdue ? "text-rose-400" : "text-gray-200"
                        }`}
                      >
                        {rotatedDays !== null ? `${rotatedDays}d since rotation` : "Not stamped yet"}
                      </span>
                    </div>

                    <div className="bg-black/50 border border-white/5 rounded p-2">
                      <span className="text-gray-500 text-[9px] uppercase flex items-center gap-1">
                        <FileCheck2 className="h-2.5 w-2.5 text-cyan-400" /> TLS Certificate
                      </span>
                      <span
                        className={`font-bold block mt-0.5 ${
                          certWarning ? "text-amber-300" : "text-gray-200"
                        }`}
                      >
                        {certDaysLeft !== null
                          ? `${certDaysLeft}d remaining (${prof.certSubject || prof.endpointHost})`
                          : "Probe via TLS to inspect"}
                      </span>
                    </div>
                  </div>

                  {/* Rotating Ingest Token + 24h Grace + HMAC Secret */}
                  <div className="bg-black/40 border border-white/5 rounded p-2 text-[9.5px] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400 uppercase">
                        Token:{" "}
                        <code className="text-emerald-300 font-bold">
                          {prof.ingestToken ? `${prof.ingestToken.slice(0, 10)}...` : "Unprovisioned"}
                        </code>
                        {prof.hmacSecret && (
                          <span className="ml-1.5 text-cyan-400">[HMAC-SHA256 Armed]</span>
                        )}
                      </span>
                      {prof.ingestToken && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `TOKEN=${prof.ingestToken}${prof.hmacSecret ? `\nHMAC_SECRET=${prof.hmacSecret}` : ""}`
                            );
                            setCopiedTokenId(prof.id);
                            setTimeout(() => setCopiedTokenId(null), 1500);
                          }}
                          className="text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedTokenId === prof.id ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                          {copiedTokenId === prof.id ? "Copied" : "Copy Creds"}
                        </button>
                      )}
                    </div>
                    {prof.tokenGraceExpiresAt &&
                      new Date(prof.tokenGraceExpiresAt).getTime() > Date.now() && (
                        <div className="text-[9px] text-amber-300">
                          Previous token grace active until{" "}
                          {new Date(prof.tokenGraceExpiresAt).toLocaleString()}
                        </div>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busyProfileId === String(prof.id)}
                      onClick={async () => {
                        setBusyProfileId(String(prof.id));
                        try {
                          await onSyncConfigHash(prof.id);
                        } finally {
                          setBusyProfileId(null);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <GitCompare className="h-3 w-3" />
                      Pin &amp; Snapshot
                    </button>

                    <div className="flex items-center gap-1.5">
                      {onRotateIngestToken && (
                        <button
                          type="button"
                          disabled={busyProfileId === String(prof.id)}
                          onClick={async () => {
                            setBusyProfileId(String(prof.id));
                            try {
                              await onRotateIngestToken(prof.id);
                            } finally {
                              setBusyProfileId(null);
                            }
                          }}
                          className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Rotate node ingestToken with 24h previous-token grace & generate HMAC secret"
                        >
                          <KeyRound className="h-3 w-3" />
                          Rotate Token
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busyProfileId === String(prof.id)}
                        onClick={async () => {
                          setBusyProfileId(String(prof.id));
                          try {
                            await onAckKeyRotation(prof.id);
                          } finally {
                            setBusyProfileId(null);
                          }
                        }}
                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Stamp Key
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Immutable Config Revisions & One-Click Rollback */}
          <div className="bg-black/45 border border-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <GitCompare className="h-3.5 w-3.5" />
                Immutable Config Revisions &amp; Drift Rollback ({configRevisions.length})
              </span>
              <span className="text-[9px] text-gray-500">
                Created whenever a workbench config hash is pinned
              </span>
            </div>

            {configRevisions.length === 0 ? (
              <div className="text-[10px] text-gray-500 bg-black/40 border border-white/5 rounded px-3 py-2">
                No immutable snapshots saved yet. Click "Pin &amp; Snapshot" on any node above to store a recoverable baseline.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {configRevisions.slice(0, 12).map((rev) => {
                  const isDiffOpen = diffRevisionId === rev.id;
                  const currentLines = new Set(workbenchConfig.split("\n"));
                  const revLines = rev.configBody.split("\n");
                  const changedCount = revLines.filter((l) => !currentLines.has(l)).length;
                  return (
                    <div
                      key={rev.id}
                      className="bg-[#0b0d10] border border-white/10 rounded p-2 text-[10px] space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-white">{rev.tunnelName}</span>
                          <code className="text-[9px] text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/5">
                            {rev.configHash.slice(0, 12)}...
                          </code>
                          <span className="text-[9px] text-gray-500">
                            {new Date(rev.createdAt).toLocaleString()}
                          </span>
                          {changedCount > 0 && (
                            <span className="text-[9px] text-amber-300">
                              • {changedCount} line diff vs workbench
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDiffRevisionId(isDiffOpen ? null : rev.id)}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] text-gray-300 uppercase cursor-pointer"
                          >
                            {isDiffOpen ? "Hide Diff" : "Inspect Diff"}
                          </button>
                          {onRestoreRevision && (
                            <button
                              type="button"
                              onClick={() => onRestoreRevision(rev)}
                              className="px-2 py-0.5 rounded bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold uppercase cursor-pointer"
                            >
                              Restore into Workbench
                            </button>
                          )}
                        </div>
                      </div>

                      {isDiffOpen && (
                        <pre className="bg-black border border-white/10 rounded p-2 text-[9px] max-h-[140px] overflow-y-auto leading-relaxed">
                          {revLines.map((line, i) => {
                            const matchesCurrent = currentLines.has(line);
                            return (
                              <div
                                key={i}
                                className={matchesCurrent ? "text-gray-400" : "text-amber-300 bg-amber-500/10"}
                              >
                                {matchesCurrent ? "  " : "+ "}
                                {line}
                              </div>
                            );
                          })}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WIREGUARD MESH & TAILSCALE HUJSON ACL PLANNER */}
      {activeSubTab === "mesh" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 border border-white/5 rounded-lg p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "hub-spoke", label: "WireGuard Hub & Spoke" },
                  { id: "full-mesh", label: "WireGuard Full Mesh" },
                  { id: "tailscale-acl", label: "Tailscale policy.hujson" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPlannerMode(m.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border cursor-pointer transition ${
                    plannerMode === m.id
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                      : "bg-black border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {plannerMode === "tailscale-acl" && (
                <>
                  <input
                    type="text"
                    value={tailscaleGroup}
                    onChange={(e) => setTailscaleGroup(e.target.value)}
                    placeholder="group:netops"
                    className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white w-28"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tailscaleSshCheck}
                      onChange={(e) => setTailscaleSshCheck(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    SSH check mode
                  </label>
                </>
              )}
              <button
                type="button"
                onClick={handleCopyPlanner}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                {copiedPlanner ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedPlanner ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPlanner}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </div>

          {meshBundle.cidrCollisions.length > 0 && plannerMode !== "tailscale-acl" ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-[10px] text-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                CIDR collision warning across nodes: {meshBundle.cidrCollisions.join(" | ")}
              </span>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-[10px] text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                {plannerMode === "tailscale-acl"
                  ? `Tailscale ACL policy synchronized across ${fleetProfiles.length} fleet nodes.`
                  : `Mesh validated across ${meshBundle.peerCount} active nodes with zero CIDR overlaps.`}
              </span>
            </div>
          )}

          <pre className="bg-[#050608] border border-white/10 rounded-lg p-3 text-[10px] text-gray-200 overflow-x-auto max-h-[280px] overflow-y-auto leading-relaxed">
            {plannerOutput}
          </pre>
        </div>
      )}
    </div>
  );
};
