import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "./login.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';

function Login() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      const response = await fetch("http://localhost:4000/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Login successful!");

        console.log("Access token received:", data.access_token);

        localStorage.setItem("access_token", data.access_token);

        const decodedToken = JSON.parse(atob(data.access_token.split('.')[1]));
        const userRole = decodedToken.role;

        if (userRole === 'admin') {
          navigate("/manager/dashboard");
        } else if (userRole === 'manager') {
          navigate("/manager-home");
        } else if (userRole === 'manager') {
          navigate("/staff-home");
        } else {
          alert("Role not recognized.");
        }
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="wrapper">
      <div className="login-container login-background">
        <div className="login-form-container">
          <img src={logo} alt="Logo" className="logo-login" />
          <form className="login-form" onSubmit={handleLogin}>
            <h5 className="system-label">Inventory Management System</h5>
            <h1 className="login-title">LOGIN</h1>

            <div className="input-group">
              <FontAwesomeIcon icon={faUser} className="icon" />
              <input
                type="text"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <FontAwesomeIcon icon={faLock} className="icon" />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
              <FontAwesomeIcon
                icon={passwordVisible ? faEyeSlash : faEye}
                className="eye-icon"
                onClick={() => setPasswordVisible(!passwordVisible)}
              />
            </div>

            <button type="submit" className="login-button">LOGIN</button>

            <p className="forgot-password">
              Forgot Password? <Link to="/reset-password">Reset Here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;