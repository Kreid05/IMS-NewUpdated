import React from "react";
import "../../../waste/modals/confirmationWasteModal.css";

function ConfirmationIngredientLogsModal({ visible, onConfirm, onCancel, formData }) {
    if (!visible) return null;

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal-content">
                <div className="confirmation-modal-header">
                    <h3>Confirm Ingredient Log Record</h3>
                </div>
                <div className="confirmation-content">
                    <p>Please confirm the following ingredient log details before saving:</p>
                    <ul>
                        <li><strong>Quantity:</strong> {formData.quantity}</li>
                        <li><strong>Unit:</strong> {formData.unit}</li>
                        <li><strong>Batch Date:</strong> {formData.batchDate}</li>
                        <li><strong>Restock Date:</strong> {formData.restockDate}</li>
                        <li><strong>Logged By:</strong> {formData.loggedBy}</li>
                        <li><strong>Notes:</strong> {formData.notes}</li>
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

export default ConfirmationIngredientLogsModal;
