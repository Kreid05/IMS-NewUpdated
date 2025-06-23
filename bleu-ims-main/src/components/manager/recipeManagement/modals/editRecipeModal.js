import React, { useState, useEffect, useCallback } from "react";
import "./editRecipeModal.css";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://127.0.0.1:8005";
const getAuthToken = () => localStorage.getItem("authToken");

function EditRecipeModal({ recipe, onClose, onUpdate, products, ingredients: initialIngredients = [], supplies: availableSupplies = [] }) {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [category, setCategory] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [editedRecipe, setEditedRecipe] = useState({
        RecipeName: "",
        ProductID: "",
        Ingredients: [],
        Materials: [],
    });

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) return handleLogout();

        if (!recipe || !recipe.RecipeID) {
            console.warn("Recipe ID not available yet.");
            return;
        }

        const fetchRecipeDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/recipes/recipes/${recipe.RecipeID}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Failed to fetch recipe details.");
                const data = await response.json();

                const foundProduct = products.find(p => p.ProductID === data.ProductID);
                setCategory(foundProduct?.ProductCategory || "");

                setEditedRecipe({
                    RecipeName: data.RecipeName,
                    ProductID: data.ProductID,
                    Ingredients: (data.Ingredients || []).map(i => ({
                        name: i.IngredientName,
                        amount: i.Amount,
                        measurement: i.Measurement
                    })),
                    Materials: (data.Materials || []).map(m => ({
                        name: m.MaterialName,
                        amount: m.Quantity,
                        measurement: m.Measurement
                    }))
                });
            } catch (err) {
                console.error("Error:", err);
                toast.error("Error fetching recipe data.");
            }
        };

        fetchRecipeDetails();
    }, [recipe, products, handleLogout]);

    useEffect(() => {
        console.log("Initial Ingredients:", initialIngredients);
        console.log("Available Supplies:", availableSupplies);
    }, [initialIngredients, availableSupplies]);

    useEffect(() => {
        if (category) {
            const filtered = products.filter(p => p.ProductCategory === category);
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [products, category]);

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setEditedRecipe(prev => ({ ...prev, [name]: value }));
    };

    const handleIngredientChange = (index, field, value) => {
        const updated = [...editedRecipe.Ingredients];
        updated[index][field] = value;
        setEditedRecipe(prev => ({ ...prev, Ingredients: updated }));
    };

    const handleAddIngredient = () => {
        setEditedRecipe(prev => ({
            ...prev,
            Ingredients: [...prev.Ingredients, { name: "", amount: "", measurement: "" }]
        }));
    };

    const handleRemoveIngredient = (index) => {
        setEditedRecipe(prev => ({
            ...prev,
            Ingredients: prev.Ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        const updated = [...editedRecipe.Materials];
        updated[index][field] = value;
        setEditedRecipe(prev => ({ ...prev, Materials: updated }));
    };

    const handleAddMaterial = () => {
        setEditedRecipe(prev => ({
            ...prev,
            Materials: [...prev.Materials, { name: "", amount: "", measurement: "" }]
        }));
    };

    const handleRemoveMaterial = (index) => {
        setEditedRecipe(prev => ({
            ...prev,
            Materials: prev.Materials.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!editedRecipe.RecipeName) newErrors.RecipeName = "Recipe name is required";
        if (!editedRecipe.ProductID) newErrors.ProductID = "Product is required";
        if (!editedRecipe.Ingredients.length) newErrors.Ingredients = "At least one ingredient is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const token = getAuthToken();
        if (!token) return handleLogout();

        const formattedIngredients = editedRecipe.Ingredients.map(ing => {
            const match = initialIngredients.find(i => i.IngredientName === ing.name);
            return {
                IngredientID: match?.IngredientID,
                Amount: parseFloat(ing.amount),
                Measurement: ing.measurement
            };
        });

        const formattedMaterials = editedRecipe.Materials.map(mat => {
            const match = availableSupplies.find(m => m.MaterialName === mat.name);
            return {
                MaterialID: match?.MaterialID,
                Quantity: parseFloat(mat.amount),
                Measurement: mat.measurement
            };
        });

        const payload = {
            RecipeName: editedRecipe.RecipeName,
            ProductID: parseInt(editedRecipe.ProductID, 10),
            Ingredients: formattedIngredients,
            Materials: formattedMaterials,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/recipes/recipes/${recipe.RecipeID}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Update failed.");
            }

            const result = await response.json();
            if (onUpdate) onUpdate(result);
            toast.success("Recipe updated successfully!");
            onClose();
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Failed to update recipe.");
        }
    };

return (
    <div className="editRecipe-modal-overlay">
        <div className="editRecipe-modal-container">
            <div className="editRecipe-modal-header">
                <h3>Edit Recipe</h3>
                <span className="editRecipe-close-button" onClick={onClose}>&times;</span>
            </div>
            <form onSubmit={handleSubmit} className="editRecipe-modal-form">
                <div className="editRecipe-form-group">
                    <label>Recipe Name <span className="required">*</span></label>
                    <input
                        name="RecipeName"
                        value={editedRecipe.RecipeName}
                        onChange={handleFieldChange}
                        className={errors.RecipeName ? "error" : ""}
                    />
                    {errors.RecipeName && <p className="error-message">{errors.RecipeName}</p>}
                </div>

                <div className="editRecipe-form-row">
                    <div className="editRecipe-form-group">
                        <label>Category <span className="required">*</span></label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={errors.category ? "error" : ""}
                        >
                            <option value="">Select a category</option>
                            {Array.from(new Set(products.map(p => p.ProductCategory))).sort().map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && <p className="error-message">{errors.category}</p>}
                    </div>

                    <div className="editRecipe-form-group">
                        <label>Product <span className="required">*</span></label>
                        <select
                            name="ProductID"
                            value={editedRecipe.ProductID}
                            onChange={handleFieldChange}
                            className={errors.ProductID ? "error" : ""}
                        >
                            <option value="">Select Product</option>
                            {filteredProducts.map(p => (
                                <option key={p.ProductID} value={p.ProductID}>{p.ProductName}</option>
                            ))}
                        </select>
                        {errors.ProductID && <p className="error-message">{errors.ProductID}</p>}
                    </div>
                </div>

                {/* Ingredients Section */}
                <div className="editRecipe-section">
                    <h4>Ingredients <span className="required">*</span></h4>
                    <button type="button" onClick={handleAddIngredient} className="editRecipe-add-button">+ Add Ingredient</button>
                    {editedRecipe.Ingredients.map((ing, index) => (
                        <div key={index} className="editRecipe-item">
                            <div className="editRecipe-item-row">
                                <div className="editRecipe-item-field">
                                    <label>Ingredient</label>
                                    <select
                                        value={ing.name || ""}
                                        onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                                    >
                                        <option value="">Select Ingredient</option>
                                        {initialIngredients.map(i => (
                                            <option key={i.IngredientID} value={i.IngredientName}>
                                                {i.IngredientName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="editRecipe-item-field">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        value={ing.amount}
                                        onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                                    />
                                </div>
                                <div className="editRecipe-item-field">
                                    <label>Unit</label>
                                    <input
                                        value={ing.measurement}
                                        onChange={(e) => handleIngredientChange(index, "measurement", e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                    className="editRecipe-remove-button"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    {errors.ingredients && <p className="error-message">{errors.ingredients}</p>}
                </div>

                {/* Supplies Section */}
                <div className="editRecipe-section">
                    <h4>Supplies and Materials</h4>
                    <button type="button" onClick={handleAddMaterial} className="editRecipe-add-button">+ Add Supply</button>
                    {editedRecipe.Materials.map((mat, index) => (
                        <div key={index} className="editRecipe-item">
                            <div className="editRecipe-item-row">
                                <div className="editRecipe-item-field">
                                    <label>Supply</label>
                                    <select
                                        value={mat.name || ""}
                                        onChange={(e) => handleMaterialChange(index, "name", e.target.value)}
                                    >
                                        <option value="">Select Supply</option>
                                        {availableSupplies.map(m => (
                                            <option key={m.MaterialID} value={m.MaterialName}>
                                                {m.MaterialName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="editRecipe-item-field">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        value={mat.amount}
                                        onChange={(e) => handleMaterialChange(index, "amount", e.target.value)}
                                    />
                                </div>
                                <div className="editRecipe-item-field">
                                    <label>Unit</label>
                                    <input
                                        value={mat.measurement}
                                        onChange={(e) => handleMaterialChange(index, "measurement", e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMaterial(index)}
                                    className="editRecipe-remove-button"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="editRecipe-button-container">
                    <button type="submit" className="editRecipe-submit-button">Update Recipe</button>
                </div>
            </form>
        </div>
    </div>
);
}

export default EditRecipeModal;
