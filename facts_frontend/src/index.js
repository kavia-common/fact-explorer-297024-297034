import React from "react";
import { createRoot } from "react-dom/client";
// Explicitly import the implemented App component (App.jsx)
// to avoid CRA template App.js taking precedence.
import App from "./App.jsx";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
