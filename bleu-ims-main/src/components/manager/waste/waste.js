import React, { useState, useEffect } from "react";
import Sidebar from "../../sidebar";
import Header from "../../header";
import DataTable from "react-data-table-component";
import AddWasteModal from './modals/addWasteModal';
import ConfirmationModal from './modals/confirmationWasteModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./waste.css";

function Waste() {
    const [wasteRecords, setWasteRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddWasteModal, setShowAddWasteModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [tempFormList, setTempFormList] = useState(null);
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
    
    useEffect(() => {
        const fetchWasteData = async () => {
            try {
                const token = localStorage.getItem("authToken");

                // urls
                const WASTE_URL = "http://127.0.0.1:8006/wastelogs/wastelogs/";
                const ING_URL = "http://127.0.0.1:8002/ingredients/ingredients/";
                const ING_BATCH_URL = "http://127.0.0.1:8002/ingredient-batches/ingredient-batches/";
                const MAT_URL = "http://127.0.0.1:8003/materials/materials/";
                const MAT_BATCH_URL = "http://127.0.0.1:8003/material-batches/material-batches/";
                const MERCH_URL = "http://127.0.0.1:8004/merchandise/merchandise/";
                const MERCH_BATCH_URL = "http://127.0.0.1:8004/merchandise-batches/merchandise-batches/";

                const headers = { Authorization: `Bearer ${token}` };

                // fetch all data in parallel
                const [
                    wasteRes, ingRes, ingBatchRes,
                    matRes, matBatchRes,
                    merchRes, merchBatchRes
                ] = await Promise.all([
                    fetch(WASTE_URL, { headers }),
                    fetch(ING_URL, { headers }),
                    fetch(ING_BATCH_URL, { headers }),
                    fetch(MAT_URL, { headers }),
                    fetch(MAT_BATCH_URL, { headers }),
                    fetch(MERCH_URL, { headers }),
                    fetch(MERCH_BATCH_URL, { headers }),
                ]);

                if (
                    !wasteRes.ok || !ingRes.ok || !ingBatchRes.ok ||
                    !matRes.ok || !matBatchRes.ok ||
                    !merchRes.ok || !merchBatchRes.ok
                ) {
                    throw new Error("Failed to fetch data");
                }

                const [
                    wastes, ingredients, ingBatches,
                    materials, matBatches,
                    merchandise, merchBatches
                ] = await Promise.all([
                    wasteRes.json(), ingRes.json(), ingBatchRes.json(),
                    matRes.json(), matBatchRes.json(),
                    merchRes.json(), merchBatchRes.json()
                ]);

                // build maps
                const ingredientMap = Object.fromEntries(
                    ingredients.map(item => [item.IngredientID || item.ingredient_id, item.IngredientName || item.ingredient_name])
                );
                const materialMap = Object.fromEntries(
                    materials.map(item => [item.MaterialID || item.material_id, item.MaterialName || item.material_name])
                );
                const merchandiseMap = Object.fromEntries(
                    merchandise.map(item => [item.MerchandiseID || item.merchandise_id, item.MerchandiseName || item.merchandise_name])
                );

                // batch number (FIFO)
                const ingBatchMap = Object.fromEntries(
                    [...ingBatches]
                        .sort((a, b) => new Date(a.RestockDate || a.restock_date) - new Date(b.RestockDate || b.restock_date))
                        .map((batch, index) => [(batch.BatchID || batch.batch_id), `Batch ${index + 1}`])
                );

                const matBatchMap = Object.fromEntries(
                    [...matBatches]
                        .sort((a, b) => new Date(a.RestockDate || a.restock_date) - new Date(b.RestockDate || b.restock_date))
                        .map((batch, index) => [(batch.BatchID || batch.batch_id), `Batch ${index + 1}`])
                );

                const merchBatchMap = Object.fromEntries(
                    [...merchBatches]
                        .sort((a, b) => new Date(a.RestockDate || a.restock_date) - new Date(b.RestockDate || b.restock_date))
                        .map((batch, index) => [(batch.BatchID || batch.batch_id), `Batch ${index + 1}`])
                );

                const mapped = wastes.map(log => {
                    const type = log.ItemType.toLowerCase();
                    const batchId = log.BatchID || log.batch_id;
                    const itemId = log.ItemID || log.item_id;

                    let itemName = "Not Found";
                    let batchLabel = "-";

                    if (type === "ingredient") {
                        itemName = ingredientMap[itemId] || "Ingredient Not Found";
                        batchLabel = ingBatchMap[batchId] || "Batch Not Found";
                    } else if (type === "material") {
                        itemName = materialMap[itemId] || "Material Not Found";
                        batchLabel = matBatchMap[batchId] || "Batch Not Found";
                    } else if (type === "merchandise") {
                        itemName = merchandiseMap[itemId] || "Merchandise Not Found";
                        batchLabel = merchBatchMap[batchId] || "Batch Not Found";
                    }

                    return {
                        ItemType: log.ItemType.charAt(0).toUpperCase() + log.ItemType.slice(1),
                        ItemName: itemName,
                        BatchNo: batchLabel,
                        Amount: log.Amount,
                        Unit: log.Unit,
                        Reason: log.WasteReason,
                        Date: new Date(log.WasteDate).toLocaleDateString(),
                        LoggedBy: log.LoggedBy,
                        Notes: log.Notes || ""
                    };
                });
                setWasteRecords(mapped);
            } catch (error) {
                console.error("Error loading waste logs:", error);
                toast.error("Failed to load waste records.");
            }
        };


        fetchWasteData();
    }, []);

    const handleAddWasteSubmit = (logsArray) => {
        setWasteRecords(prevRecords => [...logsArray, ...prevRecords]);
        setShowAddWasteModal(false);
        // Remove or comment out showing confirmation modal as it's handled in addWasteModal
        // setShowConfirmationModal(true);
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
                    initialFormData={tempFormList}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default Waste;