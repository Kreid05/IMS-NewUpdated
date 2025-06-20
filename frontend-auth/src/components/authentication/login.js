import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import homeImage from '../assets/coffee.jpg';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './login.css';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState(false);
  const [usernameErrorMsg, setUsernameErrorMsg] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const navigate = useNavigate();

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60; // 15 minutes

  React.useEffect(() => {
    let timer;
    if (isLockedOut && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setFailedAttempts(0);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    setUsernameError(false);
    setUsernameErrorMsg('');
    setPasswordError(false);
    setPasswordErrorMsg('');

    let hasError = false;

    if (!trimmedUsername) {
      setUsernameError(true);
      setUsernameErrorMsg('Username is required');
      hasError = true;
    } else if (trimmedUsername.length < 3) {
      setUsernameError(true);
      setUsernameErrorMsg('Username must be at least 3 characters');
      hasError = true;
    } else if (trimmedUsername.length > 20) {
      setUsernameError(true);
      setUsernameErrorMsg('Username cannot exceed 20 characters');
      hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setUsernameError(true);
      setUsernameErrorMsg('Invalid Input');
      hasError = true;
    }

    if (!trimmedPassword) {
      setPasswordError(true);
      setPasswordErrorMsg('Password cannot be empty');
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError(true);
      setPasswordErrorMsg('Password must be at least 6 characters');
      hasError = true;
    } else if (trimmedPassword.length > 64) {
      setPasswordError(true);
      setPasswordErrorMsg('Password cannot exceed 64 characters');
      hasError = true;
    } else if (/['";\-]/.test(trimmedPassword)) {
      setPasswordError(true);
      setPasswordErrorMsg('Invalid characters in password');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', trimmedUsername);
      formBody.append('password', trimmedPassword);

      const response = await fetch('http://127.0.0.1:4000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;

        localStorage.setItem('authToken', access_token);
        
        toast.success('Login successful!', {
          position: 'top-right',
          autoClose: 1000,
        });
        
        const decodedToken = jwtDecode(access_token);
        const userRole = decodedToken.role;
        const userSystem = decodedToken.system; 

        console.log('User Role:', userRole);
        console.log('User System:', userSystem);
        
        setTimeout(() => {
          // IMS
          // manager navigation
          if (userRole === 'manager' && userSystem === 'IMS') {
            const targetUrl = new URL('http://localhost:3000/manager/dashboard/');
            targetUrl.searchParams.append('username', trimmedUsername);
            targetUrl.searchParams.append('authorization', access_token);
            window.location.href = targetUrl.toString();
          }
          // staff navigation
          else if (userRole === 'staff' && userSystem === 'IMS') {
            const targetUrl = new URL('http://localhost:3000/staff/dashboard/');
            targetUrl.searchParams.append('username', trimmedUsername);
            targetUrl.searchParams.append('authorization', access_token);
            window.location.href = targetUrl.toString();
          } 

          // POS
          // admin navigation
          else if (userRole === 'admin' && userSystem === 'POS') {
            const targetUrl = new URL('http://localhost:4001/admin/dashboard/');
            targetUrl.searchParams.append('username', trimmedUsername);
            targetUrl.searchParams.append('authorization', access_token);
            window.location.href = targetUrl.toString();
          }
          // cashier navigation
          else if (userRole === 'cashier') {
            const targetUrl = new URL('http://localhost:4001/cashier/menu');
            targetUrl.searchParams.append('username', trimmedUsername);
            targetUrl.searchParams.append('authorization', access_token);
            window.location.href = targetUrl.toString();
          }

          //OOS 
          // admin navigation
          else if (userRole === 'admin' && userSystem === 'OOS') {
            const targetUrl = new URL('http://localhost:5000/admin/dashboard/');
            targetUrl.searchParams.append('username', trimmedUsername);
            targetUrl.searchParams.append('authorization', access_token);
            window.location.href = targetUrl.toString();
          }
          //rider navigation
          else if (userRole === 'rider' && userSystem === 'OOS') {
            const targetUrl = new URL('http://localhost:5000/rider/home');
            targetUrl.searchParams.append('username', trimmedUsername);
            targetUrl.searchParams.append('authorization', access_token);
            window.location.href = targetUrl.toString();
          } 

          // UMS
          // super admin ums navigation
          else if (userRole === 'superadmin') {          
            navigate('/usermanagement', { 
              replace: true,
              state: { 
                username: trimmedUsername, 
                authorization: access_token 
              }
            });
          } 
          // OOS outside user navigation
          else {
            window.location.href = 'http://localhost:5000/';
          }
        }, 1000); 
      } else if (response.status === 401) {
        setFailedAttempts((prev) => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_ATTEMPTS) {
            setIsLockedOut(true);
            setLockoutTimer(LOCKOUT_DURATION);
          }
          return newAttempts;
        });
        const attemptsLeft = Math.max(0, MAX_ATTEMPTS - (failedAttempts + 1));
        toast.error(`Invalid username or password. You have ${attemptsLeft} login ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`, {
          position: 'top-right',
          autoClose: 3000,
        });
      } else if (response.status === 403) {
        try {
          const lockoutResponse = await fetch(`http://127.0.0.1:8000/lockout-status?username=${encodeURIComponent(trimmedUsername)}`);
          if (lockoutResponse.ok) {
            const lockoutData = await lockoutResponse.json();
            setIsLockedOut(true);
            setLockoutTimer(lockoutData.remaining_seconds);
            setFailedAttempts(lockoutData.failed_attempts);
          } else {
            setIsLockedOut(true);
            setLockoutTimer(LOCKOUT_DURATION);
          }
        } catch (error) {
          console.error('Error fetching lockout status:', error);
          setIsLockedOut(true);
          setLockoutTimer(LOCKOUT_DURATION);
        }
        toast.error('Account locked due to too many failed login attempts. Please try again later.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Could not connect to the server. Please check your connection.');
    }
  };

  return (
    <div className="login-container">
      <ToastContainer />
      <div className="login-box">
        <div className="login-form">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo" className="circle-logo" />
          </div>
          <h2>Welcome Back</h2>
          <p>Please Enter Your Details To Log In.</p>
          <form onSubmit={handleSubmit}>
            <div className={`form-group ${usernameError ? 'input-error' : ''}`}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              {usernameError && <div className="error-message">{usernameErrorMsg}</div>}
            </div>
            <div className={`form-group password-group ${passwordError ? 'input-error' : ''}`}>
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              {passwordError && <div className="error-message">{passwordErrorMsg}</div>}
            </div>
            <div className="forgot-password">
              <a href="/forgot-password"></a>
            </div>
            <button type="submit" className="login-button">Log In</button>
            <button
              type="button"
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'white',
                color: '#555',
                border: '1.5px solid #888',
                borderRadius: '15px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              onClick={() => {
                alert('Google Sign-In clicked');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.22l6.87-6.87C34.6 2.6 29.7 0 24 0 14.6 0 6.3 6.1 2.6 14.9l7.98 6.2C12.9 15.1 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24c0-1.6-.15-3.1-.43-4.6H24v9h12.7c-.55 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4 7-10 7-17.4z"/>
                <path fill="#FBBC05" d="M10.6 28.1c-.4-1.2-.6-2.5-.6-3.8s.2-2.6.6-3.8l-7.98-6.2C.9 19.3 0 21.6 0 24s.9 4.7 2.6 6.7l7.98-6.2z"/>
                <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.5-5.8c-2 1.3-4.5 2-7 2-6.1 0-11.1-4.6-12.3-10.7l-8 6.2C6.3 41.9 14.6 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </button>
          </form>
          {isLockedOut && (
            <div className="lockout-message" style={{ color: 'red', marginTop: '10px' }}>
              <p>Your account is locked. Please try again in {Math.floor(lockoutTimer / 60).toString().padStart(2, '0')}:{(lockoutTimer % 60).toString().padStart(2, '0')} minutes.</p>
            </div>
          )}
          <div className="signup-link">
            Don’t have an account? <a href="/signup">Sign up</a>
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

export default LoginPage;