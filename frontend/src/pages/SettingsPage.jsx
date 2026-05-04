import { KeyRound, Link as LinkIcon, Bell, User } from "lucide-react";

function SettingRow({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-paper-rule/70 last:border-b-0">
      <div className="w-10 h-10 rounded-[10px] bg-paper-rail flex items-center justify-center text-ink-muted">
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13.5px] text-ink">{title}</div>
        <div className="text-[12px] text-ink-muted mt-0.5">{desc}</div>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-8 pb-14 max-w-[900px]" data-testid="settings-page">
      <div className="mb-6">
        <div className="label-micro mb-2">Settings</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em]">
          Workspace settings
        </h1>
      </div>

      <div className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5">
        <div className="label-micro mb-2">Integrations</div>
        <SettingRow
          icon={KeyRound}
          title="Twilio"
          desc="Calling via the Call Queue. Currently mocked — add SID / token / from-number to go live."
          action={<button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-twilio">Connect</button>}
        />
        <SettingRow
          icon={LinkIcon}
          title="Google Calendar"
          desc="Push scheduled calls to each location's Google calendar."
          action={<button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-google">Connect</button>}
        />
        <SettingRow
          icon={LinkIcon}
          title="Outlook Calendar"
          desc="Same scheduling, Microsoft side."
          action={<button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-outlook">Connect</button>}
        />
        <SettingRow
          icon={LinkIcon}
          title="Calendly"
          desc="Let patients self-book directly from an outreach link."
          action={<button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="conn-calendly">Connect</button>}
        />
      </div>

      <div className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5">
        <div className="label-micro mb-2">AI</div>
        <SettingRow
          icon={KeyRound}
          title="Claude Sonnet 4.5"
          desc="Active · Emergent Universal Key"
          action={<span className="chip" style={{ background: "#ecfdf5", color: "#10b981" }}>Connected</span>}
        />
      </div>

      <div className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow">
        <div className="label-micro mb-2">Workspace</div>
        <SettingRow
          icon={User}
          title="Activated via parent platform"
          desc="No in-app login. Session is passed in from the host product."
          action={<span className="chip" style={{ background: "#fffbeb", color: "#f59e0b" }}>Inherited</span>}
        />
        <SettingRow
          icon={Bell}
          title="Notifications"
          desc="Get alerted when a patient enters High risk or Critical."
          action={<button className="btn-ghost text-[12px] !py-1.5 !px-3" data-testid="notif-config">Configure</button>}
        />
      </div>
    </div>
  );
}
