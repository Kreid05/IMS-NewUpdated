import React, { useState, useEffect } from "react";
import "./productType.css";
import DataTable from "react-data-table-component";
import { FaEdit, FaArchive } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert"; // Import react-confirm-alert
import "../../reactConfirmAlert.css";

const API_BASE_URL = "http://127.0.0.1:8001/ProductType";
const getAuthToken = () => localStorage.getItem("authToken");

const ProductTypeModal = ({ onClose }) => {
    const [productTypes, setProductTypes] = useState([]);
    const [showAddFormModal, setShowAddFormModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [editTypeID, setEditTypeID] = useState(null);
    const [editTypeName, setEditTypeName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSizeRequired, setIsSizeRequired] = useState(false);

    useEffect(() => {
        fetchProductTypes();
    }, []);

    const fetchProductTypes = async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch product types.");
            }

            const data = await response.json();
            const formattedData = data.map(pt => ({ //ensure size required is treated as a boolean
                ...pt,
                SizeRequired: !!pt.SizeRequired // converts 1 to true, 0 to false   
            }));
            setProductTypes(formattedData);
        } catch (error) {
            console.error("Error fetching product types:", error);
            toast.error("Failed to fetch product types.");
        }
    };

    const handleAddType = async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        if (newTypeName.trim() === "") {
            toast.error("Product type name cannot be empty.");
            return;
        }

        try {
            const payload = {
                productTypeName: newTypeName,
                SizeRequired: isSizeRequired ? 1 : 0, // send 1 for true, 0 for false
            };
            const response = await fetch(`${API_BASE_URL}/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to add product type.");
            }
            setNewTypeName("");
            setIsSizeRequired(false); // reset checkbox
            setShowAddFormModal(false);
            fetchProductTypes();
            toast.success("Product type added successfully!");
        } catch (error) {
            console.error("Error adding product type:", error);
            toast.error("Failed to add product type.");
        }
    };

    const handleEdit = (type) => {
        setEditTypeID(type.productTypeID);
        setEditTypeName(type.productTypeName);
        setIsSizeRequired(!!type.SizeRequired); 
        setIsSizeRequired(type.SizeRequired === 1); 
        setIsEditing(true);
    };

    const handleUpdateType = async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        if (editTypeName.trim() === "") {
            toast.error("Product type name cannot be empty.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${editTypeID}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                        productTypeName: editTypeName,
                        SizeRequired: isSizeRequired ? 1 : 0,      
                    }),
                });

            if (!response.ok) throw new Error("Failed to update product type.");

            setIsEditing(false);
            setEditTypeID(null);
            setEditTypeName("");
            fetchProductTypes();
            toast.success("Product type updated successfully!");
        } catch (error) {
            console.error("Error updating product type:", error);
            toast.error("Failed to update product type.");
        }
    };

    const handleDelete = (typeId) => {
        confirmAlert({
            title: "Confirm to delete",
            message: "Are you sure you want to delete this product type?",
            parentElement: document.querySelector('.modal-content'),
            buttons: [
                {
                    label: "Yes",
                    onClick: async () => {
                        const token = getAuthToken();
                        if (!token) {
                            toast.error("Authentication token not found.");
                            return;
                        }
                        try {
                            const response = await fetch(`${API_BASE_URL}/${typeId}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || "Failed to delete product type.");
                            }

                            setProductTypes((prev) => prev.filter((pt) => pt.productTypeID !== typeId));
                            toast.success("Product type deleted successfully!");
                        } catch (error) {
                            console.error("Error deleting product type:", error);
                            toast.error("Failed to delete product type.");
                        }
                    },
                },
                {
                    label: "No",
                    onClick: () => {}, // Do nothing on cancel
                },
            ],
        });
    };

    const columns = [
        { name: "NO.", selector: (row, index) => index + 1, width: "10%" },
        { name: "NAME", selector: (row) => row.productTypeName, width: "40%", sortable: true },
        {
            name: "Size Required",
            selector: (row) => (row.SizeRequired ? "Yes" : "No"), 
            center: true,
            width: "20%"
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="action-buttons">
                    <div className="tooltip-container">
                        <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                        <span className="tooltip-text">Edit</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button delete" onClick={() => handleDelete(row.productTypeID)}><FaArchive /></button>
                        <span className="tooltip-text">Delete</span>
                    </div>
                </div>
            ),
            width: "30%",
            center: true,
            ignoreRowClick: true,
        },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Manage Product Types</h2>
                    <div className="button-container-right">
                        <button onClick={() => setShowAddFormModal(true)} className="add-Product-Type">Add Product Type</button>
                    </div>
                </div>

                <DataTable 
                    columns={columns} 
                    data={productTypes} 
                    pagination 
                    customStyles={{
                        headCells: {
                            style: {
                                backgroundColor: "#4B929D",
                                color: "#fff",
                                fontWeight: "600",
                                fontSize: "14px",
                                padding: "12px",
                                textTransform: "uppercase",
                                textAlign: "center",
                                letterSpacing: "1px",
                            },
                        },
                        rows: {
                            style: {
                                minHeight: "55px",
                            },
                        },
                    }}
                />

                {showAddFormModal && (
                    <div className="modal-overlay">
                        <div className="form-modal">
                            <h3>Add New Product Type</h3>
                            <input
                                type="text"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="Enter type name"
                            />
                            <div className="form-group-checkbox">
                                <input
                                    type="checkbox"
                                    id="sizeRequired"
                                    checked={isSizeRequired}
                                    onChange={(e) => setIsSizeRequired(e.target.checked)}
                                />
                                <label htmlFor="sizeRequired">Size Required?</label>
                            </div>
                            <div className="newProductType-modal-actions">
                                <button onClick={handleAddType} className="newProductType-button-primary">Add</button>
                                <button onClick={() => setShowAddFormModal(false)} className="newProductType-button-secondary">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {isEditing && (
                    <div className="modal-overlay">
                        <div className="form-modal">
                            <h3>Edit Product Type</h3>
                            <form onSubmit={handleUpdateType}>
                                <input
                                    type="text"
                                    value={editTypeName}
                                    onChange={(e) => setEditTypeName(e.target.value)}
                                    placeholder="Edit type name"
                                />
                                <div className="form-group-checkbox">
                                    <input
                                        type="checkbox"
                                        id="editSizeRequired"
                                        checked={isSizeRequired}
                                        onChange={(e) => setIsSizeRequired(e.target.checked)}
                                    />
                                    <label htmlFor="editSizeRequired">Size Required?</label>
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="update-Button">Update</button>
                                    <button onClick={() => setIsEditing(false)} className="cancel-Update">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <button onClick={onClose} className="button-secondary" style={{ marginTop: "1em" }}>
                    Close
                </button>
                <ToastContainer />
            </div>
        </div>
    );
};

export default ProductTypeModal;
