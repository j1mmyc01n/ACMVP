import { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebSocket hook for Crisis Kanban realtime events.
 * Receives: snapshot | patient.created | patient.updated | patient.moved | patient.deleted | patients.seeded
 */
export function useKanbanWebSocket(backendUrl, onEvent) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!backendUrl) return;
    const wsUrl = backendUrl.replace(/^http/, "ws") + "/api/ws";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handlerRef.current?.(data);
      } catch (err) {
        /* ignore parse errors */
      }
    };
    ws.onclose = () => {
      setConnected(false);
      // exponential backoff retry up to 10s
      const delay = Math.min(10000, 500 * 2 ** retryRef.current);
      retryRef.current += 1;
      setTimeout(connect, delay);
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch (_) {}
    };
  }, [backendUrl]);

  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  return { connected };
}
