import React from "react";
import "./confirmationWasteModal.css";

function ConfirmationModal({ visible, onConfirm, onCancel, formData }) {
    if (!visible || !formData || formData.length === 0) return null;

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal-content">
                <div className="confirmation-modal-header">
                    <h3>Confirm Waste Record(s)</h3>
                </div>
                <div className="confirmation-content">
                    <p>Please confirm the following waste record(s) before saving:</p>
                    {formData.map((record, index) => (
                        <div key={index} className="confirmation-log-entry">
                            <ul>
                                <li><strong>Item Type:</strong> {record.ItemType}</li>
                                <li><strong>Item Name:</strong> {record.ItemName}</li>
                                <li><strong>Batch No.:</strong> {record.BatchNo}</li>
                                <li><strong>Amount:</strong> {record.Amount}</li>
                                <li><strong>Unit:</strong> {record.Unit}</li>
                                <li><strong>Reason:</strong> {record.Reason}</li>
                                <li><strong>Date:</strong> {record.Date}</li>
                                <li><strong>Logged By:</strong> {record.LoggedBy}</li>
                                <li><strong>Notes:</strong> {record.Notes || '—'}</li>
                            </ul>
                            {index < formData.length - 1 && <hr />} {/* Divider between logs */}
                        </div>
                    ))}
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