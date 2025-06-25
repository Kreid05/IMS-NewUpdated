import React, { useState , useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./supplies.css";
import Sidebar from "../../sidebar";
import { FaRedoAlt, FaEye, FaEdit, FaArchive } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddSupplyModal from './modals/addSupplyModal';
import EditSupplyModal from "./modals/editSupplyModal";
import ViewSupplyModal from "./modals/viewSupplyModal";
import AddSuppliesLogsModal from '../restockLogs/suppliesLogs/modals/addSuppliesLogsModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; // Import
import "../../reactConfirmAlert.css";

const API_BASE_URL = "http://127.0.0.1:8003";
const getAuthToken = () => localStorage.getItem("authToken");
const DEFAULT_PROFILE_IMAGE = "https://media-hosting.imagekit.io/1123dd6cf5c544aa/screenshot_1746457481487.png?Expires=1841065483&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=kiHcXbHpirt9QHbMA4by~Kd4b2BrczywyVUfZZpks5ga3tnO8KlP8s5tdDpZQqinqOG30tGn0tgSCwVausjJ1OJ9~e6qPVjLXbglD-65hmsehYCZgEzeyGPPE-rOlyGJCgJC~GCZOu0jDKKcu2fefrClaqBBT3jaXoK4qhDPfjIFa2GCMfetybNs0RF8BtyKLgFGeEkvibaXhYxmzO8tksUKaLAMLbsPWvHBNuzV6Ar3mj~lllq7r7nrynNfdvbtuED7OGczSqZ8H-iopheAUhaWZftAh9tX2vYZCZZ8UztSEO3XUgLxMMtv9NnTei1omK00iJv1fgBjwR2lSqRk7w__";

function Supplies() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [supplies, setSupplies] = useState([]);
    const navigate = useNavigate();
    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOption, setSortOption] = useState("nameAsc");

    const [showAddSupplyModal, setShowAddSupplyModal] = useState(false);
    const [showEditSupplyModal, setShowEditSupplyModal] = useState(false);
    const [selectedSupply, setSelectedSupply] = useState(null);
    const [showViewSupplyModal, setShowViewSupplyModal] = useState(false);
    const [showAddSuppliesLogsModal, setShowAddSuppliesLogsModal] = useState(false);

    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
    });

    // filtering and sorting
    const filteredSupplies = supplies
        .filter((item) => {
            const matchesSearch = item.MaterialName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === "all" || item.status === filterStatus;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortOption === 'nameAsc') {
                return a.MaterialName.localeCompare(b.MaterialName);
            } else { // nameDesc
                return b.MaterialName.localeCompare(a.MaterialName);
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
    const fetchSupplies = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/materials/materials/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
               throw new Error(`Failed to fetch supplies: ${response.status} ${errorData}`);
            }

            const data = await response.json();
            setSupplies(data);
        } catch (error) {
            console.error("Error fetching supplies:", error);
            handleLogout();
        }
    }, [handleLogout]);
    
    useEffect(() => {
            fetchSupplies();
        }, []);

    const handleView = (supply) => {
        setSelectedSupply(supply);
        setShowViewSupplyModal(true);
    };

    const handleEdit = (supply) => {
        setSelectedSupply(supply);
        setShowEditSupplyModal(true);
    };

    const handleDelete = async (suppliesIdToDelete) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this item?',
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
                            const response = await fetch(`${API_BASE_URL}/materials/materials/${suppliesIdToDelete}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || "Failed to delete supplies.");
                            }

                            toast.success("Supply/Material deleted successfully.");

                            fetchSupplies(); // refresh list after deletion
                        } catch (error) {
                            console.error("Error deleting item:", error);
                            toast.error("Failed to delete item.");
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
        { name: "ITEM NAME", selector: (row) => row.MaterialName, sortable: true, width: "30%" },
        { name: "QUANTITY", selector: (row) => row.MaterialQuantity, width: "15%", center: true },
        { name: "UNIT", selector: (row) => row.MaterialMeasurement, width: "10%", center: true },
        { name: "SUPPLY DATE", selector: (row) => row.DateAdded, width: "15%", center: true },
        { 
            name: "STATUS", 
            selector: (row) => row.Status, 
            width: "10%", 
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
                    <button className="action-button restock" onClick={() => setShowAddSuppliesLogsModal(true)}><FaRedoAlt /></button>
                    <button className="action-button view" onClick={() => handleView(row)}><FaEye /></button>
                    <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                    <button className="action-button delete" onClick={() => handleDelete(row.MaterialID)}><FaArchive /></button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            width: "15%",
            center: true
        },
    ];

    return (
        <div className="supplies">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Supplies" />

                <div className="supply-header">
                    <div className="supply-bottom-row">
                        <input
                            type="text"
                            className="supply-search-box"
                            placeholder="Search supplies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="filter-supply-container">
                            <label htmlFor="filter-supply">Filter by Status:</label>
                            <select
                            id="filter-supply"
                            className="filter-supply-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            >
                            <option value="all">All</option>
                            <option value="Available">Available</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Not Available">Not Available</option>
                            </select>
                        </div>

                        <div className="sort-supply-container">
                            <label htmlFor="sort-supply">Sort by:</label>
                            <select id="sort-supply" className="sort-supply-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                                <option value="nameAsc">Newest</option>
                                <option value="nameDesc">Oldest</option>
                            </select>
                        </div>

                        <button className="add-supply-button"
                            onClick={() => setShowAddSupplyModal(true)}
                        >
                        + Add Supply & Materials
                        </button>
                    </div>
                </div>

                <div className="supply-content">
                    <DataTable
                        columns={columns}
                        data={filteredSupplies}
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

            {showViewSupplyModal && selectedSupply && (
                <ViewSupplyModal
                    supply={selectedSupply}
                    onClose={() => setShowViewSupplyModal(false)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showAddSupplyModal && (
                <AddSupplyModal 
                    onClose={() => setShowAddSupplyModal(false)} 
                    onSubmit={(newSupply) => {
                        setShowAddSupplyModal(false);
                        fetchSupplies();
                    }}
                />
            )}

            {showEditSupplyModal && selectedSupply && (
                <EditSupplyModal
                    supply={selectedSupply}
                    onClose={() => setShowEditSupplyModal(false)}
                    onUpdate={() => {
                        setSelectedSupply(null);
                        fetchSupplies();
                    }}
                />
            )}

            {showAddSupplyModal && (
                <AddSupplyModal 
                    onClose={() => setShowAddSupplyModal(false)} 
                    onSubmit={(newSupply) => {
                        setShowAddSupplyModal(false);
                        fetchSupplies();
                    }}
                />
            )}

            {showAddSuppliesLogsModal && (
                <AddSuppliesLogsModal
                    onClose={() => setShowAddSuppliesLogsModal(false)}
                    onSubmit={(formData) => {
                        // Save new restock record to localStorage
                        const existingRecords = JSON.parse(localStorage.getItem("newSuppliesRestockRecords") || "[]");
                        const newRecord = {
                            id: Date.now(), // unique id based on timestamp
                            supplies: formData.supplies,
                            quantity: Number(formData.quantity),
                            unit: formData.unit,
                            batchDate: formData.batchDate,
                            restockDate: formData.restockDate,
                            loggedBy: formData.loggedBy,
                            status: formData.status,
                            notes: formData.notes || ""
                        };
                        localStorage.setItem("newSuppliesRestockRecords", JSON.stringify([...existingRecords, newRecord]));
                        setShowAddSuppliesLogsModal(false);
                        toast.success("Supplies restock record added successfully!");
                    }}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default Supplies;
