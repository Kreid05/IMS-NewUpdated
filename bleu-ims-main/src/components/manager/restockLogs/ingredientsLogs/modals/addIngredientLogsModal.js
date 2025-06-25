import React, { useState } from "react";
import "./addIngredientLogsModal.css";
import { toast } from 'react-toastify';
import ConfirmationIngredientLogsModal from "./confirmationIngredientLogsModal";

function AddIngredientLogsModal({ onClose, onSubmit, initialFormData }) {
    const emptyFormData = {
        quantity: "",
        unit: "",
        batchDate: "",
        restockDate: "",
        expirationDate: "",
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
        if (!formData.expirationDate) newErrors.expirationDate = "Expiration Date is required";
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
        // Derive status based on quantity and expirationDate
        const quantityValue = Number(formData.quantity);
        const expirationDate = formData.expirationDate ? new Date(formData.expirationDate) : null;
        const today = new Date();
        let status = "Available";

        if (expirationDate && expirationDate < today) {
            status = "Expired";
        } else if (quantityValue === 0) {
            status = "Used";
        } else if (quantityValue > 0 && quantityValue <= 10) {
            status = "Used";
        } else if (quantityValue > 10) {
            status = "Available";
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
                <div className="addIngredientLogs-modal-overlay">
                    <div className="addIngredientLogs-modal-content">
                        <div className="addIngredientLogs-modal-header">
                            <h3>Add Ingredient Restock Record</h3>
                            <span className="addIngredientLogs-modal-close-button" onClick={() => { onClose(); setFormData(emptyFormData); }}>×</span>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Quantity: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("quantity")}
                                        className={errors.quantity ? "error" : ""}
                                    />
                                    {errors.quantity && <p className="addIngredientLogs-error-message">{errors.quantity}</p>}
                                </div>
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Unit: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("unit")}
                                        className={errors.unit ? "error" : ""}
                                    >
                                        <option value="">Select Unit</option>
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                    </select>
                                    {errors.unit && <p className="addIngredientLogs-error-message">{errors.unit}</p>}
                                </div>
                            </div>

                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Batch Date: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="batchDate"
                                        value={formData.batchDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("batchDate")}
                                        className={errors.batchDate ? "error" : ""}
                                    />
                                    {errors.batchDate && <p className="addIngredientLogs-error-message">{errors.batchDate}</p>}
                                </div>
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Restock Date: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="restockDate"
                                        value={formData.restockDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("restockDate")}
                                        className={errors.restockDate ? "error" : ""}
                                    />
                                    {errors.restockDate && <p className="addIngredientLogs-error-message">{errors.restockDate}</p>}
                                </div>
                            </div>

                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Expiration Date:
                                    </label>
                                    <input
                                        type="date"
                                        name="expirationDate"
                                        value={formData.expirationDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("expirationDate")}
                                        className={errors.expirationDate ? "error" : ""}
                                    />
                                    {errors.expirationDate && <p className="addIngredientLogs-error-message">{errors.expirationDate}</p>}
                                </div>
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Logged By: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="loggedBy"
                                        value={formData.loggedBy}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("loggedBy")}
                                        className={errors.loggedBy ? "error" : ""}
                                    />
                                    {errors.loggedBy && <p className="addIngredientLogs-error-message">{errors.loggedBy}</p>}
                                </div>
                            </div>

                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group" style={{ flex: 1 }}>
                                    <label>Notes:</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="addIngredientLogs-modal-buttons">
                                <button type="submit">Add Ingredient Restock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationIngredientLogsModal
                visible={showConfirmation}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                formData={formData}
            />
        </>
    );
}

export default AddIngredientLogsModal;
