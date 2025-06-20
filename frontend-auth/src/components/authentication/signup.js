import React, { useState } from 'react';
import logo from '../assets/logo.jpg';
import homeImage from '../assets/coffee.jpg';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './signup.css'

const Signup = () => {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [lastName, setLastName] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [isLastNameValid, setIsLastNameValid] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [isFirstNameValid, setIsFirstNameValid] = useState(true);
  const [middleName, setMiddleName] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [isMiddleNameValid, setIsMiddleNameValid] = useState(true);
  const [suffix, setSuffix] = useState('');
  const [suffixError, setSuffixError] = useState('');
  const [isSuffixValid, setIsSuffixValid] = useState(true);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate username with regex: alphanumeric, underscores, periods, length 3-30
  const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
  if (!usernameRegex.test(username)) {
    setUsernameError('Username must be 3-30 characters and can include letters, numbers, underscores, and periods.');
    setIsUsernameValid(false);
    return;
  }

  // Prevent submission if email is invalid or taken
  if (!isEmailValid) {
    setEmailError(emailError || 'Please provide a valid email.');
    return;
  }

  // Validate first name, last name, middle name not empty
  if (!firstName.trim()) {
    setFirstNameError('First Name is required.');
    setIsFirstNameValid(false);
    return;
  }
  if (!lastName.trim()) {
    setLastNameError('Last Name is required.');
    setIsLastNameValid(false);
    return;
  }
  // Middle name can be optional, but if present validate length
  if (middleName && middleName.length > 50) {
    setMiddleNameError('Middle Name must be 50 characters or less.');
    setIsMiddleNameValid(false);
    return;
  }

  // Validate suffix length and characters if present
  if (suffix && !/^[a-zA-Z\s'-]{0,50}$/.test(suffix)) {
    setSuffixError('Suffix can only contain letters, spaces, hyphens, apostrophes and must be 50 characters or less.');
    setIsSuffixValid(false);
    return;
  }

  // Validate phone number length
  if (phone.length !== 11) {
    setPhoneError('Phone number must be exactly 11 digits.');
    setIsPhoneValid(false);
    return;
  }

  // Validate email format and non-empty
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    setEmailError('Email is required.');
    setIsEmailValid(false);
    return;
  } else if (!emailRegex.test(email)) {
    setEmailError('Invalid email format.');
    setIsEmailValid(false);
    return;
  }

  // Clear previous errors
  setPasswordError('');
  setConfirmPasswordError('');

  let hasError = false;

  // Password validation: length 12-64, allow spaces, unicode, special chars, must have uppercase, digit and special char
  if (password.length < 12   || password.length > 64) {
    setPasswordError('Password must be between 12 and 64 characters long.');
    hasError = true;
  }
  // Check for at least one uppercase letter
  else if (!/[A-Z]/.test(password)) {
    setPasswordError('Password must contain at least one uppercase letter.');
    hasError = true;
  }
  // Check for at least one digit
  else if (!/\d/.test(password)) {
    setPasswordError('Password must contain at least one digit.');
    hasError = true;
  }
  // Check for at least one special character (non-alphanumeric)
  else if (!/[^a-zA-Z0-9\s]/.test(password)) {
    setPasswordError('Password must contain at least one special character.');
    hasError = true;
  }
  // Check if passwords match
  else if (password !== confirmPassword) {
    setConfirmPasswordError('Passwords do not match!');
    hasError = true;
  }

  // If any errors, do not submit
  if (hasError) {
    return;
  }

  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("middleName", middleName);
    formData.append("suffix", suffix);
    formData.append("phoneNumber", phone);
    formData.append("email", email);

    const response = await fetch("http://127.0.0.1:4000/users/signup-oos", {
      method: "POST",
      body: formData,
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      data = null;
    }

    if (response.ok) {
      toast.success(data?.message || "Account created successfully!");
      // Optional: Redirect to login page
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } else {
      toast.error(data?.detail || data?.message || "Signup failed.");
    }
  } catch (error) {
    console.error("Signup error:", error);
    toast.error(error.message || "Something went wrong.");
  }
};


  // Style object for consistent placeholder styling
  const inputStyles = {
    borderRadius: '12px', 
    padding: '8px 12px', 
    borderColor: '#c0c9c9',
    color: '#495057', // Dark gray for input text
    backgroundColor: '#f8f9fa' // Light gray background
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #EBF5F6, #abdfe7, #65b2c2, #90bfc7)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={true} />
      <div style={{
        display: 'flex',
        maxWidth: '1200px',
        width: '100%',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: 'white'
      }}>
        {/* Form Column */}
        <div style={{
          flex: 1,
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <img src={logo} alt="Logo" style={{width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto'}} />
          </div>
          <h2 style={{textAlign: 'center', marginBottom: '10px', color: '#5EA5B3', fontWeight: '700'}}>Create Account</h2>
          <p style={{textAlign: 'center', marginBottom: '20px', color: '#5BA7B4', fontWeight: '300'}}>Please fill in your details to sign up.</p>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '13px'}}>
              <label htmlFor="username" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Username <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only alphanumeric, underscore, period, max length 30
                  const usernameRegex = /^[a-zA-Z0-9._]{0,30}$/;
                  if (usernameRegex.test(value)) {
                    setUsername(value);
                    setUsernameError('');
                    setIsUsernameValid(true);
                  }
                }}
                onBlur={async () => {
                  // Check if username is taken
                  if (username.length < 3) {
                    setUsernameError('Username must be at least 3 characters.');
                    setIsUsernameValid(false);
                    return;
                  }
                  try {
                    const response = await fetch(`http://localhost:7000/check-username?username=${encodeURIComponent(username)}`);
                    const data = await response.json();
                    if (!data.available) {
                      setUsernameError('Username already taken');
                      setIsUsernameValid(false);
                    } else {
                      // Clear error only if username length >= 3
                      if (username.length >= 3) {
                        setUsernameError('');
                        setIsUsernameValid(true);
                      }
                    }
                  } catch (error) {
                    // On error, assume username is valid to not block user
                    if (username.length >= 3) {
                      setUsernameError('');
                      setIsUsernameValid(true);
                    }
                  }
                }}
                required
                style={{
                  ...inputStyles,
                  borderColor: isUsernameValid ? inputStyles.borderColor : 'red',
                  color: isUsernameValid ? inputStyles.color : 'red'
                }}
              />
              {usernameError && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                  {usernameError}
                </div>
              )}
            </div>

            <div style={{marginBottom: '10px', display: 'flex', gap: '10px'}}>
              <div style={{flex: 1}}>
                <label htmlFor="lastName" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Last Name <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only letters, spaces, hyphens, apostrophes, max length 50
                  const nameRegex = /^[a-zA-Z\s'-]{0,50}$/;
                  if (nameRegex.test(value)) {
                    setLastName(value);
                    setLastNameError('');
                    setIsLastNameValid(true);
                  }
                }}
                onBlur={() => {
                  if (!lastName.trim()) {
                    setLastNameError('Last Name is required.');
                    setIsLastNameValid(false);
                  }
                }}
                required
                style={{
                  ...inputStyles,
                  borderColor: isLastNameValid ? inputStyles.borderColor : 'red',
                  color: isLastNameValid ? inputStyles.color : 'red'
                }}
              />
              {lastNameError && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                  {lastNameError}
                </div>
              )}
              </div>
              <div style={{flex: 1}}>
                <label htmlFor="firstName" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>First Name <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only letters, spaces, hyphens, apostrophes, max length 50
                  const nameRegex = /^[a-zA-Z\s'-]{0,50}$/;
                  if (nameRegex.test(value)) {
                    setFirstName(value);
                    setFirstNameError('');
                    setIsFirstNameValid(true);
                  }
                }}
                onBlur={() => {
                  if (!firstName.trim()) {
                    setFirstNameError('First Name is required.');
                    setIsFirstNameValid(false);
                  }
                }}
                required
                style={{
                  ...inputStyles,
                  borderColor: isFirstNameValid ? inputStyles.borderColor : 'red',
                  color: isFirstNameValid ? inputStyles.color : 'red'
                }}
              />
              {firstNameError && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                  {firstNameError}
                </div>
              )}
              </div>
            </div>
            <div style={{marginBottom: '10px', display: 'flex', gap: '10px'}}>
              <div style={{flex: 1}}>
                <label htmlFor="middleName" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Middle Name</label>
                <input
                  type="text"
                  id="middleName"
                  placeholder="Enter your middle name"
                  value={middleName}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only letters, spaces, hyphens, apostrophes, max length 50
                    const nameRegex = /^[a-zA-Z\s'-]{0,50}$/;
                    if (nameRegex.test(value)) {
                      setMiddleName(value);
                      setMiddleNameError('');
                      setIsMiddleNameValid(true);
                    }
                  }}
                  onBlur={() => {
                    if (middleName && !middleName.trim()) {
                      setMiddleNameError('Middle Name cannot be empty if entered.');
                      setIsMiddleNameValid(false);
                    }
                  }}
                  style={{
                    ...inputStyles,
                    borderColor: isMiddleNameValid ? inputStyles.borderColor : 'red',
                    color: isMiddleNameValid ? inputStyles.color : 'red'
                  }}
                />
                {middleNameError && (
                  <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                    {middleNameError}
                  </div>
                )}
              </div>

              <div style={{flex: 1}}>
                <label htmlFor="suffix" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Suffix</label>
                <input
                  type="text"
                  id="suffix"
                  placeholder="Enter your suffix"
                  value={suffix}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only letters, spaces, hyphens, apostrophes, max length 50
                    const nameRegex = /^[a-zA-Z\s'-]{0,50}$/;
                    if (nameRegex.test(value)) {
                      setSuffix(value);
                      setSuffixError('');
                      setIsSuffixValid(true);
                    }
                  }}
                  onBlur={() => {
                    if (suffix && !suffix.trim()) {
                      setSuffixError('Suffix cannot be empty if entered.');
                      setIsSuffixValid(false);
                    }
                  }}
                  style={{
                    ...inputStyles,
                    borderColor: isSuffixValid ? inputStyles.borderColor : 'red',
                    color: isSuffixValid ? inputStyles.color : 'red'
                  }}
                />
                {suffixError && (
                  <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                    {suffixError}
                  </div>
                )}
              </div>

              <div style={{flex: 1}}>
                <label htmlFor="phone" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Phone <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  id="phone"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only digits, max length 11
                    const phoneRegex = /^[0-9]{0,11}$/;
                    if (phoneRegex.test(value)) {
                      setPhone(value);
                      setPhoneError('');
                      setIsPhoneValid(true);
                    }
                  }}
                  onBlur={() => {
                    if (phone.length !== 11) {
                      setPhoneError('Phone number must be exactly 11 digits.');
                      setIsPhoneValid(false);
                    }
                  }}
                  required
                  style={{
                    ...inputStyles,
                    borderColor: isPhoneValid ? inputStyles.borderColor : 'red',
                    color: isPhoneValid ? inputStyles.color : 'red'
                  }}
                />
                {phoneError && (
                  <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                    {phoneError}
                  </div>
                )}
              </div>
            </div>

            <div style={{marginBottom: '10px'}}>
              <label htmlFor="email" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Email <span style={{color: 'red'}}>*</span></label>
              <input
                type="email"
                id="email"
                placeholder="Sample@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setIsEmailValid(true);
                }}
                onBlur={() => {
                  // Validate email format and non-empty
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!email.trim()) {
                    setEmailError('Email is required.');
                    setIsEmailValid(false);
                    return;
                  } else if (!emailRegex.test(email)) {
                    setEmailError('Invalid email format.');
                    setIsEmailValid(false);
                    return;
                  }
                  // No email availability check due to missing backend endpoint
                  setEmailError('');
                  setIsEmailValid(true);
                }}
                required
                style={{
                  ...inputStyles,
                  borderColor: isEmailValid ? inputStyles.borderColor : 'red',
                  color: isEmailValid ? inputStyles.color : 'red'
                }}
              />
              {emailError && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                  {emailError}
                </div>
              )}
            </div>

            <div style={{marginBottom: '10px', position: 'relative'}}>
              <label htmlFor="password" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Password <span style={{color: 'red'}}>*</span></label>
              <div style={{position: 'relative'}}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  ...inputStyles,
                  paddingRight: '40px',
                  borderColor: passwordError ? 'red' : inputStyles.borderColor,
                  color: passwordError ? 'red' : inputStyles.color
                }}
              />
              {passwordError && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                  {passwordError}
                </div>
              )}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#5BA7B4'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{marginBottom: '20px', position: 'relative'}}>
              <label htmlFor="confirmPassword" style={{color: '#5EA5B3', fontWeight: '500', display: 'block', marginBottom: '5px'}}>Confirm Password <span style={{color: 'red'}}>*</span></label>
              <div style={{position: 'relative'}}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  ...inputStyles,
                  paddingRight: '40px',
                  borderColor: confirmPasswordError ? 'red' : inputStyles.borderColor,
                  color: confirmPasswordError ? 'red' : inputStyles.color
                }}
              />
              {confirmPasswordError && (
                <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>
                  {confirmPasswordError}
                </div>
              )}
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#5BA7B4'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#4B929D',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3d7d87'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4B929D'}
            >
              Sign Up
            </button>
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
                // Placeholder for Google sign-in logic
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

          <div style={{textAlign: 'center', marginTop: '15px'}}>
            <small style={{color: '#6c757d'}}>
              Already have an account? <a href="/login" style={{color: '#4B929D', fontWeight: '500', textDecoration: 'none'}}>Log in</a>
            </small>
          </div>
        </div>

        {/* Image Column */}
        <div style={{
          flex: 1,
          display: 'none',
          backgroundImage: `url(${homeImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '500px',
          borderTopRightRadius: '18px',
          borderBottomRightRadius: '18px'
        }} className="d-md-block">
        </div>
      </div>
    </div>
  );
};

export default Signup;