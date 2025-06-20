import React, { useState } from "react";
import "./addMerchandiseModal.css";

const getAuthToken = () => localStorage.getItem("authToken");

function AddMerchandiseModal({ onClose, onSubmit}) {
    const [merchName, setMerchName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [dateAdded, setDateAdded] = useState("");

    const [errors, setErrors] = useState({
        merchName: "",
        quantity: "",
        dateAdded: ""
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!merchName) newErrors.MerchandiseName = "This field is required";
        if (!quantity) newErrors.MerchandiseQuantity = "This field is required";
        if (!dateAdded) newErrors.MerchandiseDateAdded = "This field is required";

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
           const token = getAuthToken();
            if (!token) {
                alert("Authentication token not found.");
                return;
            }

            const newMerch = {
                MerchandiseName: merchName,
                MerchandiseQuantity: parseFloat(quantity),
                MerchandiseDateAdded: dateAdded
            };

            try {
                const response = await fetch("http://127.0.0.1:8004/merchandise/merchandise/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(newMerch)
                });

                if (!response.ok) {
                    throw new Error("Failed to add item.");
                }

                const result = await response.json();
                console.log("New merchandise added:", result);
                if (onSubmit) onSubmit(result);
                onClose();

            } catch (error) {
                console.error("Error adding item:", error);
                alert("Failed to add item.");
            }
        }
    };

    const handleFocus = (field) => {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: ""
        }));
    };

    return (
        <div className="addMerchandise-modal-overlay">
            <div className="addMerchandise-modal-container">
                <div className="addMerchandise-modal-header">
                    <h3>Add Merchandise</h3>
                    <span className="addMerchandise-close-button" onClick={onClose}>&times;</span>
                </div>
                <form className="addMerchandise-modal-form" onSubmit={handleSubmit}>
                    <label>
                        Merchandise Name <span className="addMerchandise-required-asterisk">*</span>
                        <input
                            type="text"
                            value={merchName}
                            onChange={(e) => setMerchName(e.target.value)}
                            onFocus={() => handleFocus('merchName')}
                            className={errors.MerchandiseName ? "addMerchandise-error" : ""}
                        />
                        {errors.merchName && <p className="addMerchandise-error-message">{errors.MerchandiseName}</p>}
                    </label>

                    <div className="addMerchandise-row">
                        <label className="addMerchandise-half">
                            Quantity <span className="addMerchandise-required-asterisk">*</span>
                            <input
                                type="text"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                onFocus={() => handleFocus('quantity')}
                                className={errors.quantity ? "addMerchandise-error" : ""}
                            />
                            {errors.quantity && <p className="addMerchandise-error-message">{errors.MerchandiseQuantity}</p>}
                        </label>

                        <label className="addMerchandise-half">
                            Date Added <span className="addMerchandise-required-asterisk">*</span>
                            <input
                                type="date"
                                value={dateAdded}
                                onChange={(e) => setDateAdded(e.target.value)}
                                onFocus={() => handleFocus('dateAdded')}
                                className={errors.dateAdded ? "addMerchandise-error" : ""}
                            />
                            {errors.dateAdded && <p className="addMerchandise-error-message">{errors.MerchandiseDateAdded}</p>}
                        </label>
                    </div>

                    <div className="addMerchandise-button-container">
                        <button className="addMerchandise-submit-button">Add Merchandise</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddMerchandiseModal;
