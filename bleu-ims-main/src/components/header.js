import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaBell } from "react-icons/fa";
import { jwtDecode } from 'jwt-decode';
import "./header.css";

const Header = ({ pageTitle }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState("Admin");
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = useCallback(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      navigate('/');
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const usernameFromUrl = params.get('username');
    const tokenFromUrl = params.get('authorization');

    if (usernameFromUrl && tokenFromUrl) {
      localStorage.setItem('username', usernameFromUrl);
      localStorage.setItem('authToken', tokenFromUrl);
   
      if (window.history.replaceState) {
        const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    }

    const storedUsername = localStorage.getItem('username');
    const storedToken = localStorage.getItem('authToken');

    if (storedUsername && storedToken) {
      setUserName(storedUsername);
      try {
        const decodedToken = jwtDecode(storedToken);
        setUserRole(decodedToken.role || "Admin");
      } catch (error) {
        console.error("Error decoding token:", error);
        handleLogout();
      }
    } else {
      console.log("No session found. Redirecting to login.");
      navigate('/');
    }
  }, [navigate, handleLogout]); 

  useEffect(() => {
    const timerId = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="page-title">{pageTitle}</h2>
      </div>

      <div className="header-right">
        <div className="header-date">
          {currentDate.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          })}
        </div>
        <div className="header-profile">
          <div className="profile-pic" />
          <div className="profile-info">
            <div className="profile-role">Hi! I'm {userRole}</div>
            <div className="profile-name">{userName}</div>
          </div>
          <div className="dropdown-icon" onClick={toggleDropdown}>
            <FaChevronDown />
          </div>
          <div className="bell-icon">
            <FaBell className="bell-outline" />
          </div>
          {isDropdownOpen && (
            <div className="profile-dropdown">
              <ul>
                <li>Edit Profile</li>
                <li>Logout</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
