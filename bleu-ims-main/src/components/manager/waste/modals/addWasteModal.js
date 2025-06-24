import React, { useState } from "react";
import "./addWasteModal.css";
import { toast } from 'react-toastify';

function AddWasteModal({ onClose, onSubmit, initialFormData }) {
    const [formData, setFormData] = useState(initialFormData || {
        ItemType: "",
        ItemName: "",
        BatchNo: "",
        Amount: "",
        Unit: "",
        Reason: "",
        Date: "",
        LoggedBy: "",
        Notes: ""
    });

    const [errors, setErrors] = useState({});

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
        if (!formData.ItemName) newErrors.ItemName = "Item Name is required";
        if (!formData.BatchNo) newErrors.BatchNo = "Batch No. is required";
        if (!formData.Amount) newErrors.Amount = "Amount is required";
        if (!formData.Unit) newErrors.Unit = "Unit is required";
        if (!formData.Reason) newErrors.Reason = "Reason is required";
        if (!formData.Date) newErrors.Date = "Date is required";
        if (!formData.LoggedBy) newErrors.LoggedBy = "Logged By is required";
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSubmit(formData);
    };

    return (
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
                                <option value="Supply/Materials">Supply/Materials</option>
                                <option value="Merchandise">Merchandise</option>
                            </select>
                            {errors.ItemType && <p className="addWaste-error-message">{errors.ItemType}</p>}
                        </div>
                        <div className="addWaste-form-group">
                            <label>
                                Item Name: <span className="addWaste-required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                name="ItemName"
                                value={formData.ItemName}
                                onChange={handleChange}
                                onFocus={() => handleFocus("ItemName")}
                                className={errors.ItemName ? "error" : ""}
                            />
                            {errors.ItemName && <p className="addWaste-error-message">{errors.ItemName}</p>}
                        </div>
                    </div>

                    <div className="addWaste-form-row">
                        <div className="addWaste-form-group">
                            <label>
                                Batch No.: <span className="addWaste-required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                name="BatchNo"
                                value={formData.BatchNo}
                                onChange={handleChange}
                                onFocus={() => handleFocus("BatchNo")}
                                className={errors.BatchNo ? "error" : ""}
                            />
                            {errors.BatchNo && <p className="addWaste-error-message">{errors.BatchNo}</p>}
                        </div>
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
                    </div>

                    <div className="addWaste-form-row">
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
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="lb">lb</option>
                                <option value="oz">oz</option>
                                <option value="pcs">pcs</option>
                            </select>
                            {errors.Unit && <p className="addWaste-error-message">{errors.Unit}</p>}
                        </div>
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
                                <option value="Spoiled">Spoiled</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.Reason && <p className="addWaste-error-message">{errors.Reason}</p>}
                        </div>
                    </div>

                    <div className="addWaste-form-row">
                        <div className="addWaste-form-group">
                            <label>
                                Date: <span className="addWaste-required-asterisk">*</span>
                            </label>
                            <input
                                type="date"
                                name="Date"
                                value={formData.Date}
                                onChange={handleChange}
                                onFocus={() => handleFocus("Date")}
                                className={errors.Date ? "error" : ""}
                            />
                            {errors.Date && <p className="addWaste-error-message">{errors.Date}</p>}
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
    );
}

export default AddWasteModal;