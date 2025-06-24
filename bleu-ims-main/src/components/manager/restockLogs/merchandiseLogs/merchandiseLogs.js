import React, { useState } from "react";
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from "react-data-table-component";
import AddMerchandiseModal from './modals/addMerchandiseLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./merchandiseLogs.css";

const sampleMerchandiseRecords = [
    {
        id: 1,
        Merchandise: "Tumbler",
        Quantity: 10,
        Unit: "pcs",
        BatchDate: "2024-05-20",
        RestockDate: "2024-06-01",
        LoggedBy: "John Doe",
        Status: "Available",
        Notes: "New batch"
    },
    {
        id: 2,
        Merchandise: "Notebook",
        Quantity: 5,
        Unit: "pcs",
        BatchDate: "2024-05-22",
        RestockDate: "2024-06-03",
        LoggedBy: "Jane Smith",
        Status: "Low Stock",
        Notes: "Super New Batch"
    }
];

function MerchandiseLogs() {
    const [merchandiseRecords, setMerchandiseRecords] = useState(sampleMerchandiseRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddMerchandiseModal, setShowAddMerchandiseModal] = useState(false);
    const [tempFormData, setTempFormData] = useState(null);

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

    const capitalizeWords = (str) => {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    const handleAddMerchandiseSubmit = (formData) => {
        setMerchandiseRecords(prevRecords => [
            ...prevRecords,
            {
                id: prevRecords.length > 0 ? prevRecords[prevRecords.length - 1].id + 1 : 1,
                Merchandise: formData.merchandise,
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
        setShowAddMerchandiseModal(false);
        toast.success("Merchandise restock record added successfully!");
    };

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
                        <button className="add-merchandise-logs-button" onClick={() => { setTempFormData(null); setShowAddMerchandiseModal(true); }}>
                            + Add Restock Record
                        </button>
                    </div>
                </div>
                <div className="merchandise-logs-content">

                    <DataTable
                        columns={[
                            { name: "Merchandise", selector: row => row.Merchandise, sortable: true, width: "12%" },
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
                                else if (row.Status === "Low Stock") className = "status-low-stock";
                                else if (row.Status === "Not Available") className = "status-not-available";
                                else className = ""; // fallback style if needed

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
                    onSubmit={handleAddMerchandiseSubmit}
                    initialFormData={tempFormData}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default MerchandiseLogs;
