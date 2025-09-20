import React, { useState } from 'react';
import './notification.css';

const NotificationModal = ({ isOpen, onClose }) => {
  // Hardcoded notification data
  const notifications = [
    {
      id: 1,
      name: "Coffee Beans",
      type: "Ingredients",
      status: "Low-stock",
      timestamp: "2024-01-15 10:30:00",
      message: "Coffee Beans was already low in stocks"
    },
    {
      id: 2,
      name: "Cups",
      type: "Supplies & Materials",
      status: "Not Available",
      timestamp: "2024-01-15 09:45:00",
      message: "There are no stocks of Cups"
    },
    {
      id: 3,
      name: "Tumbler",
      type: "Merchandise",
      status: "Not Available",
      timestamp: "2024-01-15 08:15:00",
      message: "There are no stocks of Tumbler"
    },
    {
      id: 4,
      name: "Milk",
      type: "Ingredients",
      status: "Low-stock",
      timestamp: "2024-01-14 16:20:00",
      message: "Milk was already low on stocks"
    },
    {
      id: 5,
      name: "Matcha Powder",
      type: "Ingredients",
      status: "Low-stock",
      timestamp: "2024-01-14 14:00:00",
      message: "Matcha Powder was already low on stocks"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Low-stock':
        return '#e4b834ff';
      case 'Not Available':
        return '#a9212fff';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notifications</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="notification-content">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No notifications at this time</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-details">
                    <div className="notification-header-row">
                      <h4>{notification.name}</h4>
                      <span
                        className="notification-status"
                        style={{ backgroundColor: getStatusColor(notification.status) }}
                      >
                        {notification.status}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <span className="notification-type">{notification.type}</span>
                      <span className="notification-timestamp">{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="notification-footer">
          <button className="mark-all-read">Mark All as Read</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
