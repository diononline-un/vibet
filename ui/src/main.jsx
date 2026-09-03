import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Overview from "./pages/Overview.jsx";
import Project from "./pages/Project.jsx";
import "./theme.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/p/:id" element={<Project />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);
