import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.jpg';
import homeImage from '../assets/coffee.jpg';
import './forgotpassword.css';

const Forgotpassword = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before sending another reset link.`);
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('http://localhost:4000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reset_link: 'http://localhost:4000/auth/reset-password',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many password reset requests. Please try again later.');
        }
        throw new Error(data.detail || 'Failed to reset password');
      }

      toast.success('Password reset request sent!');
      setCooldown(60); // 60 seconds cooldown
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
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
          <p>Enter your email to receive password reset instructions.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Sample@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSending}
              />
            </div>

            <button type="submit" className="login-button" disabled={isSending || cooldown > 0}>
              {cooldown > 0 ? `Please wait (${cooldown}s)` : 'Send Reset Link'}
            </button>
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

export default Forgotpassword;
