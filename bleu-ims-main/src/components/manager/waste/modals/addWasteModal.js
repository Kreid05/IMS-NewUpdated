import React, { useState, useEffect } from "react";
import "./addWasteModal.css";
import { toast } from 'react-toastify';
import ConfirmationModal from "./confirmationWasteModal";

function AddWasteModal({ onClose, onSubmit, }) {
    const [formData, setFormData] = useState({
        ItemType: '',
        ItemID: '',
        Amount: '',
        Unit: '',
        Reason: '',
        LoggedBy: '',
        Notes: ''
    });

    const [itemOptions, setItemOptions] = useState([]); 
    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [preparedData, setPreparedData] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            const rawType = formData.ItemType.toLowerCase();
            if (!rawType) return;

            const token = localStorage.getItem("authToken");
            let endpoint = "";

            if (rawType === "ingredients" || rawType === "ingredient") {
                endpoint = "http://127.0.0.1:8002/ingredients/ingredients/";
            } else if (rawType === "materials" || rawType === "material") {
                endpoint = "http://127.0.0.1:8003/materials/materials/";
            } else if (rawType === "merchandise") {
                endpoint = "http://127.0.0.1:8004/merchandise/merchandise/";
            } else {
                return;
            }

            try {
                const res = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const formatted = data.map(item => ({
                    id: item.IngredientID || item.MaterialID || item.MerchandiseID || item.ingredient_id || item.material_id || item.merchandise_id,
                    name: item.IngredientName || item.MaterialName || item.MerchandiseName || item.ingredient_name || item.material_name || item.merchandise_name
                }));
                setItemOptions(formatted);
            } catch (error) {
                console.error("Failed to fetch items:", error);
            }
        };

        fetchItems();
    }, [formData.ItemType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFocus = (field) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.ItemType) newErrors.ItemType = "Item Type is required";
        if (!formData.ItemID) newErrors.ItemID = "Item is required";
        if (!formData.Amount) newErrors.Amount = "Amount is required";
        if (!formData.Unit) newErrors.Unit = "Unit is required";
        if (!formData.Reason) newErrors.Reason = "Reason is required";
        if (!formData.LoggedBy) newErrors.LoggedBy = "Logged By is required";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Prepare data for confirmation modal
        const prepared = [{
            ItemType: formData.ItemType,
            ItemName: itemOptions.find(i => i.id === parseInt(formData.ItemID))?.name || '',
            BatchNo: '—', // BatchNo is not available yet
            Amount: formData.Amount,
            Unit: formData.Unit,
            Reason: formData.Reason,
            Date: new Date().toLocaleDateString(),
            LoggedBy: formData.LoggedBy,
            Notes: formData.Notes || ''
        }];

        setPreparedData(prepared);
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch("http://127.0.0.1:8006/wastelogs/wastelogs/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            body: JSON.stringify({
                    item_type: formData.ItemType.toLowerCase() === "ingredients" ? "ingredient" :
                               formData.ItemType.toLowerCase() === "materials" ? "material" :
                               formData.ItemType.toLowerCase() === "merchandise" ? "merchandise" : formData.ItemType.toLowerCase(),
                    item_id: parseInt(formData.ItemID),
                    amount: parseFloat(formData.Amount),
                    unit: formData.Unit,
                    waste_reason: formData.Reason,
                    logged_by: formData.LoggedBy,
                    notes: formData.Notes
                })
            });

            if (!res.ok) throw new Error("Failed to add waste record");

            const result = await res.json();
            const finalLogs = result.map(log => ({
                ItemType: formData.ItemType,
                ItemName: itemOptions.find(i => i.id === parseInt(formData.ItemID))?.name || '',
                BatchNo: log.BatchID ? `Batch ${log.BatchID}` : '—',
                Amount: log.Amount,
                Unit: log.Unit,
                Reason: log.WasteReason,
                Date: new Date(log.WasteDate).toLocaleDateString(),
                LoggedBy: log.LoggedBy,
                Notes: log.Notes || ''
            }));

            onSubmit(finalLogs);
            toast.success("Waste record added!");
            setShowConfirmation(false);
            setPreparedData(null);
            setFormData({
                ItemType: '',
                ItemID: '',
                Amount: '',
                Unit: '',
                WasteReason: '',
                LoggedBy: '',
                Notes: ''
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to add waste.");
        }
    };

    const handleCancel = () => {
        setShowConfirmation(false);
        setPreparedData(null);
    };


    return (
        <>
        {!showConfirmation && (
            <div className="addWaste-modal-overlay">
                <div className="addWaste-modal-content">
                    <div className="addWaste-modal-header">
                        <h3>Add Waste Record</h3>
                        <span className="addWaste-modal-close-button" onClick={onClose}>×</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group">
                                <label>
                                    Item Type: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <select
                                    name="ItemType"
                                    value={formData.ItemType}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus("ItemType")}
                                    className={errors.ItemType ? "error" : ""}
                                >
                                    <option value="">Select Item Type</option>
                                    <option value="Ingredients">Ingredients</option>
                                    <option value="Materials">Materials</option>
                                    <option value="Merchandise">Merchandise</option>
                                </select>
                                {errors.ItemType && <p className="addWaste-error-message">{errors.ItemType}</p>}
                            </div>
                            <div className="addWaste-form-group">
                                <label>
                                    Item Name: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <select
                                    name="ItemID"
                                    value={formData.ItemID}
                                    onChange={handleChange}
                                    className={errors.ItemID ? "error" : ""}
                                >
                                    <option value="">Select Item</option>
                                    {itemOptions.map(option => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.ItemID && <p className="addWaste-error-message">{errors.ItemID}</p>}
                            </div>
                        </div>

                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group">
                                <label>
                                    Amount: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="Amount"
                                    value={formData.Amount}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus("Amount")}
                                    className={errors.Amount ? "error" : ""}
                                />
                                {errors.Amount && <p className="addWaste-error-message">{errors.Amount}</p>}
                            </div>
                            <div className="addWaste-form-group">
                                <label>
                                    Unit: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <select
                                    name="Unit"
                                    value={formData.Unit}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus("Unit")}
                                    className={errors.Unit ? "error" : ""}
                                >
                                    <option value="">Select Unit</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="pcs">pcs</option>
                                </select>
                                {errors.Unit && <p className="addWaste-error-message">{errors.Unit}</p>}
                            </div>
                        </div>

                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group">
                                <label>
                                    Reason: <span className="addWaste-required-asterisk">*</span>
                                </label>
                            <select
                                name="Reason"
                                value={formData.Reason}
                                onChange={handleChange}
                                onFocus={() => handleFocus("Reason")}
                                className={errors.Reason ? "error" : ""}
                            >
                                <option value="">Select Reason</option>
                                <option value="Expired">Expired</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Spillage">Spillage</option>
                                <option value="Other">Other</option>
                            </select>
                                {errors.Reason && <p className="addWaste-error-message">{errors.Reason}</p>}
                            </div>
                            <div className="addWaste-form-group">
                                <label>
                                    Logged By: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="LoggedBy"
                                    value={formData.LoggedBy}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus("LoggedBy")}
                                    className={errors.LoggedBy ? "error" : ""}
                                />
                                {errors.LoggedBy && <p className="addWaste-error-message">{errors.LoggedBy}</p>}
                            </div>
                        </div>

                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group" style={{ flex: 1 }}>
                                <label>Notes:</label>
                                <textarea
                                    name="Notes"
                                    value={formData.Notes}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                    <div className="addWaste-modal-buttons">
                        <button type="addWaste-submit-button">Add Waste Record</button>
                    </div>
                </form>
            </div>
        </div>
        )}
        <ConfirmationModal
            visible={showConfirmation}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            formData={preparedData}
        />
        </>
    );
}

export default AddWasteModal;