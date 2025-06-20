import React from "react";
import "./viewEmployeeModal.css";

function ViewEmployeeModal({ viewingEmployee, onClose }) {
  if (!viewingEmployee) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Employee Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid view-mode">
            <div className="row">
              <div>
                <label>Employee ID</label>
                <input type="text" value={viewingEmployee.id} disabled />
              </div>
              <div>
                <label>Full Name</label>
                <input type="text" value={viewingEmployee.name} disabled />
              </div>
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" value={viewingEmployee.email} disabled />
            </div>
            <div>
              <label>Username</label>
              <input type="text" value={viewingEmployee.username} disabled />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="tel" value={viewingEmployee.phone} disabled />
            </div>
            <div className="row">
              <div>
                <label>Role</label>
                <input type="text" value={viewingEmployee.role} disabled />
              </div>
              <div>
                <label>System</label>
                <input type="text" value={viewingEmployee.system} disabled />
              </div>
            </div>
            <div>
              <label>Status</label>
              <input type="text" value={viewingEmployee.status} disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewEmployeeModal;
