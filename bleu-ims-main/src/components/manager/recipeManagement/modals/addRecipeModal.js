import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./addRecipeModal.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://127.0.0.1:8005";
const getAuthToken = () => localStorage.getItem("authToken");

function AddRecipeModal({ onClose, onSubmit, type, products, initialIngredients, supplies: availableSupplies }) {
    const [recipeName, setRecipeName] = useState("");
    const [category, setCategory] = useState("");
    const [product, setProduct] = useState("");
    const [ingredients, setIngredients] = useState([]);
    const [recipeSupplies, setRecipeSupplies] = useState([]);
    const [errors, setErrors] = useState({});
    const [filteredProducts, setFilteredProducts] = useState([]);
    const navigate = useNavigate();
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            handleLogout();
        }
    }, [navigate, handleLogout]);

    const availableCategories = useMemo(() => {
        if (!products) return [];
        const relevantProducts = products.filter(p => p.ProductTypeName.toLowerCase() === type);
        const categorySet = new Set(relevantProducts.map(p => p.ProductCategory));
        return Array.from(categorySet).sort();
    }, [products, type]);

    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        setCategory(selectedCategory);
        setProduct("");

        if (selectedCategory) {
            const newFilteredList = products.filter(p => p.ProductCategory === selectedCategory);
            setFilteredProducts(newFilteredList);
        } else {
            setFilteredProducts([]);
        }
    };

    const handleAddIngredient = () =>
        setIngredients([
            ...ingredients,
            { name: "", amount: "", measurement: "" }
        ]);

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const handleRemoveIngredient = (index) =>
        setIngredients(ingredients.filter((_, i) => i !== index));

    const handleAddSupply = () =>
        setRecipeSupplies([
            ...recipeSupplies,
            { name: "", amount: "", measurement: "" }
        ]);

    const handleSupplyChange = (index, field, value) => {
        const newSupplies = [...recipeSupplies];
        newSupplies[index][field] = value;
        setRecipeSupplies(newSupplies);
    };

    const handleRemoveSupply = (index) =>
        setRecipeSupplies(recipeSupplies.filter((_, i) => i !== index));

    const handleFocus = (field) =>
        setErrors((prev) => ({ ...prev, [field]: "" }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!recipeName) newErrors.recipeName = "Recipe name is required";
        if (!product) newErrors.product = "Product is required";
        if (!category) newErrors.category = "Category is required";
        if (ingredients.length === 0) newErrors.ingredients = "At least one ingredient is required";
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const token = getAuthToken();

            if (!token) {
                toast.error("Authentication token not found.");
                handleLogout();
                return;
            }

            const formattedIngredients = ingredients.map(ing => ({
                IngredientID: parseInt(ing.name, 10),
                Amount: parseFloat(ing.amount),
                Measurement: ing.measurement || null,
            }));

            const formattedSupplies = recipeSupplies.map(sup => ({
                MaterialID: parseInt(sup.name, 10),
                Quantity: parseFloat(sup.amount),
                Measurement: sup.measurement || null,
            }));

            const newRecipe = {
                RecipeName: recipeName,
                ProductID: parseInt(product, 10),
                Ingredients: formattedIngredients,
                Materials: formattedSupplies,
            };

            try {
                const response = await fetch(`${API_BASE_URL}/recipes/recipes/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newRecipe),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.detail
                        ? JSON.stringify(errorData.detail, null, 2)
                        : "An unknown error occurred.";
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                if (onSubmit) onSubmit(result);
                toast.success("Recipe added successfully!");
                onClose();
            } catch (error) {
                console.error("Error adding recipe:", error.message);
                toast.error(`Failed to add recipe. Server response:\n\n${error.message}`);
            }
        }
    };

    return (
        <div className="addRecipe-modal-overlay">
            <div className="addRecipe-modal-container">
                <div className="addRecipe-modal-header">
                    <h3>Add Recipe</h3>
                    <span className="addRecipe-close-button" onClick={onClose}>×</span>
                </div>
                <form className="addRecipe-modal-form" onSubmit={handleSubmit}>
                    <div className="recipe-form-group">
                        <label>Recipe Name <span className="required">*</span></label>
                        <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} onFocus={() => handleFocus('recipeName')} className={errors.recipeName ? 'error' : ''}/>
                        {errors.recipeName && <p className="error-message">{errors.recipeName}</p>}
                    </div>

                    <div className="recipe-form-row">
                        <div className="recipe-form-group">
                            <label>Category <span className="required">*</span></label>
                            <select value={category} onChange={handleCategoryChange} onFocus={() => handleFocus('category')} className={errors.category ? 'error' : ''}>
                                <option value="">Select a category</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors.category && <p className="error-message">{errors.category}</p>}
                        </div>
                        <div className="recipe-form-group">
                            <label>Product <span className="required">*</span></label>
                            <select value={product} onChange={(e) => setProduct(e.target.value)} onFocus={() => handleFocus('product')} className={errors.product ? 'error' : ''} disabled={!category}>
                                <option value="">Select a product</option>
                                {filteredProducts.map(p => (
                                    <option key={p.ProductID} value={p.ProductID}>{p.ProductName}</option>
                                ))}
                            </select>
                            {errors.product && <p className="error-message">{errors.product}</p>}
                        </div>
                    </div>

                    <div className="recipe-section">
                        <h4>Ingredients <span className="required">*</span></h4>
                        <button type="button" onClick={handleAddIngredient} className="recipe-add-button">+ Add Ingredient</button>
                        {ingredients.length > 0 && ingredients.map((ingredient, index) => (
                            <div key={index} className="recipe-item">
                                <div className="recipe-item-row">
                                    <div className="recipe-item-field"><label>Ingredient</label><select value={ingredient.name} onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}><option value="">Select an ingredient</option>{initialIngredients && initialIngredients.map(ing => (<option key={ing.IngredientID} value={ing.IngredientID}>{ing.IngredientName}</option>))}</select></div>
                                    <div className="recipe-item-field"><label>Amount</label><input type="number" value={ingredient.amount} onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)} /></div> {/* <-- FIX WAS HERE */}
                                    <div className="recipe-item-field"><label>Unit</label><input type="text" value={ingredient.measurement} onChange={(e) => handleIngredientChange(index, 'measurement', e.target.value)} /></div>
                                    <button type="button" onClick={() => handleRemoveIngredient(index)} className="recipe-remove-button">Remove</button>
                                </div>
                            </div>
                        ))}
                        {errors.ingredients && <p className="error-message">{errors.ingredients}</p>}
                    </div>

                    <div className="recipe-section">
                        <h4>Supplies</h4>
                        <button type="button" onClick={handleAddSupply} className="recipe-add-button">+ Add Supply</button>
                        {recipeSupplies.length > 0 && recipeSupplies.map((supply, index) => (
                            <div key={index} className="recipe-item">
                                <div className="recipe-item-row">
                                    <div className="recipe-item-field"><label>Supply</label><select value={supply.name} onChange={(e) => handleSupplyChange(index, 'name', e.target.value)}><option value="">Select a supply</option>{availableSupplies && availableSupplies.map(sup => (<option key={sup.MaterialID || sup.SupplyID} value={sup.MaterialID || sup.SupplyID}>{sup.MaterialName || sup.SupplyName}</option>))}</select></div>
                                    <div className="recipe-item-field"><label>Amount</label><input type="number" value={supply.amount} onChange={(e) => handleSupplyChange(index, 'amount', e.target.value)} /></div>
                                    <div className="recipe-item-field"><label>Unit</label><input type="text" value={supply.measurement} onChange={(e) => handleSupplyChange(index, 'measurement', e.target.value)} /></div>
                                    <button type="button" onClick={() => handleRemoveSupply(index)} className="recipe-remove-button">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="addRecipe-button-container">
                        <button type="submit" className="addRecipe-submit-button">Add Recipe</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddRecipeModal;