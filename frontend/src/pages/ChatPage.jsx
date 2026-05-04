import { useEffect, useRef, useState } from "react";
import { useShell } from "@/components/crm/AppShell";
import { api } from "@/lib/api";
import { Send, MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { activeLocation, locations, refreshKey } = useShell();
  const [messages, setMessages] = useState([]);
  const [author, setAuthor] = useState(localStorage.getItem("crm_chat_author") || "");
  const [body, setBody] = useState("");
  const endRef = useRef(null);
  const targetLoc = activeLocation === "all" ? locations[0]?.id : activeLocation;
  const targetName = locations.find((l) => l.id === targetLoc)?.name || "—";

  const load = async () => {
    if (!targetLoc) return;
    const m = await api.listChat(targetLoc);
    setMessages(m);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [targetLoc, refreshKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !targetLoc) return;
    const a = author.trim() || "Anonymous";
    localStorage.setItem("crm_chat_author", a);
    const m = await api.postChat(targetLoc, a, body.trim());
    setMessages((arr) => [...arr, m]);
    setBody("");
  };

  return (
    <div className="p-6 lg:p-8 pb-14 max-w-[920px]" data-testid="chat-page">
      <div className="mb-6">
        <div className="label-micro mb-2 flex items-center gap-1.5">
          <MessageSquare size={10} /> Team chat
        </div>
        <h1 className="font-display text-[34px] md:text-[42px] leading-[1.02] tracking-[-0.02em]">
          {targetName}
        </h1>
        <div className="mt-2 text-[13px] text-ink-muted">
          A live channel for every care centre in this location. Pick a
          location from the top bar to switch room.
        </div>
      </div>

      <div className="bg-white border border-paper-rule rounded-[16px] card-shadow flex flex-col h-[calc(100vh-260px)] min-h-[420px]">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-2">
          {messages.length === 0 && (
            <div className="m-auto text-[12.5px] text-ink-muted">No messages yet — start the thread.</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3 items-start" data-testid={`chat-msg-${m.id}`}>
              <div className="w-8 h-8 rounded-full bg-paper-rail flex items-center justify-center font-mono text-[10px] text-ink-muted shrink-0">
                {(m.author || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-[12.5px]">{m.author}</span>
                  <span className="font-mono text-[10px] text-ink-faint ticker">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-[13px] leading-relaxed mt-0.5">{m.body}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={send}
          className="border-t border-paper-rule p-3 flex items-center gap-2"
          data-testid="chat-form"
        >
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="h-10 w-[160px] border border-paper-rule bg-paper-rail rounded-[10px] px-3 text-[12.5px]"
            data-testid="chat-author"
          />
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Message #${targetName}…`}
            className="flex-1 h-10 border border-paper-rule bg-paper rounded-[10px] px-3 text-[13px]"
            data-testid="chat-body"
          />
          <button type="submit" className="btn-primary flex items-center gap-2" data-testid="chat-send">
            <Send size={12} strokeWidth={1.8} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
