// Import libraries and components
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";

// Import styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/main.scss";

function App() {
  // State to manage navbar open/close
  const [isOpen, setIsOpen] = useState(false);
  // Function to toggle navbar open/close state
  const toggle = () => setIsOpen(!isOpen);

  return (
    // Router component for managing routes
    <Router>
      <div className={`App d-flex ${isOpen ? "navbar-open" : ""}`}>
        {/* Navbar component, with props for managing open/close state */}
        <Navbar toggle={toggle} isOpen={isOpen} />
        {/* Main content area, with class depending on navbar state */}
        <div
          className={`main-content background-svg ${
            isOpen ? "" : "full-width"
          } flex-grow-1 p-4 overflow-auto`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" />} />{" "}
            {/* Catch-all route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
