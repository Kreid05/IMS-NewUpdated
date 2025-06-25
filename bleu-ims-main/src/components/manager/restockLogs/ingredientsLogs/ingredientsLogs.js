import React, { useState, useEffect } from "react";
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from "react-data-table-component";
import AddIngredientModal from './modals/addIngredientLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ingredientsLogs.css";

const sampleIngredientRecords = [
    {
        id: 1,
        Ingredient: "Tomato",
        Quantity: 10,
        Unit: "kg",
        BatchDate: "2024-05-20",
        RestockDate: "2024-06-01",
        LoggedBy: "John Doe",
        Status: "Available",
        Notes: "Fresh batch"
    },
    {
        id: 2,
        Ingredient: "Onion",
        Quantity: 5,
        Unit: "kg",
        BatchDate: "2024-05-22",
        RestockDate: "2024-06-03",
        LoggedBy: "Jane Smith",
        Status: "Low Stock",
        Notes: "Awaiting quality check"
    }
];

function IngredientsLogs() {
    const [ingredientRecords, setIngredientRecords] = useState(sampleIngredientRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [tempFormData, setTempFormData] = useState(null);

    useEffect(() => {
        // On mount, read new restock records from localStorage and merge
        const newRecordsRaw = JSON.parse(localStorage.getItem("newIngredientRestockRecords") || "[]");
        if (newRecordsRaw.length > 0) {
            // Normalize keys to match expected keys in ingredientRecords
            const newRecords = newRecordsRaw.map(r => ({
                id: r.id,
                Ingredient: r.ingredient || r.Ingredient || "",
                Quantity: r.quantity || r.Quantity || 0,
                Unit: r.unit || r.Unit || "",
                BatchDate: r.batchDate || r.BatchDate || "",
                RestockDate: r.restockDate || r.RestockDate || "",
                LoggedBy: r.loggedBy || r.LoggedBy || "",
                Status: r.status || r.Status || "",
                Notes: r.notes || r.Notes || ""
            }));

            setIngredientRecords(prevRecords => {
                // Filter out duplicates by id if any
                const existingIds = new Set(prevRecords.map(r => r.id));
                const filteredNewRecords = newRecords.filter(r => !existingIds.has(r.id));
                return [...prevRecords, ...filteredNewRecords];
            });
            // Clear the new records from localStorage
            localStorage.removeItem("newIngredientRestockRecords");
        }
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

    const capitalizeWords = (str) => {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    const handleAddIngredientSubmit = (formData) => {
        setIngredientRecords(prevRecords => [
            ...prevRecords,
            {
                id: prevRecords.length > 0 ? prevRecords[prevRecords.length - 1].id + 1 : 1,
                Ingredient: formData.ingredient,
                Quantity: Number(formData.quantity),
                Unit: formData.unit,
                BatchDate: formData.batchDate,
                RestockDate: formData.restockDate,
                LoggedBy: formData.loggedBy,
                Status: capitalizeWords(formData.status),
                Notes: formData.notes || ""
            }
        ]);
        setTempFormData(formData);
        setShowAddIngredientModal(false);
        toast.success("Ingredient restock record added successfully!");
    };

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
                            { name: "Ingredient", selector: row => row.Ingredient, sortable: true, width: "10%" },
                            { name: "Quantity", selector: row => row.Quantity, width: "10%", center: true },
                            { name: "Unit", selector: row => row.Unit, width: "8%", center: true },
                            { name: "Batch Date", selector: row => row.BatchDate, width: "13%", center: true },
                            { name: "Restock Date", selector: row => row.RestockDate, width: "13%", center: true },
                            { name: "Logged By", selector: row => row.LoggedBy, width: "13%", center: true },
                            { 
                            name: "Status", 
                            selector: row => row.Status, 
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
                            { name: "Notes", selector: row => row.Notes, width: "23%", center: true },
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
                    onSubmit={handleAddIngredientSubmit}
                    initialFormData={tempFormData}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default IngredientsLogs;
