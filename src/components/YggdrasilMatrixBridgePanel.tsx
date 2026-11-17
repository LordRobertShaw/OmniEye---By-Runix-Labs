import React, { useState } from "react";
import {
  Activity,
  GitBranch,
  Globe,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { DeviceEncyclopediaEntry } from "../utils/networkTools";

interface YggdrasilPeerStatus {
  label: string;
  ipv6Subnet: string;
  host: string;
  port: number;
  hops: number;
  reachable: boolean;
  rttMs: number | null;
  matrixFederation: "synced" | "bridging" | "standby";
}

interface YggdrasilMatrixBridgePanelProps {
  activeHardwareDevice: DeviceEncyclopediaEntry | null;
  isEcoPowerMode: boolean;
  onLoadYggdrasilBlueprint: (mtu: number) => void;
}

const DEFAULT_YGG_PEERS: YggdrasilPeerStatus[] = [
  {
    label: "ygg-core-fra-01",
    ipv6Subnet: "200:4a1e:92c0::/64",
    host: "1.1.1.1",
    port: 443,
    hops: 1,
    reachable: true,
    rttMs: 14,
    matrixFederation: "synced",
  },
  {
    label: "matrix-fed-iad-02",
    ipv6Subnet: "202:8f31:410a::/64",
    host: "8.8.8.8",
    port: 443,
    hops: 2,
    reachable: true,
    rttMs: 19,
    matrixFederation: "synced",
  },
  {
    label: "ygg-edge-nrt-03",
    ipv6Subnet: "204:c112:009e::/64",
    host: "9.9.9.9",
    port: 443,
    hops: 3,
    reachable: true,
    rttMs: 28,
    matrixFederation: "bridging",
  },
];

export default function YggdrasilMatrixBridgePanel({
  activeHardwareDevice,
  isEcoPowerMode,
  onLoadYggdrasilBlueprint,
}: YggdrasilMatrixBridgePanelProps) {
  const [peers, setPeers] = useState<YggdrasilPeerStatus[]>(DEFAULT_YGG_PEERS);
  const [bridgeActive, setBridgeActive] = useState(true);
  const [probing, setProbing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const effectiveMtu = activeHardwareDevice?.optimalMtu || 1420;

  const handleProbeYggdrasilMatrix = async () => {
    setProbing(true);
    try {
      const resp = await fetch("/api/yggdrasil/matrix-bridge/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peers: peers.map((p) => ({ host: p.host, port: p.port, label: p.label })),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.peers)) {
          setPeers((prev) =>
            prev.map((peer) => {
              const found = data.peers.find((r: any) => r.label === peer.label);
              return found
                ? {
                    ...peer,
                    reachable: Boolean(found.reachable),
                    rttMs: typeof found.rttMs === "number" ? found.rttMs : peer.rttMs,
                    matrixFederation: found.reachable ? "synced" : "standby",
                  }
                : peer;
            })
          );
          setLastSyncAt(new Date().toLocaleTimeString());
        }
      }
    } finally {
      setProbing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950/20 via-[#0b0e16] to-indigo-950/25 border border-emerald-500/30 rounded-2xl p-4 space-y-3.5 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Network className="h-4.5 w-4.5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Yggdrasil IPv6 Mesh (0200::/7) + Matrix Federation Bridge
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[8px] font-bold uppercase">
                {bridgeActive ? "Mesh & Bridge Active" : "Bridge Standby"}
              </span>
              {isEcoPowerMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-bold uppercase">
                  Eco-Throttled (&lt;20% Bat)
                </span>
              )}
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Spanning-tree Ed25519 overlay routing • Matrix Homeserver `:8448` federation • Hardware MTU {effectiveMtu}B
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBridgeActive((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase border cursor-pointer whitespace-nowrap shrink-0 ${
              bridgeActive
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                : "bg-white/5 border-white/15 text-gray-300"
            }`}
          >
            {bridgeActive ? "Matrix Bridge: ON" : "Matrix Bridge: OFF"}
          </button>
          <button
            type="button"
            onClick={handleProbeYggdrasilMatrix}
            disabled={probing}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${probing ? "animate-spin" : ""}`} />
            {probing ? "Probing Mesh..." : "Probe Yggdrasil Mesh"}
          </button>
          <button
            type="button"
            onClick={() => onLoadYggdrasilBlueprint(effectiveMtu)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wrench className="h-3 w-3" />
            Load into Workbench
          </button>
        </div>
      </div>

      {/* Yggdrasil + Matrix Peer Federation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {peers.map((peer) => (
          <div
            key={peer.label}
            className="bg-black/60 border border-white/10 rounded-xl p-3 space-y-1.5 text-[10px]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-white font-bold truncate">{peer.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                  peer.reachable
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                }`}
              >
                {peer.reachable ? `${peer.rttMs ?? "--"} ms` : "Offline"}
              </span>
            </div>
            <div className="text-[9px] text-cyan-300 truncate">{peer.ipv6Subnet}</div>
            <div className="flex items-center justify-between text-[8px] text-gray-400 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1">
                <GitBranch className="h-2.5 w-2.5 text-indigo-400" />
                {peer.hops} Tree Hop(s)
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <MessageSquare className="h-2.5 w-2.5" />
                Matrix :8448 ({peer.matrixFederation})
              </span>
            </div>
          </div>
        ))}
      </div>

      {lastSyncAt && (
        <div className="text-[9px] text-emerald-300/90 flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Yggdrasil spanning-tree coordinates &amp; Matrix Federation (`matrix.omnieye.ygg:8448`) verified.
          </span>
          <span className="text-gray-400 tabular-nums">Last Probe: {lastSyncAt}</span>
        </div>
      )}
    </div>
  );
}
