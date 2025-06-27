import React, { useEffect, useState } from 'react';
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from 'react-data-table-component';
import AddIngredientModal from './modals/addIngredientLogsModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ingredientsLogs.css";

// Helper function to format date to "YYYY-MM-DD HH:MM"
function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

const API_BASE_URL = "http://127.0.0.1:8002";

function IngredientsLogs() {
    const [ingredientRecords, setIngredientRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);

    const getAuthToken = () => localStorage.getItem("authToken");

    useEffect(() => {
        const fetchIngredientBatches = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ingredient-batches/ingredient-batches/`, {
                    headers: {
                        "Authorization": `Bearer ${getAuthToken()}`,
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch ingredient batches");
                }
                const data = await response.json();

                const mapped = data.map(batch => ({
                    id: batch.batch_id,
                    Ingredient: batch.ingredient_name, 
                    Quantity: batch.quantity,
                    Unit: batch.unit,
                    BatchDate: batch.batch_date,
                    RestockDate: formatDateTime(batch.restock_date),
                    ExpirationDate: batch.expiration_date,
                    LoggedBy: batch.logged_by,
                    Status: batch.status,
                    Notes: batch.notes || ""
                }));

                setIngredientRecords(mapped);
            } catch (error) {
                console.error("Error fetching ingredient batches:", error);
                toast.error("Failed to load ingredient batches.");
            }
        };

        fetchIngredientBatches();
    }, []);

    const filteredSortedIngredients = ingredientRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item.Ingredient.toLowerCase().includes(query) ||
                item.Status.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.RestockDate);
            const dateB = new Date(b.RestockDate);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    return (
        <div className="ingredients-logs">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Ingredients Restock Logs" />
                <div className="ingredients-logs-header">
                    <div className="ingredients-logs-bottom-row">
                        <input
                            type="text"
                            className="ingredients-logs-search-box"
                            placeholder="Search Ingredient..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="sort-ingredients-logs-container">
                            <label htmlFor="sort-ingredients">Sort by Restock Date:</label>
                            <select
                                id="sort-ingredients"
                                className="sort-ingredients-logs-select"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="desc">Newest</option>
                                <option value="asc">Oldest</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="ingredients-logs-content">
                    <DataTable
                        columns={[
                            { name: "Name", selector: row => row.Ingredient, sortable: true, width: "10%" },
                            { name: "Amount", selector: row => row.Quantity, width: "8%", center: true },
                            { name: "Unit", selector: row => row.Unit, width: "8%", center: true },
                            { name: "Batch Date", selector: row => row.BatchDate, width: "12%", center: true },
                            { name: "Restock Date", selector: row => row.RestockDate, width: "12%", center: true },
                            { name: "Expiration Date", selector: row => row.ExpirationDate, width: "12%", center: true },
                            { name: "Logged By", selector: row => row.LoggedBy, width: "10%", center: true },
                            {
                                name: "Status",
                                selector: row => row.Status,
                                width: "8%",
                                center: true,
                                cell: (row) => {
                                    let className = "";
                                    if (row.Status === "Available") className = "status-available";
                                    else if (row.Status === "Used") className = "status-used";
                                    else if (row.Status === "Expired") className = "status-expired";
                                    return <span className={className}>{row.Status}</span>;
                                }
                            },
                            { name: "Notes", selector: row => row.Notes, width: "20%", center: true },
                        ]}
                        data={filteredSortedIngredients}
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

            {showAddIngredientModal && (
                <AddIngredientModal
                    onClose={() => setShowAddIngredientModal(false)}
                    onSubmit={() => {}}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default IngredientsLogs;