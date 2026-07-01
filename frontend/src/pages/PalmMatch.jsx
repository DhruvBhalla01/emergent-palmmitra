import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { useAuth } from "../lib/AuthContext";
import { track } from "../lib/analytics";
import { Upload as UploadIcon, Camera, X, Check, Heart } from "lucide-react";
import { toast, Toaster } from "sonner";

const COPPER = "#D97757";

function PalmSlot({ label, image, onChange, testId }) {
  const handleFile = (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) { toast.error("Please upload JPEG, PNG or WEBP"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="relative rounded-2xl p-6 sm:p-8 grid-exposure" style={{ background: "#0A0A0A" }}>
      <p className="overline mb-4">{label}</p>
      {image ? (
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10">
          <img src={image} alt={label} className="w-full h-full object-cover" />
          <button onClick={() => onChange(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center hover:bg-black" data-testid={`${testId}-remove`}>
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs bg-black/80 rounded-full px-3 py-1.5" style={{ border: `1px solid rgba(217,119,87,0.4)` }}>
            <Check className="w-3 h-3" style={{ color: COPPER }} /><span>Uploaded</span>
          </div>
        </div>
      ) : (
        <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 hover:border-[#D97757]/50 flex flex-col items-center justify-center cursor-pointer transition-colors" data-testid={`${testId}-dropzone`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} data-testid={`${testId}-input`} />
          <UploadIcon className="w-8 h-8 text-white/30 mb-3" strokeWidth={1.3} />
          <p className="text-sm text-white/60">Tap to upload</p>
          <div className="mt-6 flex items-center gap-2 text-xs" style={{ color: COPPER }}>
            <Camera className="w-3.5 h-3.5" /><span>JPEG · PNG · WEBP</span>
          </div>
        </label>
      )}
    </div>
  );
}

const RELATIONSHIPS = [
  { k: "couple", l: "Couple" },
  { k: "friends", l: "Friends" },
  { k: "family", l: "Family" },
  { k: "business", l: "Business" },
];

export default function PalmMatch() {
  const [palmA, setPalmA] = useState(null);
  const [palmB, setPalmB] = useState(null);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [relationship, setRelationship] = useState("couple");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => { track("palmmatch_view"); }, []);

  const submit = () => {
    if (!palmA || !palmB) { toast.error("Please upload both palms"); return; }
    if (!user) { navigate("/auth"); return; }
    setSubmitting(true);
    navigate("/palmmatch/analyzing", { state: { palmA, palmB, nameA, nameB, relationship }, replace: true });
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#050505" }} data-testid="palmmatch-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-24">
        <div className="text-center mb-14">
          <span className="font-serif text-xl" style={{ color: "#E4B248" }}>ॐ Yugal Rekha</span>
          <h1 className="hero-headline text-4xl sm:text-5xl mt-3">Discover your compatibility.</h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Upload two palms. Our AI reveals your emotional bond, communication, romance, and destiny alignment — grounded in ancient Hast Rekha Shastra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <PalmSlot label="Partner A" image={palmA} onChange={setPalmA} testId="palm-a" />
          <PalmSlot label="Partner B" image={palmB} onChange={setPalmB} testId="palm-b" />
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center z-10" style={{ background: COPPER }}>
            <Heart className="w-5 h-5 text-black fill-black" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder="Partner A name (optional)" data-testid="palmmatch-name-a" className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D97757] focus:outline-none" />
          <input value={nameB} onChange={(e) => setNameB(e.target.value)} placeholder="Partner B name (optional)" data-testid="palmmatch-name-b" className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D97757] focus:outline-none" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 justify-center">
          {RELATIONSHIPS.map((r) => (
            <button
              key={r.k}
              onClick={() => setRelationship(r.k)}
              data-testid={`relationship-${r.k}`}
              className="px-5 py-2 rounded-full text-sm border transition-colors"
              style={relationship === r.k ? { background: COPPER, color: "#000", borderColor: COPPER } : { borderColor: "rgba(255,255,255,0.15)", color: "#A1A1AA" }}
            >
              {r.l}
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={submit}
            disabled={submitting || !palmA || !palmB}
            data-testid="palmmatch-analyze-btn"
            className="rounded-full px-10 py-4 font-medium text-black transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}
          >
            {submitting ? "Starting…" : "Reveal Our Compatibility"}
          </button>
          <p className="text-xs text-white/40">Free preview · Results in ~2 min · Private</p>
        </div>
      </div>
    </div>
  );
}
