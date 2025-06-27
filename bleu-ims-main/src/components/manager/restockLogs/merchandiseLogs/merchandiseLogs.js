import React, { useState, useEffect } from "react";
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from "react-data-table-component";
import AddMerchandiseModal from './modals/addMerchandiseLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./merchandiseLogs.css";

const API_BASE_URL = "http://127.0.0.1:8004";

function MerchandiseLogs() {
    const [merchandiseRecords, setMerchandiseRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddMerchandiseModal, setShowAddMerchandiseModal] = useState(false);

    const getAuthToken = () => localStorage.getItem("authToken");

    useEffect(() => {
        const fetchMerchandiseBatches = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/merchandise-batches/merchandise-batches/`, {
                    headers: {
                        "Authorization": `Bearer ${getAuthToken()}`,
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch merchandise batches");
                }
                const data = await response.json();

                const mapped = data.map(batch => ({
                    id: batch.batch_id,
                    Merchandise: batch.merchandise_name, 
                    Quantity: batch.quantity,
                    Unit: batch.unit,
                    BatchDate: batch.batch_date,
                    RestockDate: batch.restock_date,
                    LoggedBy: batch.logged_by,
                    Status: batch.status,
                    Notes: batch.notes || ""
                }));

                setMerchandiseRecords(mapped);
            } catch (error) {
                console.error("Error fetching merchandise batches:", error);
                toast.error("Failed to load merchandise batches.");
            }
        };

        fetchMerchandiseBatches();
    }, []);

    const filteredSortedMerchandise = merchandiseRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item.Merchandise.toLowerCase().includes(query) ||
                item.Status.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.RestockDate);
            const dateB = new Date(b.RestockDate);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    return (
        <div className="merchandise-logs">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Merchandise Restock Logs" />
                <div className="merchandise-logs-header">
                    <div className="merchandise-logs-bottom-row">
                        <input
                            type="text"
                            className="merchandise-logs-search-box"
                            placeholder="Search Merchandise..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="sort-merchandise-logs-container">
                            <label htmlFor="sort-merchandise">Sort by Restock Date:</label>
                            <select
                                id="sort-merchandise"
                                className="sort-merchandise-logs-select"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="desc">Newest</option>
                                <option value="asc">Oldest</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="merchandise-logs-content">

                    <DataTable
                        columns={[
                            { name: "Name", selector: row => row.Merchandise, sortable: true, width: "12%" },
                            { name: "Quantity", selector: row => row.Quantity, width: "8%", center: true },
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

            {showAddMerchandiseModal && (
                <AddMerchandiseModal
                    onClose={() => setShowAddMerchandiseModal(false)}
                    onSubmit={() => {}}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default MerchandiseLogs;