import React, { useState } from "react";
import "./addIngredientModal.css";

const getAuthToken = () => localStorage.getItem("access_token");

function AddIngredientModal({ onClose, onSubmit }) {
    const [ingredientName, setIngredientName] = useState("");
    const [amount, setAmount] = useState("");
    const [measurement, setMeasurement] = useState("");
    const [bestBeforeDate, setBestBeforeDate] = useState("");
    const [expirationDate, setExpirationDate] = useState("");

    const [errors, setErrors] = useState({
        ingredientName: "",
        amount: "",
        measurement: "",
        batchDate: "",
        expirationDate: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!ingredientName) newErrors.ingredientName = "This field is required";
        if (!amount) newErrors.amount = "This field is required";
        if (!measurement) newErrors.measurement = "This field is required";
        if (!bestBeforeDate) newErrors.bestBeforeDate = "This field is required";
        if (!expirationDate) newErrors.expirationDate = "This field is required";

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const token = getAuthToken();
            if (!token) {
                alert("Authentication token not found.");
                return;
            }

            const newIngredient = {
                IngredientName: ingredientName,
                Amount: parseFloat(amount),
                Measurement: measurement,
                BestBeforeDate: bestBeforeDate,
                ExpirationDate: expirationDate
            };

            try {
                const response = await fetch("http://127.0.0.1:8002/ingredients/ingredients/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(newIngredient)
                });

                if (!response.ok) {
                    throw new Error("Failed to add ingredient.");
                }

                const result = await response.json();
                if (onSubmit) onSubmit(result);
                onClose();

            } catch (error) {
                console.error("Error adding ingredient:", error);
                alert("Failed to add ingredient.");
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
        <div className="addIngredient-modal-overlay">
            <div className="addIngredient-modal-container">
                <div className="addIngredient-modal-header">
                    <h3>Add Ingredient</h3>
                    <span className="addIngredient-close-button" onClick={onClose}>&times;</span>
                </div>
                <form className="addIngredient-modal-form" onSubmit={handleSubmit}>
                    <label>
                        Ingredient Name <span className="addIngredient-required-asterisk">*</span>
                        <input
                            type="text"
                            value={ingredientName}
                            onChange={(e) => setIngredientName(e.target.value)}
                            onFocus={() => handleFocus('ingredientName')}
                            className={errors.ingredientName ? "addIngredient-error" : ""}
                        />
                        {errors.ingredientName && <p className="addIngredient-error-message">{errors.ingredientName}</p>}
                    </label>

                    <div className="addIngredient-row">
                        <label className="addIngredient-half">
                            Amount <span className="addIngredient-required-asterisk">*</span>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onFocus={() => handleFocus('amount')}
                                className={errors.amount ? "addIngredient-error" : ""}
                            />
                            {errors.amount && <p className="addIngredient-error-message">{errors.amount}</p>}
                        </label>

                        <label className="addIngredient-half">
                            Unit <span className="addIngredient-required-asterisk">*</span>
                            <select
                                value={measurement}
                                onChange={(e) => setMeasurement(e.target.value)}
                                onFocus={() => handleFocus('measurement')}
                                className={errors.measurement ? "addIngredient-error" : ""}
                                required
                            >
                                <option value="">Select unit</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                            </select>
                            {errors.measurement && <p className="addIngredient-error-message">{errors.measurement}</p>}
                        </label>
                    </div>

                    <div className="addIngredient-row">
                        <label className="addIngredient-half">
                            Best Before Date <span className="addIngredient-required-asterisk">*</span>
                            <input
                                type="date"
                                value={bestBeforeDate}
                                onChange={(e) => setBestBeforeDate(e.target.value)}
                                onFocus={() => handleFocus('bestBeforeDate')}
                                className={errors.bestBeforeDate ? "addIngredient-error" : ""}
                            />
                            {errors.bestBeforeDate && <p className="addIngredient-error-message">{errors.bestBeforeDate}</p>}
                        </label>

                        <label className="addIngredient-half">
                            Expiration Date <span className="addIngredient-required-asterisk">*</span>
                            <input
                                type="date"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                onFocus={() => handleFocus('expirationDate')}
                                className={errors.expirationDate ? "addIngredient-error" : ""}
                            />
                            {errors.expirationDate && <p className="addIngredient-error-message">{errors.expirationDate}</p>}
                        </label>
                    </div>

                    <div className="addIngredient-button-container">
                        <button type="submit" className="addIngredient-submit-button" >Add Ingredient</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddIngredientModal;