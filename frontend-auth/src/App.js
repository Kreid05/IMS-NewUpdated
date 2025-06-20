import React from 'react';
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import LoginPage from './components/authentication/login';
import Forgotpassword from './components/authentication/forgotpassword';
import Signup from './components/authentication/signup';
import Resetpassword from './components/Resetpassword';
import Usermanagement from './components/userManagement/usermanagement';
import SidebarComponent from './components/sidebar/sidebar';
import Dashboard from './components/dashboard/dashboard';

function App() {
  const location = useLocation();

  return (
    <div className="App" style={{ display: 'flex' }}>
      {/* Render Sidebar only on /admin/usermanagement */}
      {location.pathname === '/admin/usermanagement' && <SidebarComponent />}

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<Forgotpassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<Resetpassword />} />
          <Route path="Usermanagement" element={<Usermanagement />} />
          <Route path="Dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

