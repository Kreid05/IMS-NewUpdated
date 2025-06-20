import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./addEmployeeModal.css";

function AddEmployeeModal({ showModal, onClose, editingEmployee, onSuccess }) {
  const initialFormData = {
    firstName: "",
    middleName: "",
    suffix: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    system: "",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        firstName: editingEmployee.firstName || "",
        middleName: editingEmployee.middleName || "",
        suffix: editingEmployee.suffix || "",
        lastName: editingEmployee.lastName || "",
        username: editingEmployee.username || "",
        email: editingEmployee.email || "",
        phone: editingEmployee.phone === "N/A" ? "" : editingEmployee.phone || "",
        role: editingEmployee.role || "",
        system: editingEmployee.system || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      setFormData(initialFormData);
    }
    setPasswordError("");
    setConfirmPasswordError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [editingEmployee, showModal]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getAuthToken = () => localStorage.getItem("authToken");

  const validatePassword = () => {
    let hasError = false;
    setPasswordError("");
    setConfirmPasswordError("");

    if (!editingEmployee || (editingEmployee && formData.password)) {
      if (!formData.password || formData.password.length < 12 || formData.password.length > 64) {
        setPasswordError("Password must be between 12 and 64 characters long.");
        hasError = true;
      } else if (!/[A-Z]/.test(formData.password)) {
        setPasswordError("Password must contain at least one uppercase letter.");
        hasError = true;
      } else if (!/\d/.test(formData.password)) {
        setPasswordError("Password must contain at least one digit.");
        hasError = true;
      } else if (!/[^a-zA-Z0-9\s]/.test(formData.password)) {
        setPasswordError("Password must contain at least one special character.");
        hasError = true;
      } else {
        setPasswordError("");
      }

      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setConfirmPasswordError("Passwords do not match!");
        hasError = true;
      } else {
        setConfirmPasswordError("");
      }
    }
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingEmployee && !formData.username) {
      alert("Username is required for new employees.");
      return;
    }
    if (!editingEmployee && !formData.password) {
      alert("Password is required for new employees.");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert("Authentication error.");
      onClose();
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append("firstName", formData.firstName);
    formDataPayload.append("middleName", formData.middleName);
    formDataPayload.append("lastName", formData.lastName);
    formDataPayload.append("suffix", formData.suffix); 
    formDataPayload.append("username", formData.username);
    formDataPayload.append("password", formData.password);
    formDataPayload.append("email", formData.email);
    formDataPayload.append("phoneNumber", formData.phone); 
    formDataPayload.append("userRole", formData.role);
    formDataPayload.append("system", formData.system);

    const method = editingEmployee ? "PUT" : "POST";
    const url = editingEmployee
      ? `http://127.0.0.1:4000/users/update/${editingEmployee.id}`
      : "http://127.0.0.1:4000/users/create";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataPayload,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to save employee");
      }
      alert(`Employee ${editingEmployee ? "updated" : "added"} successfully!`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Save error:", err);
      alert(err.message);
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="row">
              <div>
                <label>
                  First Name<span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label>
                  Last Name<span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div>
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle Name"
                  value={formData.middleName}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label>Suffix</label>
                <input
                  type="text"
                  name="suffix"
                  placeholder="Suffix"
                  value={formData.suffix || ""}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <div className="row">
              <div>
                <label>
                  Username<span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleFormChange}
                  required={!editingEmployee}
                  disabled={!!editingEmployee}
                />
              </div>
            </div>
            <div className="row">
              <div>
                <label>
                  Email Address<span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div>
                <label>
                  Role<span className="required">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="rider">Rider</option>
                  <option value="cashier">Cashier</option>
                  <option value="user">User</option>
                  <option value="super admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label>
                  System<span className="required">*</span>
                </label>
                <select
                  name="system"
                  value={formData.system}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select System</option>
                  <option value="IMS">IMS</option>
                  <option value="POS">POS</option>
                  <option value="OOS">OOS</option>
                  <option value="AUTH">AUTH</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>
                  Password{!editingEmployee && <span className="required">*</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={editingEmployee ? "Leave blank to keep unchanged" : "Password"}
                    value={formData.password}
                    onChange={handleFormChange}
                    required={!editingEmployee}
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#5BA7B4",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <div className="error-message">{passwordError}</div>}
              </div>
              <div>
                <label>
                  Confirm Password{!editingEmployee && <span className="required">*</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    required={!editingEmployee}
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#5BA7B4",
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
              </div>
            </div>

            <button type="submit" className="save-btn">
              {editingEmployee ? "Update Employee" : "Save Employee"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddEmployeeModal;
