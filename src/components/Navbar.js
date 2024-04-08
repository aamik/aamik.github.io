import React from "react";
import { NavLink } from "react-router-dom";
import { Navbar as BootstrapNavbar, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faInfoCircle,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

function Navbar({ toggle, isOpen }) {
  return (
    <div className="navbar-container">
      {/* Bootstrap Navbar component */}
      <BootstrapNavbar expand="lg" className="navbar-toggle-container">
        <BootstrapNavbar.Toggle
          aria-controls="responsive-navbar-nav"
          onClick={toggle}
          className="custom-toggler"
        />
        <h2>Aapo Mikkola</h2>
      </BootstrapNavbar>
      {/* Custom navbar, with class depending on navbar open/close state */}
      <div className={`navbar-custom ${isOpen ? "open" : ""}`}>
        <Nav className="flex-column text-left">
          <NavLink exact to="/" onClick={toggle} activeClassName="active">
            <FontAwesomeIcon icon={faHome} />
            <span className="nav-text">Home</span>
          </NavLink>
          <NavLink to="/about" onClick={toggle} activeClassName="active">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span className="nav-text">About</span>
          </NavLink>
          <NavLink to="/contact" onClick={toggle} activeClassName="active">
            <FontAwesomeIcon icon={faEnvelope} />
            <span className="nav-text">Contact</span>
          </NavLink>
        </Nav>
        <div className="copyright">
          &copy; {new Date().getFullYear()} Aapo Mikkola
        </div>
      </div>
    </div>
  );
}

export default Navbar;
