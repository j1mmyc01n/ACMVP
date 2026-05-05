import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone, Trash2, Send } from "lucide-react";
import { api } from "@/lib/api";

const KIND_OPTIONS = [
  { value: "info", label: "Info", c: "#1d4ed8", bg: "#eff6ff" },
  { value: "success", label: "Success", c: "#047857", bg: "#ecfdf5" },
  { value: "warning", label: "Warning", c: "#a16207", bg: "#fffbeb" },
  { value: "alert", label: "Alert", c: "#b91c1c", bg: "#fef2f2" },
];

export default function AnnouncementsAdminSection() {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("info");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");

  const refresh = async () => {
    try {
      const all = await api.listAnnouncements();
      setItems(all);
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  const post = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await api.createAnnouncement({
        body: body.trim(),
        kind,
        cta_url: ctaUrl.trim() || null,
        cta_label: ctaLabel.trim() || null,
        dismissible: true,
      });
      setBody("");
      setCtaUrl("");
      setCtaLabel("");
      toast.success("Announcement posted");
      refresh();
    } catch {
      toast.error("Could not post");
    }
  };

  const deactivate = async (id) => {
    try {
      await api.deactivateAnnouncement(id);
      refresh();
    } catch {
      toast.error("Could not deactivate");
    }
  };

  return (
    <section
      className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5"
      data-testid="announcements-admin"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-[10px] bg-[#fef3c7] text-[#a16207] flex items-center justify-center">
          <Megaphone size={16} strokeWidth={1.8} />
        </div>
        <div>
          <div className="label-micro">Broadcast</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mt-0.5">
            Announcements &amp; banners
          </h2>
          <div className="text-[12px] text-ink-muted mt-0.5">
            Post a banner across every CRM session — ship-note, weather alert, or rollout heads-up.
          </div>
        </div>
      </div>

      <form onSubmit={post} className="grid grid-cols-1 gap-3 mb-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="What do you want every staff member to see?"
          className="w-full border border-paper-rule bg-white rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-ink"
          data-testid="ann-body"
        />
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_auto] gap-2 items-end">
          <label className="flex flex-col gap-1.5">
            <span className="label-micro">Kind</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-10 border border-paper-rule bg-white rounded-[10px] px-2 text-[13px]"
              data-testid="ann-kind"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label-micro">Optional link URL</span>
            <input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://…"
              className="h-10 border border-paper-rule bg-white rounded-[10px] px-3 text-[13px]"
              data-testid="ann-url"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label-micro">Link label</span>
            <input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Learn more"
              className="h-10 border border-paper-rule bg-white rounded-[10px] px-3 text-[13px]"
              data-testid="ann-label"
            />
          </label>
          <button type="submit" className="btn-primary h-10 flex items-center gap-2" data-testid="ann-submit">
            <Send size={12} strokeWidth={2} />
            Publish
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <div className="text-[12.5px] text-ink-muted py-6 text-center border border-dashed border-paper-rule rounded-[12px]">
            No announcements yet.
          </div>
        )}
        {items.map((a) => {
          const s = KIND_OPTIONS.find((k) => k.value === a.kind) || KIND_OPTIONS[0];
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 border border-paper-rule rounded-[12px] px-3 py-2.5"
              style={{ background: a.is_active ? "#fff" : "#f5f5f2" }}
              data-testid={`ann-item-${a.id}`}
            >
              <span
                className="chip"
                style={{ background: s.bg, color: s.c }}
              >
                {s.label}
              </span>
              <div className="flex-1 min-w-0 text-[12.5px] truncate">{a.body}</div>
              <span className="text-[10.5px] font-mono text-ink-muted">
                {a.is_active ? "live" : "archived"}
              </span>
              {a.is_active && (
                <button
                  onClick={() => deactivate(a.id)}
                  className="icon-btn"
                  aria-label="Archive"
                  data-testid={`ann-archive-${a.id}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
