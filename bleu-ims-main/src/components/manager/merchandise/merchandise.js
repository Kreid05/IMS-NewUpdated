import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./merchandise.css"; 
import Sidebar from "../../sidebar";
import { FaRedoAlt, FaEye, FaEdit, FaArchive } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddMerchandiseModal from './modals/addMerchandiseModal';
import EditMerchandiseModal from "./modals/editMerchandiseModal";
import ViewMerchandiseModal from "./modals/viewMerchandiseModal";
import AddMerchandiseLogsModal from '../restockLogs/merchandiseLogs/modals/addMerchandiseLogsModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; // Import
import "../../reactConfirmAlert.css";

const API_BASE_URL = "http://127.0.0.1:8004";
const getAuthToken = () => localStorage.getItem("authToken");
const DEFAULT_PROFILE_IMAGE = "https://media-hosting.imagekit.io/1123dd6cf5c544aa/screenshot_1746457481487.png?Expires=1841065483&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=kiHcXbHpirt9QHbMA4by~Kd4b2BrczywyVUfZZpks5ga3tnO8KlP8s5tdDpZQqinqOG30tGn0tgSCwVausjJ1OJ9~e6qPVjLXbglD-65hmsehYCZgEzeyGPPE-rOlyGJCgJC~GCZOu0jDKKcu2fefrClaqBBT3jaXoK4qhDPfjIFa2GCMfetybNs0RF8BtyKLgFGeEkvibaXhYxmzO8tksUKaLAMLbsPWvHBNuzV6Ar3mj~lllq7r7nrynNfdvbtuED7OGczSqZ8H-iopheAUhaWZftAh9tX2vYZCZZ8UztSEO3XUgLxMMtv9NnTei1omK00iJv1fgBjwR2lSqRk7w__";

function Merchandise() { 
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [merchandise, setMerchandise] = useState([]);
    const navigate = useNavigate();
    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOrder, setSortOrder] = useState("nameAsc");

    const [showAddMerchandiseModal, setShowAddMerchandiseModal] = useState(false);
    const [showEditMerchandiseModal, setShowEditMerchandiseModal] = useState(false);
    const [selectedMerchandise, setSelectedMerchandise] = useState(null);
    const [showViewMerchandiseModal, setShowViewMerchandiseModal] = useState(false);
    const [showAddMerchandiseLogsModal, setShowAddMerchandiseLogsModal] = useState(false);

    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
    });

    // filtering and sorting data
    const filteredSortedMerchandise = merchandise
        .filter((item) => {
            const matchesSearch = item.MerchandiseName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === "all" || item.Status === filterStatus;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortOrder === 'nameAsc') {
                return a.MerchandiseName.localeCompare(b.MerchandiseName);
            } else { // nameDesc
                return b.MerchandiseName.localeCompare(a.MerchandiseName);
            }
    });

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);
    
    // authentication and authorization
    useEffect(() => {
        const token = getAuthToken();
        const storedUsername = localStorage.getItem("username");

        if (token && storedUsername) {
            try {
                const decodedToken = jwtDecode(token);
                setLoggedInUserDisplay({
                    name: storedUsername,
                    role: decodedToken.role || "User"
                });
            } catch (error) {
                console.error("Error decoding token:", error);
                handleLogout();
            }
        } else {
            console.log("No session found. Redirecting to login.");
            navigate('/');
        }
    }, [navigate, handleLogout]);

    // data fetching
    const fetchMerchandise = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/merchandise/merchandise/`, {
                headers: { Authorization: `Bearer ${token}`},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch ingredients.");
            }

            const data = await response.json();
            setMerchandise(data); 
        } catch (error) {
            console.error("Error fetching merchandise:", error);
            handleLogout();
        }     
    }, [handleLogout]);

    useEffect(() => {
        fetchMerchandise();
    }, [fetchMerchandise]);

    const handleView = (merchandise) => {
        setSelectedMerchandise(merchandise);
        setShowViewMerchandiseModal(true);
    };

    const handleEdit = (merchandise) => {
        setSelectedMerchandise(merchandise);
        setShowEditMerchandiseModal(true);
    };

    const handleDelete = async (merchIdToDelete) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this merchandise item?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        const token = getAuthToken();
                        if (!token) {
                            toast.error("Authentication token not found.");
                            return;
                        }

                        try {
                            const response = await fetch(`${API_BASE_URL}/merchandise/merchandise/${merchIdToDelete}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || "Failed to delete merchandise item.");
                            }

                            toast.success("Merchandise item deleted successfully.");

                            fetchMerchandise(); // refresh list after deletion
                        } catch (error) {
                            console.error("Error deleting item:", error);
                            toast.error("Failed to delete merchandise item.");
                        }
                    }
                },
                {
                    label: 'No',
                    onClick: () => {}
                }
            ]
        });
    };

    const columns = [
        { name: "NO.", selector: (row, index) => index + 1, width: "5%" },
        { name: "NAME", selector: (row) => row.MerchandiseName, sortable: true, width: "30%" },
        { name: "QUANTITY", selector: (row) => row.MerchandiseQuantity, width: "10%", center: true },
        { name: "DATE ADDED", selector: (row) => row.MerchandiseDateAdded, width: "20%", center: true },
        { 
            name: "STATUS", 
            selector: (row) => row.Status, 
            width: "15%", 
            center: true,
            cell: (row) => {
                let className = "";
                if (row.Status === "Available") className = "status-available";
                else if (row.Status === "Low Stock") className = "status-low-stock";
                else if (row.Status === "Not Available") className = "status-not-available";
                else className = ""; // fallback style if needed

                return <span className={className}>{row.Status}</span>;
            }
        },
        {
            name: "ACTIONS",
            cell: (row) => (
                <div className="action-buttons">
                    <button className="action-button restock" onClick={() => setShowAddMerchandiseLogsModal(true)}><FaRedoAlt /></button>
                    <button className="action-button view" onClick={() => handleView(row)}><FaEye /></button>
                    <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                    <button className="action-button delete" onClick={() => handleDelete(row.MerchandiseID)}><FaArchive /></button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            width: "20%",
            center: true
        },
    ];

    return (
        <div className="merchandise">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Merchandise" />

                <div className="merch-header">
                    <div className="merch-bottom-row">
                        <input
                            type="text"
                            className="merch-search-box"
                            placeholder="Search merchandise..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="filter-merch-container">
                            <label htmlFor="filter-merch">Filter by Status: </label>
                            <select
                                id="filter-merch"
                                className="filter-merch-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                <option value="all">All</option>
                                <option value="Available">Available</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Not Available">Not Available</option>
                            </select>
                        </div>

                        <div className="sort-merch-container">
                            <label htmlFor="sort-merch">Sort by:</label>
                            <select
                                id="sort-merch"
                                className="sort-merch-select"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                >
                                <option value="nameAsc">Newest</option>
                                <option value="nameDesc">Oldest</option>
                            </select>
                        </div>

                        <button className="add-merch-button"
                            onClick={() => setShowAddMerchandiseModal(true)}
                        >
                        + Add Merchandise
                        </button>
                    </div>
                </div>

                <div className="merch-content">
                    <DataTable
                        columns={columns}
                        data={filteredSortedMerchandise}
                        striped
                        highlightOnHover
                        responsive
                        pagination
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
                            rows: {
                                style: {
                                    minHeight: "55px",
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {showViewMerchandiseModal && selectedMerchandise && (
                <ViewMerchandiseModal
                    merchandise={selectedMerchandise}
                    onClose={() => setShowViewMerchandiseModal(false)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showAddMerchandiseModal && (
                <AddMerchandiseModal 
                    onClose={() => setShowAddMerchandiseModal(false)} 
                    onSubmit={(newMerchandise) => {
                        setShowAddMerchandiseModal(false);
                        fetchMerchandise();
                    }}
                />
            )}

            {showEditMerchandiseModal && selectedMerchandise && (
                <EditMerchandiseModal
                    merchandise={selectedMerchandise}
                    onClose={() => setShowEditMerchandiseModal(false)}
                    onUpdate={() => {
                        setSelectedMerchandise(null);
                        fetchMerchandise();
                    }}
                />
            )}

            {showAddMerchandiseLogsModal && (
                <AddMerchandiseLogsModal
                    onClose={() => setShowAddMerchandiseLogsModal(false)}
                    onSubmit={(formData) => {
                        // Save new restock record to localStorage
                        const existingRecords = JSON.parse(localStorage.getItem("newMerchandiseRestockRecords") || "[]");
                        const newRecord = {
                            id: Date.now(), // unique id based on timestamp
                            merchandise: formData.merchandise,
                            quantity: Number(formData.quantity),
                            unit: formData.unit,
                            batchDate: formData.batchDate,
                            restockDate: formData.restockDate,
                            loggedBy: formData.loggedBy,
                            status: formData.status,
                            notes: formData.notes || ""
                        };
                        localStorage.setItem("newMerchandiseRestockRecords", JSON.stringify([...existingRecords, newRecord]));
                        setShowAddMerchandiseLogsModal(false);
                        toast.success("Merchandise restock record added successfully!");
                    }}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default Merchandise;
