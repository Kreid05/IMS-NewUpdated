import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import "./recipeManagement.css";
import Sidebar from "../../sidebar";
import { FaChevronDown, FaBell, FaFolderOpen, FaEdit, FaArchive } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddRecipeModal from "./modals/addRecipeModal";
import EditRecipeModal from "./modals/editRecipeModal";
import ViewRecipeModal from "./modals/viewRecipeModal";
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; // Import
import "../../reactConfirmAlert.css";

const RECIPE_API_URL = "http://127.0.0.1:8005/recipes/recipes/";
const PRODUCTS_API_URL = "http://127.0.0.1:8001/is_products/products/";
const INGREDIENTS_API_URL = "http://127.0.0.1:8002/ingredients/ingredients/";
const SUPPLIES_API_URL = "http://127.0.0.1:8003/materials/materials/";
const PRODUCT_TYPES_API_URL = "http://127.0.0.1:8001/ProductType/";

const getAuthToken = () => localStorage.getItem("authToken");
const DEFAULT_PROFILE_IMAGE = "https://media-hosting.imagekit.io/1123dd6cf5c544aa/screenshot_1746457481487.png?Expires=1841065483&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=kiHcXbHpirt9QHbMA4by~Kd4b2BrczywyVUfZZpks5ga3tnO8KlP8s5tdDpZQqinqOG30tGn0tgSCwVausjJ1OJ9~e6qPVjLXbglD-65hmsehYCZgEzeyGPPE-rOlyGJCgJC~GCZOu0jDKKcu2fefrClaqBBT3jaXoK4qhDPfjIFa2GCMfetybNs0RF8BtyKLgFGeEkvibaXhYxmzO8tksUKaLAMLbsPWvHBNuzV6Ar3mj~lllq7r7nrynNfdvbtuED7OGczSqZ8H-iopheAUhaWZftAh9tX2vYZCZZ8UztSEO3XUgLxMMtv9NnTeiomK00iJv1fgBjwR2lSqRk7w__";

function RecipeManagement() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [supplies, setSupplies] = useState([]);
    const [productTypes, setProductTypes] = useState([]); 
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [activeTab, setActiveTab] = useState(null); 
    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
    });

    const handleLogout = useCallback(() => { 
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('username'); 
        navigate('/'); }, [navigate]);
    useEffect(() => { 
        const token = getAuthToken(); 
        const storedUsername = localStorage.getItem("username"); 
        if (token && storedUsername) { 
            try { const decodedToken = jwtDecode(token); 
                setLoggedInUserDisplay({ name: storedUsername, role: decodedToken.role || "User" }); 
            } catch (error) { console.error("Failed to decode token:", error); handleLogout(); } 
        } else { navigate('/'); }
     }, [navigate, handleLogout]);

    const refreshAllData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
        const headers = {
        headers: { Authorization: `Bearer ${token}` }
        };

        const [recipesRes,productsRes,ingredientsRes,suppliesRes,typesRes] = await Promise.all([
        fetch(RECIPE_API_URL, headers),
        fetch(PRODUCTS_API_URL, headers),
        fetch(INGREDIENTS_API_URL, headers),
        fetch(SUPPLIES_API_URL, headers),
        fetch(PRODUCT_TYPES_API_URL, headers)
        ]);

        if (recipesRes.ok) {
        const recipes = await recipesRes.json();
        setRecipes(recipes);
        }

        if (productsRes.ok) {
        const products = await productsRes.json();
        setProducts(products);
        }

        if (ingredientsRes.ok) {
        const ingredients = await ingredientsRes.json();
        setIngredients(ingredients);
        }

        if (suppliesRes.ok) {
        const supplies = await suppliesRes.json();
        setSupplies(supplies);
        }

        if (typesRes.ok) {
        const types = await typesRes.json();
        setProductTypes(types);
        }
    } catch (error) {
        console.error("Error fetching application data:", error);
    }
    }, []);

    useEffect(() => {
    refreshAllData();
    }, [refreshAllData]);

    useEffect(() => {
        if (!activeTab && productTypes.length > 0) {
            setActiveTab(productTypes[0].productTypeName); 
        }
    }, [productTypes, activeTab]);

    const groupedRecipes = useMemo(() => {
        if (!Array.isArray(recipes) || !Array.isArray(products)) {
            return {};
        }
        const combinedData = recipes.map(recipe => {
            const product = products.find(
                p => String(p.ProductID) === String(recipe.ProductID)
            );
            if (!product) {
                console.warn(
                    `Could not find product with ID: ${recipe.ProductID} for recipe: ${recipe.RecipeName}`
                );
                return null;
            }
            return {
                id: recipe.RecipeID,
                name: recipe.RecipeName,
                description: product.ProductDescription,
                category: product.ProductCategory,
                productTypeName: product.ProductTypeName,
                fullRecipeData: recipe,
                fullProductData: product,
            };
        }).filter(Boolean);
        return combinedData.reduce((acc, recipe) => {
            const key = recipe.productTypeName;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(recipe);
            return acc;
        }, {});
    }, [recipes, products]);

    const handleView = (recipe) => {
        const recipeWithDetails = {
            ...recipe.fullRecipeData,
            description: recipe.description,
            category: recipe.category,
        };
        setSelectedRecipe(recipeWithDetails);
        setShowViewModal(true);
    };

    const handleEdit = (recipe) => {
        setSelectedRecipe(recipe.fullRecipeData);
        setShowEditModal(true);
    };

    const handleDelete = async (recipeId) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this merchandise item?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        const token = getAuthToken();
                        try {
                            const response = await fetch(`${RECIPE_API_URL}${recipeId}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            if (response.ok) {
                                toast.success("Recipe deleted successfully.");
                                refreshAllData();
                            } else {
                                const errorData = await response.json();
                                toast.error(`Failed to delete recipe: ${errorData.detail || response.statusText}`);
                            }
                        } catch (error) {
                            console.error("Delete recipe error:", error);
                            toast.error("An error occurred while deleting the recipe.");
                        }
                    }
                },
                {
                    label: 'No',
                    onClick: () => {}
                }
            ]
        });
    };

    return (
        <div className="recipeManagement">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Recipe Management" />

                <div className="recipeManagement-header">
                     <div className="recipe-top-row">
                        {productTypes.map(type => (
                            <button
                                key={type.productTypeID} 
                                className={`recipe-tab-button ${activeTab === type.productTypeName ? "active" : ""}`} 
                                onClick={() => setActiveTab(type.productTypeName)} 
                            >
                                {type.productTypeName}
                            </button>
                        ))}
                    </div>
                    <div className="recipe-bottom-row">
                        <input type="text" className="search-box" placeholder="Search recipes..."/>
                        <button className="add-recipe-button" onClick={() => setShowAddModal(true)}>+ Add Recipe</button>
                    </div>
                </div>

                <div className="recipeManagement-content">
                    <div className="recipe-grid">
                        {(groupedRecipes[activeTab] || []).map((recipe) => (
                            <div key={recipe.id} className="recipe-card">
                                <div className="recipe-card-header"><h3>{recipe.name}</h3><span className="recipe-category">{recipe.category}</span></div>
                                <p className="recipe-description">{recipe.description}</p>
                                <div className="recipe-actions">
                                    <button className="recipe-view-button" onClick={() => handleView(recipe)}>View Recipe</button>
                                    <button className="recipe-edit-button" onClick={() => handleEdit(recipe)}>Edit</button>
                                    <button className="recipe-delete-button" onClick={() => handleDelete(recipe.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {showAddModal && (
                    <AddRecipeModal
                        type={activeTab?.toLowerCase()}
                        onClose={() => setShowAddModal(false)}
                        onSubmit={refreshAllData}
                        products={products}
                        initialIngredients={ingredients}
                        supplies={supplies}
                    />
                )}
                {showEditModal && selectedRecipe && (
                    <EditRecipeModal
                        recipe={selectedRecipe}
                        onClose={() => setShowEditModal(false)}
                        onSuccess={() => {
                            setShowEditModal(false);
                            refreshAllData();
                        }}
                        products={products}
                        ingredients={ingredients}
                        supplies={supplies}
                    />
                )}
                {showViewModal && selectedRecipe && (
                    <ViewRecipeModal
                        recipe={selectedRecipe}
                        onClose={() => setShowViewModal(false)}
                        onEdit={() => {
                            setShowViewModal(false);
                            handleEdit({ fullRecipeData: selectedRecipe });
                        }}
                    />
                )}
                <ToastContainer />
            </div>
        </div>
    );
}

export default RecipeManagement;