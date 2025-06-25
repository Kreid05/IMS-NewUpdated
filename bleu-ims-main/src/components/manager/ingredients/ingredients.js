import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./ingredients.css";
import Sidebar from "../../sidebar";
import { FaRedoAlt, FaEye, FaEdit, FaArchive } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddIngredientModal from './modals/addIngredientModal';
import EditIngredientModal from './modals/editIngredientModal';
import ViewIngredientModal from './modals/viewIngredientModal';
import AddIngredientLogsModal from '../restockLogs/ingredientsLogs/modals/addIngredientLogsModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; // Import
import "../../reactConfirmAlert.css";

const API_BASE_URL = "http://127.0.0.1:8002";
const getAuthToken = () => localStorage.getItem("authToken");
const DEFAULT_PROFILE_IMAGE = "https://media-hosting.imagekit.io/1123dd6cf5c544aa/screenshot_1746457481487.png?Expires=1841065483&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=kiHcXbHpirt9QHbMA4by~Kd4b2BrczywyVUfZZpks5ga3tnO8KlP8s5tdDpZQqinqOG30tGn0tgSCwVausjJ1OJ9~e6qPVjLXbglD-65hmsehYCZgEzeyGPPE-rOlyGJCgJC~GCZOu0jDKKcu2fefrClaqBBT3jaXoK4qhDPfjIFa2GCMfetybNs0RF8BtyKLgFGeEkvibaXhYxmzO8tksUKaLAMLbsPWvHBNuzV6Ar3mj~lllq7r7nrynNfdvbtuED7OGczSqZ8H-iopheAUhaWZftAh9tX2vYZCZZ8UztSEO3XUgLxMMtv9NnTei1omK00iJv1fgBjwR2lSqRk7w__";

function Ingredients() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('nameAsc');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ingredients, setIngredients] = useState([]);
    const navigate = useNavigate();
    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });

    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
    const [currentIngredient, setCurrentIngredient] = useState(null);
    const [showViewIngredientModal, setShowViewIngredientModal] = useState(false);
    const [showAddIngredientLogsModal, setShowAddIngredientLogsModal] = useState(false);

    // filtering and sorting data
    const filteredIngredients = ingredients
        .filter(ingredient => {
            const matchesSearch = ingredient.IngredientName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || ingredient.Status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortOrder === 'nameAsc') {
                return a.IngredientName.localeCompare(b.IngredientName);
            } else { 
                return b.IngredientName.localeCompare(a.IngredientName);
            }
        });

    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
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
    const fetchIngredients = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/ingredients/ingredients/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch ingredients: ${response.status} ${errorData}`);
            }

            const data = await response.json();
            setIngredients(data); // Set the raw data directly
        } catch (error) {
            console.error("Error fetching ingredients:", error);
            toast.error(`Session expired or unauthorized: ${error.message}. Please login again.`);
        }
    }, [handleLogout]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    const handleView = (ingredient) => {
        setCurrentIngredient(ingredient);
        setShowViewIngredientModal(true);
    };

    const handleEdit = (ingredient) => {
        setCurrentIngredient(ingredient);
        setShowEditIngredientModal(true);
    };

    const handleDelete = async (ingredientIdToDelete) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this ingredient?',
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
                            const response = await fetch(`${API_BASE_URL}/ingredients/ingredients/${ingredientIdToDelete}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.text();
                                throw new Error(errorData.detail || "Failed to delete ingredient.");
                            }
                            
                            toast.success("Ingredient deleted successfully.");
                            
                            // refetch data to ensure consistency
                            fetchIngredients();
                        } catch (error) {
                            console.error("Error deleting ingredient:", error);
                            toast.error(`Failed to delete ingredient: ${error.message}`);
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
        { name: "INGREDIENT NAME", selector: (row) => row.IngredientName, sortable: true, width: "15%" },
        { name: "AMOUNT", selector: (row) => row.Amount, width: "10%", center: true },
        { name: "UNIT", selector: (row) => row.Measurement, width: "10%", center: true },
        { name: "BEST BEFORE DATE", selector: (row) => row.BestBeforeDate, width: "15%", center: true },
        { name: "EXPIRATION DATE", selector: (row) => row.ExpirationDate, width: "15%", center: true },
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
                            <div className="tooltip-container">
                                <button className="action-button restock" onClick={() => setShowAddIngredientLogsModal(true)}><FaRedoAlt /></button>
                                <span className="tooltip-text">Restock</span>
                            </div>
                            <div className="tooltip-container">
                                <button className="action-button view" onClick={() => handleView(row)}><FaEye /></button>
                                <span className="tooltip-text">View</span>
                            </div>
                            <div className="tooltip-container">
                                <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                                <span className="tooltip-text">Edit</span>
                            </div>
                            <div className="tooltip-container">
                                <button className="action-button delete" onClick={() => handleDelete(row.IngredientID)}><FaArchive /></button>
                                <span className="tooltip-text">Delete</span>
                            </div>
                        </div>
                    ),
                    ignoreRowClick: true,
                    allowOverflow: true,
                    width: "20%",
                    center: true,
                },
    ];

    return (
        <div className="ingredients">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Ingredients" />

                <div className="ingredient-header">
                    <div className="ingredient-bottom-row">
                        <input
                            type="text"
                            className="ingredient-search-box"
                            placeholder="Search ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="filter-ingredient-container">
                            <label htmlFor="filter-ingredient">Filter by Status:</label>
                            <select 
                                id="filter-ingredient" 
                                className="filter-ingredient-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="Available">Available</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Not Available">Not Available</option>
                            </select>
                        </div>

                        <div className="sort-ingredient-container">
                            <label htmlFor="sort-ingredient">Sort by:</label>
                            <select 
                                id="sort-ingredient" 
                                className="sort-ingredient-select"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="nameAsc">Newest</option>
                                <option value="nameDesc">Oldest</option>
                            </select>
                        </div>

                        <button
                            className="add-ingredient-button"
                            onClick={() => setShowAddIngredientModal(true)}
                        >
                            + Add Ingredient
                        </button>
                    </div>
                </div>

                <div className="ingredient-content">
                    <DataTable
                        columns={columns}
                        data={filteredIngredients}
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

            {showViewIngredientModal && currentIngredient && (
                <ViewIngredientModal
                    ingredient={currentIngredient}
                    onClose={() => setShowViewIngredientModal(false)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showAddIngredientModal && (
                <AddIngredientModal 
                    onClose={() => setShowAddIngredientModal(false)} 
                    onSuccess={(newIngredient) => {
                        setShowAddIngredientModal(false);
                        fetchIngredients();
                    }}
                />
            )}

            {showEditIngredientModal && currentIngredient && (
                <EditIngredientModal
                    ingredient={currentIngredient}
                    onClose={() => setShowEditIngredientModal(false)}
                    onUpdate={() => {
                        setCurrentIngredient(null);
                        fetchIngredients();
                    }}
                />
            )}
            <ToastContainer />

            {showAddIngredientLogsModal && (
                <AddIngredientLogsModal
                    onClose={() => setShowAddIngredientLogsModal(false)}
                    onSubmit={(formData) => {
                        // Save new restock record to localStorage
                        const existingRecords = JSON.parse(localStorage.getItem("newIngredientRestockRecords") || "[]");
                        const newRecord = {
                            id: Date.now(), // unique id based on timestamp
                            ingredient: formData.ingredient,
                            quantity: Number(formData.quantity),
                            unit: formData.unit,
                            batchDate: formData.batchDate,
                            restockDate: formData.restockDate,
                            loggedBy: formData.loggedBy,
                            status: formData.status,
                            notes: formData.notes || ""
                        };
                        localStorage.setItem("newIngredientRestockRecords", JSON.stringify([...existingRecords, newRecord]));
                        setShowAddIngredientLogsModal(false);
                        toast.success("Ingredient restock record added successfully!");
                    }}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default Ingredients;