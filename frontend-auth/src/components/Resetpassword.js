import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from './assets/logo.jpg';
import homeImage from './assets/coffee.jpg';
import { Eye, EyeOff } from 'lucide-react';
import './authentication/forgotpassword.css';

const Resetpassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Extract token and email from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, []);

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 12 || pwd.length > 64) {
      errors.push('Password must be 12-64 characters long.');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must include at least one uppercase letter.');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must include at least one lowercase letter.');
    }
    if (!/\d/.test(pwd)) {
      errors.push('Password must include at least one digit.');
    }
    if (!/[\W_]/.test(pwd)) {
      errors.push('Password must include at least one special character.');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      setPasswordError(passwordValidationErrors.join(' '));
      valid = false;
    } else {
      setPasswordError('');
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match!');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (!valid) {
      return;
    }

    if (!token) {
      toast.error('Reset token is missing.');
      return;
    }

    if (!email) {
      toast.error('Email is missing.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          new_password: password,
          token,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      toast.success('Password successfully reset!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="login-box">
        <div className="login-form">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo" className="circle-logo" />
          </div>
          <h2>Reset Password</h2>
          <p>Confirm your new password to continue.</p>

          <form onSubmit={handleSubmit}>

            <div className={`form-group password-group ${passwordError ? 'input-error' : ''}`}>
              <label htmlFor="password">New Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              {passwordError && <div className="error-text">{passwordError}</div>}
            </div>

            <div className={`form-group password-group ${confirmPasswordError ? 'input-error' : ''}`}>
              <label htmlFor="confirmPassword">Re-enter new password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              {confirmPasswordError && <div className="error-text">{confirmPasswordError}</div>}
            </div>

            <button type="submit" className="login-button">Reset Password</button>
          </form>

          <div className="signup-link">
            Access your account? Go back to <a href="/login">Log in</a>
          </div>
        </div>

        <div
          className="login-image"
          style={{ backgroundImage: `url(${homeImage})` }}
        >
          <div className="brand-logo"></div>
        </div>
      </div>
    </div>
  );
};

export default Resetpassword;
