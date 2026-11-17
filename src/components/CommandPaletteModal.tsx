import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Terminal,
  Globe,
  Network,
  Crosshair,
  Copy,
  Download,
  Key,
  Plus,
  BookOpen,
  Send,
  Layers,
  X,
  ArrowRight,
} from "lucide-react";
import { TunnelProfile } from "../utils/networkTools";

export interface CommandPaletteAction {
  id: string;
  label: string;
  category: "Fleet Node" | "Navigation" | "Operations" | "Security";
  hint?: string;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: TunnelProfile[];
  onSelectProfile: (profile: TunnelProfile) => void;
  onNavigateTab: (tab: "network" | "keep" | "contacts" | "expansion") => void;
  onToggleMapView: (mode: "schematic" | "map") => void;
  onRunBatchProbe: () => void;
  onCopyActiveConfig: () => void;
  onOpenExportZip: () => void;
  onOpenAddNode: () => void;
  onGenerateWgKeys: () => void;
  onGenerateSshKeys: () => void;
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  profiles,
  onSelectProfile,
  onNavigateTab,
  onToggleMapView,
  onRunBatchProbe,
  onCopyActiveConfig,
  onOpenExportZip,
  onOpenAddNode,
  onGenerateWgKeys,
  onGenerateSshKeys,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const actions = useMemo<CommandPaletteAction[]>(() => {
    const items: CommandPaletteAction[] = [
      {
        id: "op-batch-probe",
        label: "Run Parallel Batch Probe Across All Fleet Nodes",
        category: "Operations",
        hint: "POST /api/diagnostics/probe-fleet",
        onSelect: () => {
          onRunBatchProbe();
          onClose();
        },
      },
      {
        id: "op-copy-config",
        label: "Copy Active Compiled Configuration",
        category: "Operations",
        hint: "Clipboard",
        onSelect: () => {
          onCopyActiveConfig();
          onClose();
        },
      },
      {
        id: "op-add-node",
        label: "Add New Fleet Endpoint Node",
        category: "Operations",
        hint: "Modal",
        onSelect: () => {
          onOpenAddNode();
          onClose();
        },
      },
      {
        id: "op-export-zip",
        label: "Export Encrypted Configuration & Bootstrap ZIP",
        category: "Operations",
        hint: "ZIP",
        onSelect: () => {
          onOpenExportZip();
          onClose();
        },
      },
      {
        id: "sec-wg-keys",
        label: "Generate WireGuard Curve25519 Keypair + PSK",
        category: "Security",
        hint: "node:crypto",
        onSelect: () => {
          onGenerateWgKeys();
          onClose();
        },
      },
      {
        id: "sec-ssh-keys",
        label: "Generate SSH Ed25519 Keypair & SHA256 Fingerprint",
        category: "Security",
        hint: "node:crypto",
        onSelect: () => {
          onGenerateSshKeys();
          onClose();
        },
      },
      {
        id: "nav-map",
        label: "Switch Topology View to Google Maps Geo-Node Map",
        category: "Navigation",
        hint: "Maps",
        onSelect: () => {
          onNavigateTab("network");
          onToggleMapView("map");
          onClose();
        },
      },
      {
        id: "nav-schematic",
        label: "Switch Topology View to Schematic SVG Matrix",
        category: "Navigation",
        hint: "SVG",
        onSelect: () => {
          onNavigateTab("network");
          onToggleMapView("schematic");
          onClose();
        },
      },
      {
        id: "nav-keep",
        label: "Open Keep Notes & Cloud Runbooks Vault",
        category: "Navigation",
        hint: "Tab",
        onSelect: () => {
          onNavigateTab("keep");
          onClose();
        },
      },
      {
        id: "nav-contacts",
        label: "Open Contacts, Gmail & Webhook Alerting",
        category: "Navigation",
        hint: "Tab",
        onSelect: () => {
          onNavigateTab("contacts");
          onClose();
        },
      },
      {
        id: "nav-expansion",
        label: "Open Security Sentinel & DNS Benchmarks",
        category: "Navigation",
        hint: "Tab",
        onSelect: () => {
          onNavigateTab("expansion");
          onClose();
        },
      },
      ...profiles.map((p) => ({
        id: `node-${p.id}`,
        label: `Select Node: ${p.name} (${p.endpointHost}:${p.endpointPort})`,
        category: "Fleet Node" as const,
        hint: p.lastRttMs !== null ? `${p.lastRttMs}ms` : p.locationLabel,
        onSelect: () => {
          onNavigateTab("network");
          onSelectProfile(p);
          onClose();
        },
      })),
    ];

    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.hint || "").toLowerCase().includes(q)
    );
  }, [
    profiles,
    query,
    onClose,
    onSelectProfile,
    onNavigateTab,
    onToggleMapView,
    onRunBatchProbe,
    onCopyActiveConfig,
    onOpenExportZip,
    onOpenAddNode,
    onGenerateWgKeys,
    onGenerateSshKeys,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (actions.length > 0 ? (prev + 1) % actions.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          actions.length > 0 ? (prev - 1 + actions.length) % actions.length : 0
        );
      } else if (e.key === "Enter" && actions[activeIndex]) {
        e.preventDefault();
        actions[activeIndex].onSelect();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, actions, activeIndex, onClose]);

  if (!isOpen) return null;

  const renderIcon = (cat: CommandPaletteAction["category"], id: string) => {
    if (cat === "Fleet Node") return <Network className="h-3.5 w-3.5 text-emerald-400" />;
    if (cat === "Security") return <Key className="h-3.5 w-3.5 text-amber-400" />;
    if (id.includes("map")) return <Globe className="h-3.5 w-3.5 text-blue-400" />;
    if (id.includes("probe")) return <Crosshair className="h-3.5 w-3.5 text-cyan-400" />;
    if (id.includes("copy")) return <Copy className="h-3.5 w-3.5 text-emerald-400" />;
    if (id.includes("zip")) return <Download className="h-3.5 w-3.5 text-blue-400" />;
    if (id.includes("add")) return <Plus className="h-3.5 w-3.5 text-emerald-400" />;
    if (id.includes("keep")) return <BookOpen className="h-3.5 w-3.5 text-purple-400" />;
    if (id.includes("contacts")) return <Send className="h-3.5 w-3.5 text-pink-400" />;
    if (id.includes("expansion")) return <Layers className="h-3.5 w-3.5 text-amber-400" />;
    return <Terminal className="h-3.5 w-3.5 text-gray-400" />;
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0a0a0c] border border-white/15 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-[#111114]">
          <Search className="h-4 w-4 text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Jump to fleet node, probe all targets, switch Geo Map, export bundle..."
            className="w-full bg-transparent text-xs font-mono text-white placeholder-gray-500 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 rounded border border-white/10 bg-black/40">
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {actions.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-gray-500">
              No matching command or fleet node found.
            </div>
          ) : (
            actions.map((item, idx) => {
              const selected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={item.onSelect}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition cursor-pointer ${
                    selected
                      ? "bg-blue-500/15 border border-blue-500/30 text-white"
                      : "border border-transparent text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderIcon(item.category, item.id)}
                    <div className="min-w-0">
                      <div className="text-xs font-mono truncate">{item.label}</div>
                      <div className="text-[10px] font-mono text-gray-500 uppercase">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.hint && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                        {item.hint}
                      </span>
                    )}
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/10 bg-[#0d0d10] flex items-center justify-between text-[10px] font-mono text-gray-500">
          <span>Arrows to navigate • Enter to execute</span>
          <span>Ctrl/Cmd + K</span>
        </div>
      </div>
    </div>
  );
}
