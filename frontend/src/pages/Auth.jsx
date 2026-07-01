import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import Nav from "../components/Nav";
import { toast, Toaster } from "sonner";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email, password } : { email, password, name };
      const { data } = await api.post(url, payload);
      login(null, data.user);
      toast.success("Welcome to PalmMitra");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const googleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-black text-white" data-testid="auth-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />

      <div className="max-w-md mx-auto px-6 pt-20 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
            {mode === "login" ? "Welcome back" : "Create account"}
          </p>
          <h1 className="hero-headline text-4xl sm:text-5xl">
            {mode === "login" ? "Sign in to PalmMitra" : "Begin your journey"}
          </h1>
        </div>

        <button
          onClick={googleAuth}
          data-testid="google-signin-btn"
          className="w-full bg-white text-black rounded-full py-3.5 font-medium hover:bg-white/90 transition-colors mb-6 flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40 uppercase tracking-[0.2em]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              data-testid="auth-name-input"
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            data-testid="auth-email-input"
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            data-testid="auth-password-input"
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            data-testid="auth-submit-btn"
            className="w-full bg-[#D4AF37] text-black font-medium rounded-full py-3.5 hover:bg-[#F5D061] transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/50">
          {mode === "login" ? "New to PalmMitra?" : "Already have an account?"}{" "}
          <button
            data-testid="auth-mode-toggle"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[#D4AF37] hover:text-[#F5D061]"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-white/30">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
