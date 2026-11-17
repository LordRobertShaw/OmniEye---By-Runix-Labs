import React, { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Globe,
  MapPin,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Terminal,
  Zap,
} from "lucide-react";

export interface ExecutedAction {
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  groundingChunks?: Array<{ type: "web" | "maps"; title: string; uri: string; snippet?: string }>;
  actions?: ExecutedAction[];
}

export type VoiceCommandName =
  | "lockGeoIpRegion"
  | "rotateTunnelKeys"
  | "restartTunnelFailover"
  | "runHardwareScan"
  | "runSelfTuneBenchmark";

interface SovereignChatDrawerProps {
  terminalState: "full" | "medium" | "low" | "hidden";
  onChangeTerminalState: (state: "full" | "medium" | "low" | "hidden") => void;
  groundingMode: "search" | "maps";
  onToggleGroundingMode: (mode: "search" | "maps") => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  onChangeChatInput: (val: string) => void;
  isChatLoading: boolean;
  onSendChat: (e?: React.FormEvent, customText?: string) => void;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  moduleStyleClass: string;
  lockGeoIpRegion?: () => Promise<void> | void;
  rotateTunnelKeys?: () => Promise<void> | void;
  restartTunnelFailover?: () => Promise<void> | void;
  runHardwareScan?: () => Promise<any> | void;
  runSelfTuneBenchmark?: () => Promise<void> | void;
}

export default function SovereignChatDrawer({
  terminalState,
  onChangeTerminalState,
  groundingMode,
  onToggleGroundingMode,
  chatMessages,
  chatInput,
  onChangeChatInput,
  isChatLoading,
  onSendChat,
  chatScrollRef,
  moduleStyleClass,
  lockGeoIpRegion,
  rotateTunnelKeys,
  restartTunnelFailover,
  runHardwareScan,
  runSelfTuneBenchmark,
}: SovereignChatDrawerProps) {
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  const dispatchVoiceIntent = async (transcriptRaw: string) => {
    const normalized = transcriptRaw.toLowerCase().trim();
    if (!normalized) return;

    let triggered: VoiceCommandName | null = null;
    let label = "";

    if (
      normalized.includes("geo") ||
      normalized.includes("region") ||
      normalized.includes("lock ip") ||
      normalized.includes("firewall")
    ) {
      triggered = "lockGeoIpRegion";
      label = "lockGeoIpRegion()";
      await lockGeoIpRegion?.();
    } else if (
      normalized.includes("rotate") ||
      normalized.includes("key") ||
      normalized.includes("x25519")
    ) {
      triggered = "rotateTunnelKeys";
      label = "rotateTunnelKeys()";
      await rotateTunnelKeys?.();
    } else if (
      normalized.includes("restart") ||
      normalized.includes("failover") ||
      normalized.includes("cutover") ||
      normalized.includes("reboot tunnel")
    ) {
      triggered = "restartTunnelFailover";
      label = "restartTunnelFailover()";
      await restartTunnelFailover?.();
    } else if (
      normalized.includes("hardware") ||
      normalized.includes("scan") ||
      normalized.includes("discover")
    ) {
      triggered = "runHardwareScan";
      label = "runHardwareScan()";
      await runHardwareScan?.();
    } else if (
      normalized.includes("benchmark") ||
      normalized.includes("self tune") ||
      normalized.includes("self-tune") ||
      normalized.includes("mtu") ||
      normalized.includes("speed test")
    ) {
      triggered = "runSelfTuneBenchmark";
      label = "runSelfTuneBenchmark()";
      await runSelfTuneBenchmark?.();
    }

    if (triggered) {
      setVoiceStatus(`Voice Triggered: ${label} from "${transcriptRaw}"`);
    } else {
      setVoiceStatus(`Heard "${transcriptRaw}" — routing to AI Agent.`);
      onChangeChatInput(transcriptRaw);
      onSendChat(undefined, transcriptRaw);
    }
  };

  const handleToggleVoiceCommand = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const SpeechRec =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setVoiceStatus(
        "Web Speech API unavailable in this browser. Use the quick voice command chips below or Chrome/Android."
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("");
        setVoiceStatus(
          "Listening... Say 'Run Hardware Scan', 'Run Self-Tune Benchmark', 'Restart Tunnel', 'Rotate Keys', or 'Lock Geo-IP Region'."
        );
      };

      recognition.onresult = (event: any) => {
        let combined = "";
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          combined += event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) isFinal = true;
        }
        setVoiceTranscript(combined);
        if (isFinal && combined.trim()) {
          void dispatchVoiceIntent(combined);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceStatus(
          event?.error === "not-allowed"
            ? "Microphone permission denied. Allow mic access or tap a Voice Command trigger."
            : `Voice recognition notice: ${event?.error || "no speech detected"}`
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setVoiceStatus(err?.message || "Unable to start Web Speech API.");
    }
  };

  return (
    <div
      className={`bg-[#0c0c0c] border border-white/5 rounded-xl p-5 flex flex-col gap-3 ${
        terminalState === "hidden" ? "h-auto" : "h-[410px]"
      } ${moduleStyleClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-500" />
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono">
            OmniEye Terminal
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Web Speech API Voice Command Trigger Button */}
          <button
            type="button"
            onClick={handleToggleVoiceCommand}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase flex items-center gap-1.5 border transition cursor-pointer whitespace-nowrap shrink-0 ${
              isListening
                ? "bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-200"
            }`}
            title="Web Speech API Voice Command ('Run Hardware Scan', 'Restart tunnel', 'Lock Geo-IP', 'Rotate Keys', 'Run Self-Tune Benchmark')"
          >
            {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3 text-cyan-300" />}
            {isListening ? "Listening..." : "Voice Command"}
          </button>

          {/* Grounding Mode Switcher */}
          <div className="flex bg-black/50 border border-white/10 rounded p-0.5 text-[9px] font-mono">
            <button
              type="button"
              onClick={() => onToggleGroundingMode("search")}
              className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer ${
                groundingMode === "search" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Search+Tools
            </button>
            <button
              type="button"
              onClick={() => onToggleGroundingMode("maps")}
              className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer flex items-center gap-1 ${
                groundingMode === "maps" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <MapPin className="h-2.5 w-2.5" /> Maps
            </button>
          </div>

          {/* Dropdown for Brightness & Visibility */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-gray-400">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">HUD:</span>
            <select
              value={terminalState}
              onChange={(e) => onChangeTerminalState(e.target.value as any)}
              className="bg-transparent border-none text-gray-300 focus:outline-none cursor-pointer pr-1 font-bold"
            >
              <option value="full" className="bg-[#0f0f0f] text-white">Full (100%)</option>
              <option value="medium" className="bg-[#0f0f0f] text-white">Dim (60%)</option>
              <option value="low" className="bg-[#0f0f0f] text-white">Low (25%)</option>
              <option value="hidden" className="bg-[#0f0f0f] text-rose-400">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {voiceStatus && terminalState !== "hidden" && (
        <div className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/35 text-[9px] font-mono text-cyan-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap className="h-3 w-3 text-cyan-300 shrink-0" />
            <span className="truncate">
              {voiceTranscript ? `Transcript: "${voiceTranscript}" — ` : ""}
              {voiceStatus}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceStatus(null)}
            className="text-cyan-400 hover:text-white text-[9px] uppercase font-bold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {terminalState !== "hidden" ? (
        <>
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 font-mono text-xs"
          >
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col p-3 rounded-lg border max-w-[92%] ${
                  msg.role === "assistant"
                    ? "self-start bg-[#050505] border-white/5 text-gray-300"
                    : "self-end bg-blue-600/5 border-blue-500/20 text-blue-100"
                }`}
              >
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider mb-1.5 ${
                    msg.role === "assistant" ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  {msg.role === "assistant" ? "🤖 Optimizer Agent" : "👤 User"}
                </span>
                <div className="whitespace-pre-wrap leading-relaxed break-words text-[11px]">{msg.content}</div>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      >
                        ⚡ Executed {act.name}
                      </span>
                    ))}
                  </div>
                )}

                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider block">
                      Verified Sources &amp; Grounded Places
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingChunks.map((chunk, cIdx) => (
                        <a
                          key={cIdx}
                          href={chunk.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[9px] transition ${
                            chunk.type === "maps"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                              : "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                          }`}
                        >
                          {chunk.type === "maps" ? <MapPin className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                          <span className="truncate max-w-[160px]">{chunk.title}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ))}
                    </div>
                    {msg.groundingChunks.some((c) => c.snippet) && (
                      <div className="space-y-1">
                        {msg.groundingChunks
                          .filter((c) => c.snippet)
                          .map((c, sIdx) => (
                            <div key={sIdx} className="text-[9px] text-gray-400 italic bg-black/50 p-1.5 rounded border border-white/5">
                              “{c.snippet}”
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="self-start bg-[#050505] border border-white/5 p-3 rounded-lg max-w-[90%] text-gray-400 flex items-center gap-2 font-mono text-[11px]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                <span>Synthesizing system diagnostics...</span>
              </div>
            )}
          </div>

          {/* Quick Voice/Action Prompts */}
          <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => void dispatchVoiceIntent("run hardware scan")}
              className="text-[9px] font-mono bg-[#050505] hover:bg-white/5 border border-cyan-500/20 rounded px-2 py-1 text-cyan-300 hover:text-white transition cursor-pointer uppercase"
            >
              🎙 Run Hardware Scan
            </button>
            <button
              type="button"
              onClick={() => void dispatchVoiceIntent("restart tunnel failover")}
              className="text-[9px] font-mono bg-[#050505] hover:bg-white/5 border border-amber-500/20 rounded px-2 py-1 text-amber-300 hover:text-white transition cursor-pointer uppercase"
            >
              🎙 Restart Tunnel
            </button>
            <button
              type="button"
              onClick={() => void dispatchVoiceIntent("lock geo ip region")}
              className="text-[9px] font-mono bg-[#050505] hover:bg-white/5 border border-emerald-500/20 rounded px-2 py-1 text-emerald-300 hover:text-white transition cursor-pointer uppercase"
            >
              🎙 Lock Geo-IP
            </button>
            <button
              type="button"
              onClick={() => void dispatchVoiceIntent("rotate tunnel keys")}
              className="text-[9px] font-mono bg-[#050505] hover:bg-white/5 border border-purple-500/20 rounded px-2 py-1 text-purple-300 hover:text-white transition cursor-pointer uppercase"
            >
              🎙 Rotate Keys
            </button>
            <button
              type="button"
              onClick={() => void dispatchVoiceIntent("run self tune benchmark")}
              className="text-[9px] font-mono bg-[#050505] hover:bg-white/5 border border-blue-500/20 rounded px-2 py-1 text-blue-300 hover:text-white transition cursor-pointer uppercase"
            >
              🎙 Self-Tune Test
            </button>
          </div>

          <form onSubmit={onSendChat} className="flex gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => onChangeChatInput(e.target.value)}
              placeholder="Ask agent or click Voice Command..."
              className="flex-1 bg-[#050505] border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="px-3 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-gray-500 text-white transition duration-200 flex items-center justify-center cursor-pointer border border-blue-500/20"
            >
              <Send className="h-3 w-3 fill-current" />
            </button>
          </form>
        </>
      ) : (
        <div className="py-6 text-center text-xs font-mono text-gray-500 uppercase tracking-widest border border-dashed border-white/5 rounded-lg bg-[#050505] flex flex-col items-center justify-center gap-1.5">
          <span>[HUD MODULE DEACTIVATED]</span>
          <span className="text-[10px] text-gray-600">Select Full or Dim in dropdown to restore visibility.</span>
        </div>
      )}
    </div>
  );
}
