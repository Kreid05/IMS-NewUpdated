import React, { useState, useEffect } from "react";
import "./addDrinksRecipeModal.css"; // Reusing the same CSS
import { FaTimes, FaPlus } from "react-icons/fa";

const API_BASE_URL = "http://127.0.0.1:8001";
const RECIPE_API_URL = "http://127.0.0.1:8002";
const getAuthToken = () => localStorage.getItem("access_token");

function AddFoodsRecipeModal({ onClose, onSubmit }) {
    // Form state
    const [recipeName, setRecipeName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    
    // Products, ingredients, and supplies
    const [products, setProducts] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [supplies, setSupplies] = useState([]);
    
    // Selected items
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedSupplies, setSelectedSupplies] = useState([]);
    
    // Validation errors
    const [errors, setErrors] = useState({
        recipeName: "",
        category: "",
        product: "",
        ingredients: "",
        supplies: "",
        description: ""
    });

    // Food categories
    const foodCategories = [
        "Rice Meals",
        "Pasta",
        "Snacks",
        "Sandwich"
    ];

    // Measurements for dropdown
    const measurements = [
        "g",
        "kg",
        "oz",
        "tbsp",
        "tsp",
        "cup",
        "piece",
        "slice"
    ];

    // Fetch products, ingredients, and supplies on component mount
    useEffect(() => {
        const fetchData = async () => {
            const token = getAuthToken();
            if (!token) {
                alert("Authentication token not found.");
                return;
            }

            try {
                // Fetch products
                const productsResponse = await fetch(`${API_BASE_URL}/products/products/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setProducts(productsData);
                }

                // Fetch ingredients
                const ingredientsResponse = await fetch(`${API_BASE_URL}/ingredients/ingredients/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (ingredientsResponse.ok) {
                    const ingredientsData = await ingredientsResponse.json();
                    setIngredients(ingredientsData);
                }

                // Fetch supplies
                const suppliesResponse = await fetch(`${API_BASE_URL}/materials/materials/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (suppliesResponse.ok) {
                    const suppliesData = await suppliesResponse.json();
                    setSupplies(suppliesData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Failed to fetch necessary data.");
            }
        };

        fetchData();
    }, []);

    // Handle adding an ingredient to the recipe
    const handleAddIngredient = () => {
        setSelectedIngredients([...selectedIngredients, { 
            ingredientId: "", 
            amount: "", 
            measurement: "g" 
        }]);
    };

    // Handle adding a supply to the recipe
    const handleAddSupply = () => {
        setSelectedSupplies([...selectedSupplies, { 
            supplyId: "", 
            quantity: "", 
            size: "Large" 
        }]);
    };

    // Handle removing an ingredient
    const handleRemoveIngredient = (index) => {
        const updatedIngredients = [...selectedIngredients];
        updatedIngredients.splice(index, 1);
        setSelectedIngredients(updatedIngredients);
    };

    // Handle removing a supply
    const handleRemoveSupply = (index) => {
        const updatedSupplies = [...selectedSupplies];
        updatedSupplies.splice(index, 1);
        setSelectedSupplies(updatedSupplies);
    };

    // Handle ingredient selection change
    const handleIngredientChange = (index, field, value) => {
        const updatedIngredients = [...selectedIngredients];
        updatedIngredients[index][field] = value;
        setSelectedIngredients(updatedIngredients);
    };

    // Handle supply selection change
    const handleSupplyChange = (index, field, value) => {
        const updatedSupplies = [...selectedSupplies];
        updatedSupplies[index][field] = value;
        setSelectedSupplies(updatedSupplies);
    };

    // Handle form field focus (clear errors)
    const handleFocus = (field) => {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: "",
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = {};
        if (!recipeName) newErrors.recipeName = "Recipe name is required";
        if (!category) newErrors.category = "Category is required";
        if (!selectedProduct) newErrors.product = "Product is required";
        if (selectedIngredients.length === 0) {
            newErrors.ingredients = "At least one ingredient is required";
        } else {
            // Validate each ingredient
            const invalidIngredient = selectedIngredients.some(
                (ing) => !ing.ingredientId || !ing.amount || !ing.measurement
            );
            if (invalidIngredient) {
                newErrors.ingredients = "All ingredient fields are required";
            }
        }
        if (!description) newErrors.description = "Description is required";

        setErrors(newErrors);

        // If no errors, submit the form
        if (Object.keys(newErrors).length === 0) {
            const token = getAuthToken();
            if (!token) {
                alert("Authentication token not found.");
                return;
            }

            // Format data for API
            const recipeData = {
                ProductID: parseInt(selectedProduct),
                RecipeName: recipeName,
                Category: category,
                Description: description,
                Ingredients: selectedIngredients.map(ing => ({
                    IngredientID: parseInt(ing.ingredientId),
                    Amount: parseFloat(ing.amount),
                    Measurement: ing.measurement
                })),
                Materials: selectedSupplies.map(sup => ({
                    MaterialID: parseInt(sup.supplyId),
                    Quantity: parseFloat(sup.quantity),
                    Measurement: sup.size
                }))
            };

            try {
                const response = await fetch(`${RECIPE_API_URL}/recipes/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(recipeData)
                });

                if (!response.ok) {
                    throw new Error("Failed to add recipe.");
                }

                const result = await response.json();
                if (onSubmit) onSubmit(result);
                onClose();
            } catch (error) {
                console.error("Error adding recipe:", error);
                alert("Failed to add recipe.");
            }
        }
    };

    return (
        <div className="add-recipe-modal-overlay">
            <div className="add-recipe-modal-container">
                <div className="add-recipe-modal-header">
                    <h3>Add Food Recipe</h3>
                    <span className="add-recipe-close-button" onClick={onClose}><FaTimes /></span>
                </div>
                
                <form className="add-recipe-modal-form" onSubmit={handleSubmit}>
                    <div className="add-recipe-form-row">
                        <div className="add-recipe-form-group">
                            <label>
                                Recipe Name <span className="add-recipe-required">*</span>
                                <input
                                    type="text"
                                    value={recipeName}
                                    onChange={(e) => setRecipeName(e.target.value)}
                                    onFocus={() => handleFocus('recipeName')}
                                    className={errors.recipeName ? "add-recipe-error" : ""}
                                />
                                {errors.recipeName && <p className="add-recipe-error-message">{errors.recipeName}</p>}
                            </label>
                        </div>
                        
                        <div className="add-recipe-form-group">
                            <label>
                                Category <span className="add-recipe-required">*</span>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    onFocus={() => handleFocus('category')}
                                    className={errors.category ? "add-recipe-error" : ""}
                                >
                                    <option value="">Select a category</option>
                                    {foodCategories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="add-recipe-error-message">{errors.category}</p>}
                            </label>
                        </div>
                    </div>
                    
                    <div className="add-recipe-form-group">
                        <label>
                            Product <span className="add-recipe-required">*</span>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                onFocus={() => handleFocus('product')}
                                className={errors.product ? "add-recipe-error" : ""}
                            >
                                <option value="">Select a product</option>
                                {products.map((product) => (
                                    <option key={product.ProductID} value={product.ProductID}>
                                        {product.ProductName}
                                    </option>
                                ))}
                            </select>
                            {errors.product && <p className="add-recipe-error-message">{errors.product}</p>}
                        </label>
                    </div>
                    
                    <div className="add-recipe-section">
                        <h4>Ingredients <span className="add-recipe-required">*</span></h4>
                        {errors.ingredients && <p className="add-recipe-error-message">{errors.ingredients}</p>}
                        
                        {selectedIngredients.map((ingredient, index) => (
                            <div key={index} className="add-recipe-ingredient-row">
                                <div className="add-recipe-ingredient-select">
                                    <select
                                        value={ingredient.ingredientId}
                                        onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                                    >
                                        <option value="">Select ingredient</option>
                                        {ingredients.map((ing) => (
                                            <option key={ing.IngredientID} value={ing.IngredientID}>
                                                {ing.IngredientName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="add-recipe-amount">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={ingredient.amount}
                                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                                    />
                                </div>
                                
                                <div className="add-recipe-measurement">
                                    <select
                                        value={ingredient.measurement}
                                        onChange={(e) => handleIngredientChange(index, 'measurement', e.target.value)}
                                    >
                                        {measurements.map((measure) => (
                                            <option key={measure} value={measure}>{measure}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="add-recipe-remove-btn"
                                    onClick={() => handleRemoveIngredient(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        
                        <button 
                            type="button" 
                            className="add-recipe-add-more-btn"
                            onClick={handleAddIngredient}
                        >
                            <FaPlus /> Add More
                        </button>
                    </div>
                    
                    <div className="add-recipe-section">
                        <h4>Supplies</h4>
                        
                        {selectedSupplies.map((supply, index) => (
                            <div key={index} className="add-recipe-supply-row">
                                <div className="add-recipe-supply-select">
                                    <select
                                        value={supply.supplyId}
                                        onChange={(e) => handleSupplyChange(index, 'supplyId', e.target.value)}
                                    >
                                        <option value="">Select supply</option>
                                        {supplies.map((sup) => (
                                            <option key={sup.MaterialID} value={sup.MaterialID}>
                                                {sup.MaterialName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="add-recipe-quantity">
                                    <input
                                        type="number"
                                        placeholder="Quantity"
                                        value={supply.quantity}
                                        onChange={(e) => handleSupplyChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                
                                <div className="add-recipe-size">
                                    <select
                                        value={supply.size}
                                        onChange={(e) => handleSupplyChange(index, 'size', e.target.value)}
                                    >
                                        <option value="Small">Small</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Large">Large</option>
                                    </select>
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="add-recipe-remove-btn"
                                    onClick={() => handleRemoveSupply(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        
                        <button 
                            type="button" 
                            className="add-recipe-add-more-btn"
                            onClick={handleAddSupply}
                        >
                            <FaPlus /> Add More
                        </button>
                    </div>
                    
                    <div className="add-recipe-form-group">
                        <label>
                            Description <span className="add-recipe-required">*</span>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onFocus={() => handleFocus('description')}
                                className={errors.description ? "add-recipe-error" : ""}
                                placeholder="Enter recipe description..."
                            />
                            {errors.description && <p className="add-recipe-error-message">{errors.description}</p>}
                        </label>
                    </div>
                    
                    <div className="add-recipe-button-container">
                        <button className="add-recipe-submit-button" type="submit">Add Recipe</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddFoodsRecipeModal;