import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import './sidebar.css';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faHome, faUtensils, faUserFriends,
  faBox, faCarrot, faTruck, faTshirt
} from '@fortawesome/free-solid-svg-icons';

function SidebarComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);
  const location = useLocation();

  return (
    <div className="sidebar-wrapper">
      {/* Sidebar Panel */}
      <Sidebar collapsed={collapsed} className={`sidebar-container ${collapsed ? 'ps-collapsed' : ''}`}>
        <div className="side-container">
          <div className={`logo-wrapper ${collapsed ? 'collapsed' : ''}`}>
            <img src={logo} alt="Logo" className="logo" />
          </div>

          {!collapsed && <div className="section-title">GENERAL</div>}
          <Menu>
            <MenuItem
              icon={<FontAwesomeIcon icon={faHome} />}
              component={<Link to="/manager/dashboard" />}
              active={location.pathname === '/manager/dashboard'}
            >
              Dashboard
            </MenuItem>
            <MenuItem
              icon={<FontAwesomeIcon icon={faBox} />}
              component={<Link to="/manager/products" />}
              active={location.pathname === '/manager/products'}
            >
              Product Management
            </MenuItem>
            <MenuItem
              icon={<FontAwesomeIcon icon={faUtensils} />}
              component={<Link to="/manager/recipeManagement" />}
              active={location.pathname === '/manager/recipeManagement'}
            >
              Recipe Management
            </MenuItem>

            {!collapsed && <div className="section-title">STOCKS</div>}
            <MenuItem
              icon={<FontAwesomeIcon icon={faCarrot} />}
              component={<Link to="/manager/ingredients" />}
              active={location.pathname === '/manager/ingredients'}
            >
              Ingredients
            </MenuItem>
            <MenuItem
              icon={<FontAwesomeIcon icon={faTruck} />}
              component={<Link to="/manager/supplies" />}
              active={location.pathname === '/manager/supplies'}
            >
              Supplies & Materials
            </MenuItem>
            <MenuItem
              icon={<FontAwesomeIcon icon={faTshirt} />}
              component={<Link to="/manager/merchandise" />}
              active={location.pathname === '/manager/merchandise'}
            >
              Merchandise
            </MenuItem>
          </Menu>
        </div>
      </Sidebar>

      {/* TOGGLE BUTTON ON THE RIGHT OF SIDEBAR */}
      <button className="toggle-btn-right" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </button>
    </div>
  );
}

export default SidebarComponent;
