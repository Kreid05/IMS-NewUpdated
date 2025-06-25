import React, { useState, useEffect } from "react";
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from "react-data-table-component";
import AddSuppliesModal from './modals/addSuppliesLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./suppliesLogs.css";

const sampleSuppliesRecords = [
    {
        id: 1,
        Supplies: "Cups",
        Quantity: 50,
        Unit: "pcs",
        BatchDate: "2024-05-20",
        RestockDate: "2024-06-01",
        LoggedBy: "Lim Alcovendas",
        Status: "Available",
        Notes: "Newly made"
    },
    {
        id: 2,
        Supplies: "Straw",
        Quantity: 5,
        Unit: "pcs",
        BatchDate: "2024-05-22",
        RestockDate: "2024-06-03",
        LoggedBy: "Mark Regie Magtangob",
        Status: "Low Stock",
        Notes: "Awaiting quality check"
    },
    {
        id: 3,
        Supplies: "Spoons",
        Quantity: 0,
        Unit: "pcs",
        BatchDate: "2024-05-22",
        RestockDate: "2024-06-03",
        LoggedBy: "Jesalle Villegas",
        Status: "Not Available",
        Notes: "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    }
];

function SuppliesLogs() {
    const [suppliesRecords, setSuppliesRecords] = useState(sampleSuppliesRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddSuppliesModal, setShowAddSuppliesModal] = useState(false);
    const [tempFormData, setTempFormData] = useState(null);

    useEffect(() => {
        // On mount, read new restock records from localStorage and merge
        const newRecordsRaw = JSON.parse(localStorage.getItem("newSuppliesRestockRecords") || "[]");
        if (newRecordsRaw.length > 0) {
            // Normalize keys to match expected keys in suppliesRecords
            const newRecords = newRecordsRaw.map(r => ({
                id: r.id,
                Supplies: r.supplies || r.supplies || "",
                Quantity: r.quantity || r.Quantity || 0,
                Unit: r.unit || r.Unit || "",
                BatchDate: r.batchDate || r.BatchDate || "",
                RestockDate: r.restockDate || r.RestockDate || "",
                LoggedBy: r.loggedBy || r.LoggedBy || "",
                Status: r.status || r.Status || "",
                Notes: r.notes || r.Notes || ""
            }));

            setSuppliesRecords(prevRecords => {
                // Filter out duplicates by id if any
                const existingIds = new Set(prevRecords.map(r => r.id));
                const filteredNewRecords = newRecords.filter(r => !existingIds.has(r.id));
                return [...prevRecords, ...filteredNewRecords];
            });
            // Clear the new records from localStorage
            localStorage.removeItem("newSuppliesRestockRecords");
        }
    }, []);

    const filteredSortedSupplies = suppliesRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item.Supplies.toLowerCase().includes(query) ||
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

    const handleAddSuppliesSubmit = (formData) => {
        setSuppliesRecords(prevRecords => [
            ...prevRecords,
            {
                id: prevRecords.length > 0 ? prevRecords[prevRecords.length - 1].id + 1 : 1,
                Supplies: formData.supplies,
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
        setShowAddSuppliesModal(false);
        toast.success("Supplies restock record added successfully!");
    };

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
                            { name: "Supplies", selector: row => row.Supplies, sortable: true, width: "10%" },
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
                    onSubmit={handleAddSuppliesSubmit}
                    initialFormData={tempFormData}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default SuppliesLogs;
