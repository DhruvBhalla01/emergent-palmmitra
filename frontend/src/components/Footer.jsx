import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full border border-[#D4AF37]/60 flex items-center justify-center">
              <span className="font-serif text-[#D4AF37] text-sm">P</span>
            </div>
            <span className="font-serif text-lg">PalmMitra</span>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
            AI-powered life guidance. Grounded in modern intelligence, designed for clarity.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Product</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href="/#features" className="hover:text-[#D4AF37]">Features</a></li>
            <li><a href="/#pricing" className="hover:text-[#D4AF37]">Pricing</a></li>
            <li><a href="/#how" className="hover:text-[#D4AF37]">How it works</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Company</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href="#" className="hover:text-[#D4AF37]">About</a></li>
            <li><a href="#" className="hover:text-[#D4AF37]">Blog</a></li>
            <li><a href="#" className="hover:text-[#D4AF37]">Contact</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Legal</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href="#" className="hover:text-[#D4AF37]">Privacy</a></li>
            <li><a href="#" className="hover:text-[#D4AF37]">Terms</a></li>
            <li><a href="#" className="hover:text-[#D4AF37]">Refund Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06] py-6 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} PalmMitra. Crafted with care.
      </div>
    </footer>
  );
}
