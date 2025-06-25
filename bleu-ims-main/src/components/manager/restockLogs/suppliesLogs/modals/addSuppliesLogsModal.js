import React, { useState } from "react";
import "./addSuppliesLogsModal.css";
import { toast } from 'react-toastify';
import ConfirmationSuppliesLogsModal from "./confirmationSuppliesLogsModal";

function AddSuppliesLogsModal({ onClose, onSubmit, initialFormData }) {
    const emptyFormData = {
        quantity: "",
        unit: "",
        batchDate: "",
        restockDate: "",
        loggedBy: "",
        notes: ""
    };

    const [formData, setFormData] = useState(initialFormData || emptyFormData);

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
        if (!formData.restockDate) newErrors.restockDate = "Restock Date is required";
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

    const handleConfirm = () => {
        // Derive status based on quantity
        const quantityValue = Number(formData.quantity);
        let status = "Available";
        if (quantityValue > 10) {
            status = "Available";
        } else if (quantityValue === 0) {
            status = "Used";
        } else if (quantityValue > 0 && quantityValue <= 10) {
            status = "Used";
        }
        const formDataWithStatus = { ...formData, status };
        onSubmit(formDataWithStatus);
        setShowConfirmation(false);
        setFormData(emptyFormData);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            {!showConfirmation && (
                <div className="addSuppliesLogs-modal-overlay">
                    <div className="addSuppliesLogs-modal-content">
                        <div className="addSuppliesLogs-modal-header">
                            <h3>Add Supplies Restock Record</h3>
                            <span className="addSuppliesLogs-modal-close-button" onClick={() => { onClose(); setFormData(emptyFormData); }}>×</span>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="addSuppliesLogs-form-row">
                                <div className="addSuppliesLogs-form-group">
                                    <label>
                                        Quantity: <span className="addSuppliesLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("quantity")}
                                        className={errors.quantity ? "error" : ""}
                                    />
                                    {errors.quantity && <p className="addSuppliesLogs-error-message">{errors.quantity}</p>}
                                </div>
                                <div className="addSuppliesLogs-form-group">
                                    <label>
                                        Unit: <span className="addSuppliesLogs-required-asterisk">*</span>
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
                                    {errors.unit && <p className="addSuppliesLogs-error-message">{errors.unit}</p>}
                                </div>
                            </div>

                            <div className="addSuppliesLogs-form-row">
                                <div className="addSuppliesLogs-form-group">
                                    <label>
                                        Batch Date: <span className="addSuppliesLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="batchDate"
                                        value={formData.batchDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("batchDate")}
                                        className={errors.batchDate ? "error" : ""}
                                    />
                                    {errors.batchDate && <p className="addSuppliesLogs-error-message">{errors.batchDate}</p>}
                                </div>
                                <div className="addSuppliesLogs-form-group">
                                    <label>
                                        Restock Date: <span className="addSuppliesLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="restockDate"
                                        value={formData.restockDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("restockDate")}
                                        className={errors.restockDate ? "error" : ""}
                                    />
                                    {errors.restockDate && <p className="addSuppliesLogs-error-message">{errors.restockDate}</p>}
                                </div>
                            </div>

                            <div className="addSuppliesLogs-form-row">
                                <div className="addSuppliesLogs-form-group">
                                    <label>
                                        Logged By: <span className="addSuppliesLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="loggedBy"
                                        value={formData.loggedBy}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("loggedBy")}
                                        className={errors.loggedBy ? "error" : ""}
                                    />
                                    {errors.loggedBy && <p className="addSuppliesLogs-error-message">{errors.loggedBy}</p>}
                                </div>
                            </div>

                            <div className="addSuppliesLogs-form-row">
                                <div className="addSuppliesLogs-form-group" style={{ flex: 1 }}>
                                    <label>Notes:</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="addSuppliesLogs-modal-buttons">
                                <button type="submit">Add Supplies Restock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationSuppliesLogsModal
                visible={showConfirmation}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                formData={formData}
            />
        </>
    );
}

export default AddSuppliesLogsModal;
