import React, { useState, useEffect } from "react";
import "./editSupplyModal.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://127.0.0.1:8003";
const getAuthToken = () => localStorage.getItem("authToken");

function EditSupplyModal({ supply, onClose, onUpdate }) {
    const [SupplyName, setSupplyName] = useState("");
    const [Quantity, setQuantity] = useState("");
    const [Measurement, setMeasurement] = useState("");
    const [DateAdded, setDateAdded] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        supplyName: "",
        quantity: "",
        measurement: "",
        supplyDate: ""
    });

    useEffect(() => {
            console.log("materials:", supply);
            if (supply) {
                setSupplyName(supply.MaterialName || "");
                setQuantity(supply.MaterialQuantity || "");
                setMeasurement(supply.MaterialMeasurement || "");
                setDateAdded(supply.DateAdded || "");   
            }
    }, [supply]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        const payload = {
            MaterialName: SupplyName,
            MaterialQuantity: parseFloat(Quantity),
            MaterialMeasurement: Measurement,
            DateAdded: DateAdded
        };

        setIsLoading(true);

        // update product
        try {
            const response = await fetch(`${API_BASE_URL}/materials/materials/${supply.MaterialID}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to update item.");
            }

            const updatedData = await response.json();
            onUpdate(updatedData);
            toast.success("Supply/Material updated successfully");
            onClose();
        } catch (error) {
            console.error("Error updating item:", error);
            toast.error("Error updating item.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="editSupply-modal-overlay">
            <div className="editSupply-modal">
                <h2>Edit Supply</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            name="name"
                            value={SupplyName}
                            onChange={(e) => {
                                setSupplyName(e.target.value);
                                if (form.MaterialName) setForm(prev => ({ ...prev, MaterialName: "" }));
                            }}
                            className={form.MaterialName ? "editItem-error" : ""}
                            required
                        />
                    </label>

                    <div className="supply-group">
                        <div className="supply-quantity">
                            <label>
                                Quantity:
                                <input
                                    type="number"
                                    name="quantity"
                                    value={Quantity}
                                    onChange={(e) => {
                                        setQuantity(e.target.value);
                                        if (form.MaterialQuantity) setForm(prev => ({ ...prev, MaterialQuantity: "" }));
                                    }}
                                    className={form.MaterialQuantity ? "editItem-error" : ""}
                                    required
                                />
                            </label>
                        </div>
                        <div className="supply-measurement">
                            <label>
                                Measurement:
                                <select
                                    name="measurement"
                                    value={Measurement}
                                    onChange={(e) => {
                                        setMeasurement(e.target.value);
                                        if (form.MaterialMeasurement) setForm(prev => ({ ...prev, MaterialMeasurement: "" }));
                                    }}
                                    className={form.MaterialMeasurement ? "editItem-error" : ""}
                                    required
                                >
                                    <option value="">Select unit</option>
                                    <option value="pcs">pcs</option>
                                    <option value="box">box</option>
                                    <option value="pack">pack</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <label>
                        Supply Date:
                        <input
                            type="date"
                            name="supplyDate"
                            value={DateAdded}
                            onChange={(e) => {
                                    setDateAdded(e.target.value);
                                    if (form.DateAdded) setForm(prev => ({ ...prev, DateAdded: "" }));
                                }}
                                className={form.DateAdded ? "editItem-error" : ""}
                            required
                        />
                    </label>

                    <div className="editSupply-modal-buttons">
                        <button type="submit" className="editSupply-save-button" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="editSupply-cancel-button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditSupplyModal;