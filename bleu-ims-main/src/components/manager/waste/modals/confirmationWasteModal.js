import React from "react";
import "./confirmationWasteModal.css";

function ConfirmationModal({ visible, onConfirm, onCancel, formData }) {
    if (!visible) return null;

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal-content">
                <div className="confirmation-modal-header">
                    <h3>Confirm Waste Record</h3>
                </div>
                <div className="confirmation-content">
                    <p>Please confirm the following waste record details before saving:</p>
                    <ul>
                        <li><strong>Item Type:</strong> {formData.ItemType}</li>
                        <li><strong>Item Name:</strong> {formData.ItemName}</li>
                        <li><strong>Batch No.:</strong> {formData.BatchNo}</li>
                        <li><strong>Amount:</strong> {formData.Amount}</li>
                        <li><strong>Unit:</strong> {formData.Unit}</li>
                        <li><strong>Reason:</strong> {formData.Reason}</li>
                        <li><strong>Date:</strong> {formData.Date}</li>
                        <li><strong>Logged By:</strong> {formData.LoggedBy}</li>
                        <li><strong>Notes:</strong> {formData.Notes}</li>
                    </ul>
                </div>
                <div className="confirmation-modal-buttons">
                    <button className="confirm-button" onClick={onConfirm}>Confirm</button>
                    <button className="cancel-button" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;
