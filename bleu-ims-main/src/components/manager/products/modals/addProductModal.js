import React, { useState, useEffect } from "react";
import "./addProductModal.css"; 
import { toast } from 'react-toastify';

const API_PRODUCT_TYPE_URL = "http://127.0.0.1:8001/ProductType";
const API_PRODUCTS_URL = "http://127.0.0.1:8001/is_products/products/";

const getAuthToken = () => localStorage.getItem("authToken");

function AddProductModal({ onClose, onSubmit }) {
    const [productTypes, setProductTypes] = useState([]);
    const [productTypeID, setProductTypeID] = useState("");
    const [productName, setProductName] = useState("");
    const [productCategory, setProductCategory] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productSize, setProductSize] = useState(""); 
    const [productImageFile, setProductImageFile] = useState(null);

    const [errors, setErrors] = useState({
        productTypeID: "",
        productName: "",
        productCategory: "",
        productPrice: "",
        productSize: "", 
        productImageFile: "",
        general: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const selectedProductType = productTypes.find(
        (type) => type.productTypeID === parseInt(productTypeID)
    );
    const isSizeRequiredForSelectedType = selectedProductType?.SizeRequired === 1;

    useEffect(() => {
        const fetchProductTypes = async () => {
            const token = getAuthToken();
            if (!token) {
                setErrors(prev => ({...prev, general: "Authentication token not found."}));
                return;
            }
            try {
                const response = await fetch(`${API_PRODUCT_TYPE_URL}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    throw new Error(errData?.detail || "Failed to fetch product types");
                }
                const data = await response.json();
                setProductTypes(data); 
            } catch (error) {
                console.error("Error fetching product types:", error);
                setErrors(prev => ({...prev, general: error.message || "Failed to load product types."}));
            }
        };
        fetchProductTypes();
    }, []);

    useEffect(() => {
        if (productTypeID && !isSizeRequiredForSelectedType) {
            setProductSize("");
            setErrors(prev => ({ ...prev, productSize: "" }));
        }
    }, [productTypeID, isSizeRequiredForSelectedType]);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({...prev, productImageFile: "Please select an image file (jpeg, png, gif)."}));
                setProductImageFile(null);
                e.target.value = null;
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                 setErrors(prev => ({...prev, productImageFile: "File is too large. Max 5MB allowed."}));
                 setProductImageFile(null);
                 e.target.value = null;
                 return;
            }
            setProductImageFile(file);
            setErrors(prev => ({...prev, productImageFile: ""}));
        } else {
            setProductImageFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({ 
            productTypeID: "", productName: "", productCategory: "",
            productPrice: "", productSize: "", productImageFile: "", general: ""
        });

        let newErrors = {};
        if (!productTypeID) newErrors.productTypeID = "Product type is required";
        if (!productName.trim()) newErrors.productName = "Product name is required";
        if (!productCategory.trim()) newErrors.productCategory = "Category is required";
        if (!productPrice.trim()) {
            newErrors.productPrice = "Price is required";
        } else if (isNaN(parseFloat(productPrice)) || parseFloat(productPrice) < 0) {
            newErrors.productPrice = "Please enter a valid non-negative price.";
        }

        // validate productSize only if it's required for the selected type
        if (isSizeRequiredForSelectedType && !productSize.trim()) {
            newErrors.productSize = "Product size is required for this product type.";
        }

        // Validate productImageFile as required
        if (!productImageFile) {
            newErrors.productImageFile = "Product image is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({...prev, ...newErrors}));
            setIsLoading(false);
            return;
        }
        
        const token = getAuthToken();
        if (!token) {
            setErrors(prev => ({...prev, general: "Authentication token not found."}));
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("ProductName", productName.trim());
        formData.append("ProductTypeID", parseInt(productTypeID));
        formData.append("ProductCategory", productCategory.trim());
        formData.append("ProductDescription", productDescription.trim());
        formData.append("ProductPrice", parseFloat(productPrice));
        
        if (isSizeRequiredForSelectedType && productSize.trim()) {
            formData.append("ProductSize", productSize.trim());
        }
        
        formData.append("ProductImageFile", productImageFile);

        try {
            const response = await fetch(API_PRODUCTS_URL, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                const errorDetail = result.detail || (Array.isArray(result.detail) && result.detail[0]?.msg) || "Failed to add product.";
                throw new Error(errorDetail);
            }
            if (onSubmit) onSubmit(result);
            toast.success("Product added successfully");
            onClose();
        } catch (error) {
            console.error("Error adding product:", error);
            let displayError = error.message;
            if (typeof error.message === 'object' && error.message !== null) {
                displayError = JSON.stringify(error.message);
            }
            setErrors(prev => ({...prev, general: displayError || "An unexpected error occurred."}));
            toast.error(displayError || "Failed to add product");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (field) => {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "", general: "" }));
    };

    return (
        <div className="addProduct-modal-overlay">
            <div className="addProduct-modal-container">
                <div className="addProduct-modal-header">
                    <h3>Add Product</h3>
                    <span className="addProduct-close-button" onClick={onClose}>×</span>
                </div>
                {errors.general && <p className="addProduct-error-message general-error">{errors.general}</p>}
                <form className="addProduct-modal-form" onSubmit={handleSubmit}>
                    <label>
                        Product Type <span className="addProduct-required-asterisk">*</span>
                        <select
                            value={productTypeID}
                            onChange={(e) => {
                                setProductTypeID(e.target.value);
                            }}
                            onFocus={() => handleFocus('productTypeID')}
                            className={errors.productTypeID ? "addProduct-error-field" : ""}
                        >
                            <option value="">Select a product type</option>
                            {productTypes.map((type) => (
                                <option key={type.productTypeID} value={type.productTypeID}>
                                    {type.productTypeName}
                                </option>
                            ))}
                        </select>
                        {errors.productTypeID && <p className="addProduct-error-message">{errors.productTypeID}</p>}
                    </label>

                    <label>
                        Name <span className="addProduct-required-asterisk">*</span>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            onFocus={() => handleFocus('productName')}
                            className={errors.productName ? "addProduct-error-field" : ""}
                        />
                        {errors.productName && <p className="addProduct-error-message">{errors.productName}</p>}
                    </label>

                    <label>
                        Category <span className="addProduct-required-asterisk">*</span>
                        <input
                            type="text"
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                            onFocus={() => handleFocus('productCategory')}
                            className={errors.productCategory ? "addProduct-error-field" : ""}
                        />
                        {errors.productCategory && <p className="addProduct-error-message">{errors.productCategory}</p>}
                    </label>

                    <label>
                        Description
                        <textarea
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            onFocus={() => handleFocus('productDescription')} 
                            rows="3"
                        />
                    </label>
                    
                    <label>
                        Price <span className="addProduct-required-asterisk">*</span>
                        <input
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            onFocus={() => handleFocus('productPrice')}
                            className={errors.productPrice ? "addProduct-error-field" : ""}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                        />
                        {errors.productPrice && <p className="addProduct-error-message">{errors.productPrice}</p>}
                    </label>

                    {/* Conditional Product Size Input */}
                    {productTypeID && ( 
                        <label>
                            Size {isSizeRequiredForSelectedType && <span className="addProduct-required-asterisk">*</span>}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <select
                                    value={isSizeRequiredForSelectedType ? productSize : ""}
                                    onChange={isSizeRequiredForSelectedType ? (e) => setProductSize(e.target.value) : undefined}
                                    onFocus={isSizeRequiredForSelectedType ? () => handleFocus('productSize') : undefined}
                                    disabled={!isSizeRequiredForSelectedType}
                                    className={`${!isSizeRequiredForSelectedType ? "addProduct-na-field" : ""} ${isSizeRequiredForSelectedType && errors.productSize ? "addProduct-error-field" : ""}`}
                                    style={{ minWidth: 80 }}
                                >
                                    <option value="">Select size</option>
                                    <option value="12">12</option>
                                    <option value="16">16</option>
                                    <option value="22">22</option>
                                </select>
                            </div>
                            {isSizeRequiredForSelectedType && errors.productSize && <p className="addProduct-error-message">{errors.productSize}</p>}
                        </label>
                    )}

                    <label>
                        Image <span className="addProduct-required-asterisk">*</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            onFocus={() => handleFocus('productImageFile')}
                            className={errors.productImageFile ? "addProduct-error-field" : ""}
                        />
                        {productImageFile && (
                            <p className="addProduct-file-info">Selected file: {productImageFile.name}</p>
                        )}
                        {errors.productImageFile && (
                            <p className="addProduct-error-message">{errors.productImageFile}</p>
                        )}
                    </label>

                    <div className="addProduct-button-container">
                        <button 
                            className="addProduct-submit-button" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Adding..." : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProductModal;
