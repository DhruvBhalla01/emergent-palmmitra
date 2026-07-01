import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { useAuth } from "../lib/AuthContext";
import { api } from "../lib/api";
import { Upload as UploadIcon, Camera, X, Check } from "lucide-react";
import { toast, Toaster } from "sonner";

function PalmSlot({ label, image, onChange, testId }) {
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      toast.error("Please upload JPEG, PNG or WEBP");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-6 sm:p-8 hover:border-[#D4AF37]/40 transition-colors">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-4">{label}</p>

      {image ? (
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10">
          <img src={image} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center hover:bg-black"
            data-testid={`${testId}-remove`}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs bg-black/80 border border-[#D4AF37]/40 rounded-full px-3 py-1.5">
            <Check className="w-3 h-3 text-[#D4AF37]" />
            <span>Uploaded</span>
          </div>
        </div>
      ) : (
        <label
          className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 hover:border-[#D4AF37]/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
          data-testid={`${testId}-dropzone`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
            data-testid={`${testId}-input`}
          />
          <UploadIcon className="w-8 h-8 text-white/30 mb-3" strokeWidth={1.3} />
          <p className="text-sm text-white/60">Tap to upload</p>
          <p className="text-xs text-white/30 mt-1">or use camera</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-[#D4AF37]">
            <Camera className="w-3.5 h-3.5" />
            <span>JPEG · PNG · WEBP</span>
          </div>
        </label>
      )}
    </div>
  );
}

export default function Upload() {
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!left && !right) {
      toast.error("Please upload at least one palm");
      return;
    }
    if (!user) {
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    // Navigate to analyzing screen immediately for great UX
    navigate("/analyzing", {
      state: { left, right, name, dob },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white" data-testid="upload-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />

      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-24">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">Step 1 of 2</p>
          <h1 className="hero-headline text-4xl sm:text-5xl">Upload your palm.</h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            One or both palms work — clearer images give richer insights. We recommend natural light and a flat, open hand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PalmSlot label="Left Palm" image={left} onChange={setLeft} testId="left-palm" />
          <PalmSlot label="Right Palm" image={right} onChange={setRight} testId="right-palm" />
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional, for personalization)"
            data-testid="upload-name-input"
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
          />
          <input
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            placeholder="Date of birth (optional)"
            data-testid="upload-dob-input"
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
          />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={submit}
            disabled={submitting || (!left && !right)}
            data-testid="upload-analyze-btn"
            className="bg-[#D4AF37] text-black font-medium rounded-full px-10 py-4 hover:bg-[#F5D061] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Starting analysis..." : "Begin AI Analysis"}
          </button>
          <p className="text-xs text-white/40">Takes 20-40 seconds · Private & secure</p>
        </div>

        {/* Guidelines */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "Natural light", d: "Avoid harsh shadows or backlighting." },
            { t: "Flat palm", d: "Open your hand fully, fingers relaxed." },
            { t: "Fill the frame", d: "Palm should occupy 70% of the image." },
          ].map((g) => (
            <div key={g.t} className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A]">
              <p className="text-sm font-medium text-[#D4AF37]">{g.t}</p>
              <p className="text-sm text-white/60 mt-2">{g.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
