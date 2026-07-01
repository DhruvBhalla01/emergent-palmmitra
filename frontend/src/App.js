import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "@/App.css";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Upload from "./pages/Upload";
import Analyzing from "./pages/Analyzing";
import Report from "./pages/Report";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./lib/AuthContext";

function AppRouter() {
  const location = useLocation();
  // Synchronous check for Emergent OAuth session_id in URL fragment
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/analyzing" element={<Analyzing />} />
      <Route path="/report/:id" element={<Report />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
