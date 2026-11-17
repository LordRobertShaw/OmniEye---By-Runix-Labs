import { useEffect, useRef, useState } from "react";

export interface FleetStreamEvent {
  type: string;
  timestamp?: string;
  payload?: any;
}

interface UseFleetTelemetryStreamOptions {
  enabled: boolean;
  getToken: () => Promise<string | null>;
  onEvent: (event: FleetStreamEvent) => void;
}

export function useFleetTelemetryStream({
  enabled,
  getToken,
  onEvent,
}: UseFleetTelemetryStreamOptions) {
  const [sseConnected, setSseConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const onEventRef = useRef(onEvent);
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!enabled) {
      setSseConnected(false);
      return;
    }

    let cancelled = false;
    let activeController: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;

    const connect = async () => {
      if (cancelled) return;
      try {
        const token = await getTokenRef.current();
        if (!token || cancelled) {
          setSseConnected(false);
          return;
        }

        activeController = new AbortController();
        const resp = await fetch("/api/fleet/stream", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: activeController.signal,
        });

        if (!resp.ok || !resp.body) {
          throw new Error(`SSE HTTP ${resp.status}`);
        }

        retryAttempt = 0;
        setSseConnected(true);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";

          for (const frame of frames) {
            const dataLine = frame
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const parsed: FleetStreamEvent = JSON.parse(dataLine.slice(6));
              if (parsed.timestamp) setLastEventAt(parsed.timestamp);
              onEventRef.current(parsed);
            } catch {
              // ignore keepalive comments or malformed chunks
            }
          }
        }
      } catch (err: any) {
        if (cancelled || err?.name === "AbortError") return;
      } finally {
        if (!cancelled) {
          setSseConnected(false);
          const delayMs = Math.min(30_000, 1500 * Math.pow(2, retryAttempt));
          retryAttempt = Math.min(retryAttempt + 1, 5);
          retryTimer = setTimeout(connect, delayMs);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      setSseConnected(false);
      if (retryTimer) clearTimeout(retryTimer);
      if (activeController) activeController.abort();
    };
  }, [enabled]);

  return { sseConnected, lastEventAt };
}
