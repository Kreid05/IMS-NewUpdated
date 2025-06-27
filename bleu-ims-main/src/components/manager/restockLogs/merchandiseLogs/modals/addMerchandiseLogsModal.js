import React, { useState } from "react";
import "./addMerchandiseLogsModal.css";
import { toast } from 'react-toastify';
import ConfirmationMerchandiseLogsModal from "./confirmationMerchandiseLogsModal";

const API_BASE_URL = "http://127.0.0.1:8004";

function AddMerchandiseLogsModal({ onClose, onSubmit, currentMerchandise }) {
    const emptyFormData = {
        quantity: "",
        unit: "",
        batchDate: "",
        restockDate: "",
        loggedBy: "",
        notes: ""
    };

    const [formData, setFormData] = useState(emptyFormData);

    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFocus = (field) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.quantity) newErrors.quantity = "Quantity is required";
        if (!formData.unit) newErrors.unit = "Unit is required";
        if (!formData.batchDate) newErrors.batchDate = "Batch Date is required";
        if (!formData.loggedBy) newErrors.loggedBy = "Logged By is required";
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {

        const payload = {
            merchandise_id: currentMerchandise?.MerchandiseID,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            batch_date: formData.batchDate,
            logged_by: formData.loggedBy,
            notes: formData.notes
        };

        try {
            const response = await fetch(`${API_BASE_URL}/merchandise-batches/merchandise-batches/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Failed to restock merchandise");
            }

            toast.success("Merchandise restocked successfully!");
            setShowConfirmation(false);
            setFormData(emptyFormData);
            onSubmit(); // refresh
        } catch (error) {
            console.error("POST error:", error);
            toast.error("Failed to restock merchandise.");
        }
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            {!showConfirmation && (
                <div className="addMerchandiseLogs-modal-overlay">
                    <div className="addMerchandiseLogs-modal-content">
                        <div className="addMerchandiseLogs-modal-header">
                            <h3>Add Merchandise Restock Record</h3>
                            <span className="addMerchandiseLogs-modal-close-button" onClick={() => { onClose(); setFormData(emptyFormData); }}>×</span>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="addMerchandiseLogs-form-row">
                                <div className="addMerchandiseLogs-form-group">
                                    <label>
                                        Quantity: <span className="addMerchandiseLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("quantity")}
                                        className={errors.quantity ? "error" : ""}
                                    />
                                    {errors.quantity && <p className="addMerchandiseLogs-error-message">{errors.quantity}</p>}
                                </div>
                                <div className="addMerchandiseLogs-form-group">
                                    <label>
                                        Unit: <span className="addMerchandiseLogs-required-asterisk">*</span>
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("unit")}
                                        className={errors.unit ? "error" : ""}
                                    >
                                        <option value="">Select Unit</option>
                                        <option value="pcs">pcs</option>
                                        <option value="pack">pack</option>
                                        <option value="box">box</option>
                                    </select>
                                    {errors.unit && <p className="addMerchandiseLogs-error-message">{errors.unit}</p>}
                                </div>
                            </div>

                            <div className="addMerchandiseLogs-form-row">
                                <div className="addMerchandiseLogs-form-group">
                                    <label>
                                        Batch Date: <span className="addMerchandiseLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="batchDate"
                                        value={formData.batchDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("batchDate")}
                                        className={errors.batchDate ? "error" : ""}
                                    />
                                    {errors.batchDate && <p className="addMerchandiseLogs-error-message">{errors.batchDate}</p>}
                                </div>
                            </div>

                            <div className="addMerchandiseLogs-form-row">
                                <div className="addMerchandiseLogs-form-group">
                                    <label>
                                        Logged By: <span className="addMerchandiseLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="loggedBy"
                                        value={formData.loggedBy}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("loggedBy")}
                                        className={errors.loggedBy ? "error" : ""}
                                    />
                                    {errors.loggedBy && <p className="addMerchandiseLogs-error-message">{errors.loggedBy}</p>}
                                </div>
                            </div>

                            <div className="addMerchandiseLogs-form-row">
                                <div className="addMerchandiseLogs-form-group" style={{ flex: 1 }}>
                                    <label>Notes:</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="addMerchandiseLogs-modal-buttons">
                                <button type="submit">Add Merchandise Restock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationMerchandiseLogsModal
                visible={showConfirmation}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                formData={formData}
            />
        </>
    );
}

export default AddMerchandiseLogsModal;