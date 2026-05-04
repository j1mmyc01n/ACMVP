import { Wifi, WifiOff } from "lucide-react";

export default function LiveIndicator({ connected }) {
  return (
    <div
      data-testid="live-indicator"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.18em] font-bold transition-colors ${
        connected
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            connected ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      </span>
      {connected ? (
        <span className="inline-flex items-center gap-1">
          <Wifi className="h-3 w-3" /> Realtime
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <WifiOff className="h-3 w-3" /> Reconnecting
        </span>
      )}
    </div>
  );
}
