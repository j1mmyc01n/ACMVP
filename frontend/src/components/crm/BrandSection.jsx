import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, Trash2, ShieldCheck, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { ROLE_OPTIONS, getRole, setRole as persistRole } from "@/lib/role";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

function resolveLogo(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND}${url}`;
}

export default function AdminSettingsSection() {
  const [brand, setBrand] = useState({ company_name: "", logo_url: null });
  const [companyName, setCompanyName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [role, setRoleState] = useState(getRole());
  const fileInput = useRef(null);

  const refresh = async () => {
    const b = await api.getBrand();
    setBrand(b || {});
    setCompanyName(b?.company_name || "");
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      await api.uploadLogo(file);
      toast.success("Logo uploaded");
      await refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove uploaded logo?")) return;
    try {
      await api.deleteLogo();
      toast.success("Logo removed");
      await refresh();
    } catch {
      toast.error("Could not remove logo");
    }
  };

  const handleNameSave = async () => {
    if ((companyName || "") === (brand.company_name || "")) return;
    try {
      await api.updateBrand({ company_name: companyName || "" });
      toast.success("Company name saved");
      await refresh();
    } catch {
      toast.error("Could not save");
    }
  };

  const switchRole = (next) => {
    persistRole(next);
    setRoleState(next);
  };

  const logoSrc = resolveLogo(brand.logo_url);

  return (
    <section
      className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5"
      data-testid="admin-settings"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-[10px] bg-ink text-white flex items-center justify-center">
          <ShieldCheck size={16} strokeWidth={1.8} />
        </div>
        <div>
          <div className="label-micro">Admin · settings</div>
          <h2 className="font-display text-[22px] tracking-[-0.01em] mt-0.5">Sysadmin only</h2>
          <div className="text-[12px] text-ink-muted mt-0.5">
            Brand the workspace and switch active session role.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-[150px] h-[150px] rounded-[18px] border border-paper-rule bg-paper-rail flex items-center justify-center overflow-hidden"
            data-testid="logo-preview"
          >
            {logoSrc ? (
              <img src={logoSrc} alt="Company logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center text-ink-faint">
                <ImageIcon size={28} strokeWidth={1.4} />
                <span className="mt-1 text-[10.5px] font-medium tracking-[0.14em] uppercase">No logo</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="btn-primary !py-1.5 !px-3 text-[12px] flex items-center gap-1.5"
              data-testid="logo-upload"
            >
              <Upload size={12} strokeWidth={2} />
              {uploading ? "Uploading…" : logoSrc ? "Replace" : "Upload"}
            </button>
            {logoSrc && (
              <button
                onClick={handleRemove}
                className="icon-btn"
                aria-label="Remove logo"
                data-testid="logo-remove"
              >
                <Trash2 size={12} />
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFile}
              className="hidden"
              data-testid="logo-file-input"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="label-micro">Company name</span>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onBlur={handleNameSave}
              placeholder="e.g. Sableheart Medical Group"
              className="h-10 border border-paper-rule bg-white rounded-[10px] px-3 text-[13.5px] font-display tracking-[-0.01em] focus:outline-none focus:border-ink"
              data-testid="company-name-input"
            />
          </label>

          <div className="border-t border-paper-rule pt-4">
            <div className="label-micro mb-2 flex items-center gap-1.5">
              <Lock size={11} /> Active session role
            </div>
            <div className="flex flex-col gap-1.5">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-3 rounded-[10px] border cursor-pointer transition-colors ${
                    role === opt.value ? "border-ink bg-paper-rail" : "border-paper-rule hover:border-ink/40"
                  }`}
                  data-testid={`role-option-${opt.value}`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={role === opt.value}
                    onChange={() => switchRole(opt.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-[13px] font-medium">{opt.label}</div>
                    <div className="text-[11.5px] text-ink-muted leading-snug">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
