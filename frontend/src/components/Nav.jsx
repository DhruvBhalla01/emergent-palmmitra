import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/[0.06]"
      data-testid="site-nav"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="w-7 h-7 rounded-full border border-[#D4AF37]/60 flex items-center justify-center">
            <span className="font-serif text-[#D4AF37] text-sm leading-none">P</span>
          </div>
          <span className="font-serif text-lg tracking-tight">PalmMitra</span>
        </Link>

        <div className="hidden md:flex items-center gap-9 text-sm text-white/70">
          <a href="/#how" className="hover:text-white transition-colors">How it works</a>
          <a href="/#features" className="hover:text-white transition-colors">Features</a>
          <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden sm:block text-sm text-white/80 hover:text-white transition-colors"
                data-testid="nav-dashboard-btn"
              >
                Dashboard
              </button>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="text-sm text-white/60 hover:text-white transition-colors"
                data-testid="nav-logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm text-white/70 hover:text-white transition-colors"
                data-testid="nav-signin-btn"
              >
                Sign in
              </Link>
              <Link
                to="/upload"
                className="bg-[#D4AF37] text-black text-sm font-medium rounded-full px-5 py-2 hover:bg-[#F5D061] transition-colors"
                data-testid="nav-cta-btn"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
