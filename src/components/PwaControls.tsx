import React, { useEffect, useState } from "react";
import { Check, Copy, Download, HardDrive, Smartphone, WifiOff, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
    return outcome === "accepted";
  };

  return { canInstall: Boolean(installPrompt) && !isInstalled, isInstalled, promptInstall };
}

export const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) return null;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleInstallClick = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) return;
    }
    setShowModal(true);
  };

  const handleCopyUrl = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
        title="Install OmniEye as a Native Android WebAPK or Home Screen App"
      >
        <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Install Android App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md rounded-3xl bg-[#0d111a] border border-cyan-500/35 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Install Native Android WebAPK / PWA
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Full-screen standalone launcher with offline survival cache
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-[11px] text-gray-300">
              <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-1">
                <div className="text-emerald-300 font-bold uppercase text-[10px]">
                  Android (Chrome / Brave / Edge WebAPK)
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  1. Open this app URL directly in Chrome on Android.<br />
                  2. Tap the <strong>⋮ (Three-Dot Menu)</strong> → <strong>Install app</strong> (or{" "}
                  <strong>Add to Home screen</strong>).<br />
                  3. Long-press the home screen icon to quick-launch <strong>10s Self-Tune</strong> or{" "}
                  <strong>Workbench</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-1">
                <div className="text-cyan-300 font-bold uppercase text-[10px]">
                  iOS / iPadOS (Safari Standalone)
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  1. Tap the <strong>Share</strong> icon in the Safari bottom bar.<br />
                  2. Select <strong>Add to Home Screen</strong> to launch in full-screen mode.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-black border border-white/15 rounded-xl px-3 py-2 text-[10px] text-gray-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedUrl ? "Copied" : "Copy URL"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-2xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-400/50 text-emerald-200 text-xs font-bold uppercase cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface OfflineIndicatorProps {
  snapshotTimestamp?: string | null;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ snapshotTimestamp }) => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-950/95 border border-amber-500/40 text-amber-200 shadow-2xl font-mono text-[11px] backdrop-blur-md">
      <WifiOff className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
      <div>
        <div className="font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          Offline Emergency Survival Mode
        </div>
        <div className="text-[10px] text-amber-200/80 flex items-center gap-1 mt-0.5">
          <HardDrive className="h-3 w-3" />
          Cached scripts &amp; configs active
          {snapshotTimestamp ? ` (Saved ${new Date(snapshotTimestamp).toLocaleTimeString()})` : ""}
        </div>
      </div>
    </div>
  );
};
