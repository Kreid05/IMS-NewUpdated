import React from "react";
import "./viewSupplyModal.css";
import { FaTimes, FaEdit, FaArchive } from "react-icons/fa";

const ViewSupplyModal = ({ supply, onClose, onEdit, onDelete }) => {
    if (!supply) return null;

    return (
        <div className="view-supply-modal-overlay">
            <div className="view-supply-modal">
                <button className="view-supply-close-button" onClick={onClose}><FaTimes /></button>

                <h2 className="view-supply-name">{supply.MaterialName}</h2>
                <hr className="view-supply-divider" />

                <div className="view-supply-modal-content">
                    <div className="view-supply-label">Quantity</div>
                    <div className="view-supply-value">{supply.MaterialQuantity}</div>

                    <div className="view-supply-label">Measurement</div>
                    <div className="view-supply-value">{supply.MaterialMeasurement}</div>

                    <div className="view-supply-label">Supply Date</div>
                    <div className="view-supply-value">{supply.DateAdded}</div>

                    <div className="view-supply-label">Status</div>
                    <div className="view-supply-value">{supply.Status}</div>
                </div>

                <div className="view-supply-modal-actions">
                    <button className="view-supply-edit-button" onClick={() => onEdit(supply)}><FaEdit /> Edit</button>
                    <button className="view-supply-delete-button" onClick={() => onDelete(supply.MaterialID)}><FaArchive /> Delete</button>
                </div>
            </div>
        </div>
    );
};

export default ViewSupplyModal;
