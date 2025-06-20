import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./usermanagement.css";
import Sidebar from "../sidebar/sidebar";
import {
  FaChevronDown,
  FaBell,
  FaEdit,
  FaArchive,
  FaPlus,
  FaFolderOpen,
} from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import DataTable from "react-data-table-component";
import AddEmployeeModal from "./modals/addEmployeeModal";
import EditEmployeeModal from "./modals/editEmployeeModal";
import ViewEmployeeModal from "./modals/viewEmployeeModal";

function Usermanagement() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const initialFormData = {
    id: null,
    firstName: "",
    middleName: "",
    suffix: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    system: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const getAuthToken = () => localStorage.getItem("authToken");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://127.0.0.1:4000/users/list-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
        let apiData = await response.json();
        if (apiData && !Array.isArray(apiData)) apiData = [apiData];
        else if (!apiData) apiData = [];

        const mappedEmployees = apiData.map((user) => ({
          id: user.userID,
          name: user.fullName,
          username: user.username,
          email: user.email,
          role: user.userRole,
          system: user.system || "N/A",
          status: user.isDisabled ? "Inactive" : "Active",
          phone: user.phoneNumber || "N/A",
        }));
        setEmployees(mappedEmployees);
      } catch (e) {
        console.error("Fetch error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [navigate]);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
  const currentDate = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
  });

  const [loggedInUserDisplay] = useState({ role: "Admin", name: "Current User" });

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingEmployee(null);
    setFormData(initialFormData);
  };

  const handleAddEmployeeClick = () => {
    setEditingEmployee(null);
    setFormData(initialFormData);
    setShowAddModal(true);
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setShowEditModal(true);
  };

  const handleViewEmployee = (emp) => {
    setViewingEmployee(emp);
  };

  const handleDeleteEmployee = async (empId) => {
    if (!window.confirm("Are you sure you want to archive this employee? This will set their status to Inactive.")) return;
    const token = getAuthToken();
    try {
      const response = await fetch(`http://127.0.0.1:4000/users/disable/${empId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to archive employee");
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === empId ? { ...emp, status: "Inactive" } : emp))
      );
      alert("Employee archived successfully!");
    } catch (err) {
      console.error("Archive error:", err);
      alert(err.message);
    }
  };

  const filteredData = employees.filter((emp) => {
    const nameMatch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter ? emp.role === roleFilter : true;
    const statusMatch = statusFilter ? emp.status === statusFilter : true;
    return (nameMatch || emailMatch) && roleMatch && statusMatch;
  });

  const columns = [
    { name: "EMPLOYEE", selector: (row) => row.name, sortable: true, width: "20%" },
    { name: "EMAIL", selector: (row) => row.email, width: "25%" },
    { name: "ROLE", selector: (row) => row.role, width: "15%" },
    { name: "PHONE", selector: (row) => row.phone, width: "10%" },
    {
      name: "STATUS",
      selector: (row) => (
        <span className={`status-badge ${row.status === "Active" ? "active" : "inactive"}`}>
          {row.status}
        </span>
      ),
      width: "10%",
    },
    { name: "System", selector: (row) => row.system, width: "10%" },
    {
      name: "ACTION",
      cell: (row) => (
        <div className="action-buttons">
          <button className="view-button" onClick={() => handleViewEmployee(row)}>
            <FaFolderOpen />
          </button>
          <button className="edit-button" onClick={() => handleEditEmployee(row)}>
            <FaEdit />
          </button>
          <button className="delete-button" onClick={() => handleDeleteEmployee(row.id)}>
            <FaArchive />
          </button>
        </div>
      ),
      width: "10%",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  return (
    <div className="empRecords">
      <Sidebar />
      <div className="employees">
        <header className="header">
          <div className="header-left">
            <h2 className="page-title">User management</h2>
          </div>
          <div className="header-right">
            <div className="header-date">{currentDate}</div>
            <div className="header-profile">
              <div className="profile-left">
                <div className="profile-info">
                  <div className="profile-role">Hi! I'm {loggedInUserDisplay.role}</div>
                  <div className="profile-name">{loggedInUserDisplay.name}</div>
                </div>
              </div>
              <div className="profile-right">
                <div className="dropdown-icon" onClick={toggleDropdown}>
                  <FaChevronDown />
                </div>
                <div className="bell-icon">
                  <FaBell className="bell-outline" />
                </div>
              </div>
              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <ul>
                    <li onClick={handleLogout}>Logout</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="empRecords-content">
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search Employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Role: All</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="rider">Rider</option>
              <option value="cashier">Cashier</option>
              <option value="user">User</option>
              <option value="super admin">Super Admin</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button className="add-btn" onClick={handleAddEmployeeClick}>
              <FaPlus /> Add Employee
            </button>
          </div>

          <AddEmployeeModal
            showModal={showAddModal}
            onClose={handleModalClose}
            onSuccess={() => window.location.reload()}
          />

          <EditEmployeeModal
            showModal={showEditModal}
            onClose={handleModalClose}
            editingEmployee={editingEmployee}
            onSuccess={() => window.location.reload()}
          />

          <ViewEmployeeModal
            viewingEmployee={viewingEmployee}
            onClose={() => setViewingEmployee(null)}
          />

          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
            responsive
            progressPending={loading}
            noDataComponent={
              <div style={{ padding: "24px", textAlign: "center", color: "#888" }}>
                {error ? `Error: ${error}` : "No employee records found."}
              </div>
            }
            customStyles={{
              headCells: {
                style: {
                  backgroundColor: "#4B929D",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  padding: "12px",
                  textTransform: "uppercase",
                  textAlign: "center",
                  letterSpacing: "1px",
                },
              },
              header: {
                style: {
                  minHeight: "60px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                },
              },
              rows: { style: { minHeight: "55px", padding: "5px" } },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Usermanagement;