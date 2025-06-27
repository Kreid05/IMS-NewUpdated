import React, { useState, useEffect } from "react";
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from "react-data-table-component";
import AddSuppliesModal from './modals/addSuppliesLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./suppliesLogs.css";

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

const API_BASE_URL = "http://127.0.0.1:8003";

function SuppliesLogs() {
    const [suppliesRecords, setSuppliesRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddSuppliesModal, setShowAddSuppliesModal] = useState(false);

    const getAuthToken = () => localStorage.getItem("authToken");

    useEffect(() => {
        const fetchMaterialBatches = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/material-batches/material-batches/`, {
                    headers: {
                        "Authorization": `Bearer ${getAuthToken()}`,
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch material batches");
                }
                const data = await response.json();

                const mapped = data.map(batch => ({
                    id: batch.batch_id,
                    Material: batch.material_name,
                    Quantity: batch.quantity,
                    Unit: batch.unit,
                    BatchDate: batch.batch_date,
                    RestockDate: formatDateTime (batch.restock_date),
                    LoggedBy: batch.logged_by,
                    Status: batch.status,
                    Notes: batch.notes || ""
                }));

                setSuppliesRecords(mapped);
            } catch (error) {
                console.error("Error fetching material batches:", error);
                toast.error("Failed to load material batches.");
            }
        };

        fetchMaterialBatches();
    }, []);

    const filteredSortedSupplies = suppliesRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                (item.Material || "").toLowerCase().includes(query) ||
                (item.Status || "").toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.RestockDate);
            const dateB = new Date(b.RestockDate);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    return (
        <div className="supplies-logs">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Supplies Restock Logs" />
                <div className="supplies-logs-header">
                    <div className="supplies-logs-bottom-row">
                        <input
                            type="text"
                            className="supplies-logs-search-box"
                            placeholder="Search Supplies..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="sort-supplies-logs-container">
                            <label htmlFor="sort-supplies">Sort by Restock Date:</label>
                            <select
                                id="sort-supplies"
                                className="sort-supplies-logs-select"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="desc">Newest</option>
                                <option value="asc">Oldest</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="supplies-logs-content">

                    <DataTable
                        columns={[
                            { name: "Name", selector: row => row.Material, sortable: true, width: "10%" },
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
                                else if (row.Status === "Used") className = "status-used";
                                return <span className={className}>{row.Status}</span>;
                            }
                            },
                            { name: "Notes", selector: row => row.Notes, width: "23%", center: true },
                        ]}
                        data={filteredSortedSupplies}
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

            {showAddSuppliesModal && (
                <AddSuppliesModal
                    onClose={() => setShowAddSuppliesModal(false)}
                    onSubmit={() => {}}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default SuppliesLogs;