import React from 'react';
import './viewRecipeModal.css';

function ViewRecipeModal({ recipe, onClose, onEdit }) {
    console.log("Recipe data passed to View Modal:", recipe);

    return (
        <div className="viewRecipe-modal-overlay">
            <div className="viewRecipe-modal-container">
                <div className="viewRecipe-modal-header">
                    <h3>Recipe Details</h3>
                    <span className="viewRecipe-close-button" onClick={onClose}>×</span>
                </div>
                <div className="viewRecipe-modal-content">
                    <div className="recipe-detail">
                        <h4>Product Name</h4>
                        <p>{recipe.RecipeName}</p>
                    </div>

                    <div className="recipe-detail">
                        <h4>Description</h4>
                        <p>{recipe.description || 'No description available.'}</p>
                    </div>

                    <div className="recipe-detail">
                        <h4>Category</h4>
                        <p>{recipe.category || 'No category available.'}</p>
                    </div>

                    {/*ingredients section*/}
                    <div className="recipe-detail">
                        <h4>Ingredients</h4>
                        <div className="ingredients-list">
                            {/* check if ingredients exist and the array is not empty */}
                            {recipe.Ingredients && recipe.Ingredients.length > 0 ? (
                                recipe.Ingredients.map((ingredient, index) => (
                                    <div key={index} className="ingredient-item">
                                        <span>{ingredient.IngredientName}</span>
                                        <span>{ingredient.Amount} {ingredient.Measurement}</span>
                                    </div>
                                ))
                            ) : (
                                <p>No ingredients listed for this recipe.</p>
                            )}
                        </div>
                    </div>

                    {/*materials section */}
                    <div className="recipe-detail">
                        <h4>Supplies and Materials</h4>
                        <div className="ingredients-list"> 
                            {/* check if materials exist and the array is not empty */}
                            {recipe.Materials && recipe.Materials.length > 0 ? (
                                recipe.Materials.map((material, index) => (
                                    <div key={index} className="ingredient-item">
                                        <span>{material.MaterialName}</span>
                                        <span>{material.Quantity} {material.Measurement}</span>
                                    </div>
                                ))
                            ) : (
                                <p>No materials listed for this recipe.</p>
                            )}
                        </div>
                    </div>

                    <div className="viewRecipe-button-container">
                        <button
                            className="viewRecipe-edit-button"
                            onClick={() => onEdit(recipe)}
                        >
                            Edit Recipe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewRecipeModal;