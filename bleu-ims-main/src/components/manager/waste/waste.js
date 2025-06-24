import React, { useState } from "react";
import Sidebar from "../../sidebar";
import Header from "../../header";
import DataTable from "react-data-table-component";
import AddWasteModal from './modals/addWasteModal';
import ConfirmationModal from './modals/confirmationWasteModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./waste.css";

const sampleWasteRecords = [
    {
        id: 1,
        ItemType: "Ingredient",
        ItemName: "Tomato",
        BatchNo: "1",
        Amount: 10,
        Unit: "kg",
        Reason: "Spoiled",
        Date: "2024-06-01",
        LoggedBy: "John Doe",
        Notes: "Left out in sun"
    },
    {
        id: 2,
        ItemType: "Merchandise",
        ItemName: "T-shirt",
        BatchNo: "2",
        Amount: 5,
        Unit: "pcs",
        Reason: "Damaged",
        Date: "2024-06-02",
        LoggedBy: "Jane Smith",
        Notes: "Torn sleeves"
    }
];

function Waste() {
    const [wasteRecords, setWasteRecords] = useState(sampleWasteRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddWasteModal, setShowAddWasteModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [tempFormData, setTempFormData] = useState(null);
    const [selectedWaste, setSelectedWaste] = useState(null);

    const filteredSortedWaste = wasteRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item.ItemType.toLowerCase().includes(query) ||
                item.ItemName.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.Date);
            const dateB = new Date(b.Date);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    const handleAddWasteSubmit = (formData) => {
        setTempFormData(formData);
        setShowAddWasteModal(false);
        setShowConfirmationModal(true);
    };

    const handleConfirm = () => {
        setWasteRecords(prev => [...prev, { id: prev.length + 1, ...tempFormData }]);
        setTempFormData(null);
        setShowConfirmationModal(false);
        toast.success("Waste record added successfully!");
    };

    const handleCancelConfirmation = () => {
        setShowConfirmationModal(false);
        setShowAddWasteModal(true);
    };

    return (
        <div className="waste">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Waste Management" />
                <div className="waste-header">
                    <div className="waste-bottom-row">
                        <input
                            type="text"
                            className="waste-search-box"
                            placeholder="Search Item Type or Item Name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="sort-waste-container">
                            <label htmlFor="sort-waste">Sort by Date:</label>
                            <select
                                id="sort-waste"
                                className="sort-waste-select"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="desc">Newest</option>
                                <option value="asc">Oldest</option>
                            </select>
                        </div>
                        <button className="add-waste-button" onClick={() => setShowAddWasteModal(true)}>
                            + Add Waste Record
                        </button>
                    </div>
                </div>
                <div className="waste-content">
                    <DataTable
                        columns={[
                            { name: "Item Type", selector: row => row.ItemType, sortable: true, width: "12%" },
                            { name: "Item Name", selector: row => row.ItemName, sortable: true, width: "12%" },
                            { name: "Batch No.", selector: row => row.BatchNo, width: "10%", center: true },
                            { name: "Amount", selector: row => row.Amount, width: "8%", center: true },
                            { name: "Unit", selector: row => row.Unit, width: "10%", center: true },
                            { name: "Reason", selector: row => row.Reason, width: "10%", center: true },
                            { name: "Date", selector: row => row.Date, width: "8%", center: true },
                            { name: "Logged By", selector: row => row.LoggedBy, width: "10%", center: true },
                            { name: "Notes", selector: row => row.Notes, width: "20%", center: true },
                        ]}
                        data={filteredSortedWaste}
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

            {showAddWasteModal && (
                <AddWasteModal
                    onClose={() => setShowAddWasteModal(false)}
                    onSubmit={handleAddWasteSubmit}
                    initialFormData={tempFormData}
                />
            )}

            {showConfirmationModal && (
                <ConfirmationModal
                    visible={showConfirmationModal}
                    formData={tempFormData}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelConfirmation}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default Waste;
