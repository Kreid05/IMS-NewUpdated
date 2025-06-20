import React from "react";
import "./viewDrinksRecipeModal.css";
import { FaTimes, FaEdit, FaArchive } from "react-icons/fa";

const ViewDrinksRecipeModal = ({ recipe, onClose, onEdit, onDelete }) => {
    if (!recipe) return null;

    return (
        <div className="view-recipe-modal-overlay">
            <div className="view-recipe-modal">
                <button className="view-recipe-close-button" onClick={onClose}><FaTimes /></button>
                
                <h2 className="view-recipe-name">{recipe.RecipeName}</h2>
                <div className="view-recipe-category-badge">{recipe.Category}</div>
                <hr className="view-recipe-divider" />

                <div className="view-recipe-modal-content">
                    <div className="view-recipe-section">
                        <div className="view-recipe-section-label">Description</div>
                        <div className="view-recipe-description">{recipe.Description}</div>
                    </div>
                    
                    <div className="view-recipe-section">
                        <div className="view-recipe-section-label">Ingredients</div>
                        {recipe.Ingredients && recipe.Ingredients.length > 0 ? (
                            <div className="view-recipe-ingredients-list">
                                {recipe.Ingredients.map((ingredient, index) => (
                                    <div key={index} className="view-recipe-ingredient-item">
                                        <span className="view-recipe-ingredient-name">{ingredient.IngredientName}</span>
                                        <span className="view-recipe-ingredient-amount">
                                            {ingredient.Amount} {ingredient.Measurement}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="view-recipe-empty-message">No ingredients added</div>
                        )}
                    </div>
                    
                    <div className="view-recipe-section">
                        <div className="view-recipe-section-label">Supplies</div>
                        {recipe.Materials && recipe.Materials.length > 0 ? (
                            <div className="view-recipe-supplies-list">
                                {recipe.Materials.map((material, index) => (
                                    <div key={index} className="view-recipe-supply-item">
                                        <span className="view-recipe-supply-name">{material.MaterialName}</span>
                                        <span className="view-recipe-supply-quantity">
                                            {material.Quantity} {material.Measurement}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="view-recipe-empty-message">No supplies added</div>
                        )}
                    </div>
                </div>

                <div className="view-recipe-modal-actions">
                    <button className="view-recipe-modal-edit-button" onClick={() => onEdit(recipe)}>
                        <FaEdit /> Edit
                    </button>
                    <button className="view-recipe-modal-delete-button" onClick={() => onDelete(recipe.RecipeID)}>
                        <FaArchive /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewDrinksRecipeModal;