import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, Trash2, Building2 } from "lucide-react";
import { api } from "@/lib/api";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

function resolveLogo(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND}${url}`;
}

export default function BrandSection() {
  const [brand, setBrand] = useState({ company_name: "", logo_url: null });
  const [companyName, setCompanyName] = useState("");
  const [uploading, setUploading] = useState(false);
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

  const logoSrc = resolveLogo(brand.logo_url);

  return (
    <section
      className="bg-white border border-paper-rule rounded-[16px] p-6 card-shadow mb-5"
      data-testid="brand-card"
    >
      <div className="label-micro mb-3 flex items-center gap-1.5">
        <Building2 size={11} /> Brand &amp; logo
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

        <div className="flex flex-col gap-3">
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
            <span className="text-[11.5px] text-ink-muted">
              Shown above the location name in the sidebar. Save on blur.
            </span>
          </label>
          <div className="text-[12px] text-ink-muted leading-snug border-l-2 border-paper-rule pl-3">
            <div>Recommended: square PNG / SVG, transparent background.</div>
            <div>Max 5 MB. PNG, JPG, WebP, SVG accepted.</div>
            <div>The logo replaces the default mark in the top-left corner of the app.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
