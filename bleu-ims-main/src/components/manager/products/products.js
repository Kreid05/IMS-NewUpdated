import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./products.css"; 
import Sidebar from "../../sidebar"; 
import { FaChevronDown, FaEye, FaEdit, FaArchive } from "react-icons/fa";
import DataTable from "react-data-table-component";
import ProductTypeModal from './productType';
import AddProductModal from './modals/addProductModal';
import EditProductModal from './modals/editProductModal';
import ViewProductModal from './modals/viewProductModal';
import AddSizeModal from './modals/addSizeModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { confirmAlert } from 'react-confirm-alert';
import "../../reactConfirmAlert.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import loadingAnimation from "../../../assets/animation/loading.webm";

const API_BASE_URL = "http://127.0.0.1:8001";
const getAuthToken = () => localStorage.getItem("authToken"); 
const DEFAULT_PROFILE_IMAGE = "https://media-hosting.imagekit.io/1123dd6cf5c544aa/screenshot_1746457481487.png?Expires=1841065483&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=kiHcXbHpirt9QHbMA4by~Kd4b2BrczywyVUfZZpks5ga3tnO8KlP8s5tdDpZQqinqOG30tGn0tgSCwVausjJ1OJ9~e6qPVjLXbglD-65hmsehYCZgEzeyGPPE-rOlyGJCgJC~GCZOu0jDKKcu2fefrClaqBBT3jaXoK4qhDPfjIFa2GCMfetybNs0RF8BtyKLgFGeEkvibaXhYxmzO8tksUKaLAMLbsPWvHBNuzV6Ar3mj~lllq7r7nrynNfdvbtuED7OGczSqZ8H-iopheAUhaWZftAh9tX2vYZCZZ8UztSEO3XUgLxMMtv9NnTeiomK00iJv1fgBjwR2lSqRk7w__";

function Products() {
  const currentDate = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });

  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showProductTypeModal, setShowProductTypeModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [viewedProduct, setViewedProduct] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("nameAsc");
  const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [productForSizeAddition, setProductForSizeAddition] = useState(null);

  // authentication and authorization
  useEffect(() => {
    const token = getAuthToken();
    const storedUsername = localStorage.getItem("username");

    if (token && storedUsername) {
      try {
        const decodedToken = jwtDecode(token);
        setLoggedInUserDisplay({
          name: storedUsername,
          role: decodedToken.role || "User"
        });
      } catch (error) {
        console.error("Error decoding token:", error);
        handleLogout();
      }
    } else {
      console.log("No session found. Redirecting to login.");
      navigate('/');
    }
  }, [navigate]);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSortChange = (e) => setSortOption(e.target.value);

  const sortProducts = (list) => {
    if (!Array.isArray(list) || list.some(item => typeof item.ProductName !== 'string')) {
        return list;
    }
    if (sortOption === "nameAsc") {
      return [...list].sort((a, b) => a.ProductName.localeCompare(b.ProductName));
    } else if (sortOption === "nameDesc") {
      return [...list].sort((a, b) => b.ProductName.localeCompare(a.ProductName));
    }
    return list;
  };

  // data fetching
  const fetchProductTypes = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/ProductType/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch product types: ${response.status} ${errorData}`);
      }
      const data = await response.json();
      setProductTypes(data); 
      if (data.length > 0 && activeTab === null) {
        setActiveTab(data[0].productTypeID);
      }
    } catch (error) {
      console.error("Failed to fetch product types:", error);
    }
  }, [activeTab]);

  const fetchProducts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/is_products/products/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch products: ${response.status} ${errorData}`);
      }
      const data = await response.json(); 
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
  }, [fetchProductTypes, fetchProducts]);

  const handleView = (product) => setViewedProduct(product);

  const handleEdit = (product) => {
    setEditModalData({
      productID: product.ProductID,
      productTypeID: product.ProductTypeID,
      productName: product.ProductName,
      productCategory: product.ProductCategory,
      productDescription: product.ProductDescription,
      productPrice: product.ProductPrice,
      productImage: product.ProductImage,
      productSize: product.ProductSizes && product.ProductSizes.length > 0 ? product.ProductSizes[0] : "",
    });
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = (updatedProductFromModal) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.ProductID === updatedProductFromModal.ProductID ? updatedProductFromModal : p))
    );
    setShowEditProductModal(false);
    setEditModalData(null);
  };

  const handleProductAdded = (newProductFromModal) => {
    setProducts((prevProducts) => [...prevProducts, newProductFromModal]);
    setShowAddProductModal(false);
  };

  const handleDelete = (id) => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this product?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            const token = getAuthToken();
            if (!token) {
              toast.error("Authentication token not found.");
              return;
            }
            fetch(`${API_BASE_URL}/is_products/products/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(async (res) => {
                if (!res.ok) {
                  const errorData = await res.text();
                  throw new Error(`Delete failed: ${res.status}. ${errorData}`);
                }
                setProducts((prev) => prev.filter((p) => p.ProductID !== id));
                toast.success("Deleted successfully");
              })
              .catch((err) => {
                console.error("Error deleting product:", err);
                fetchProducts();
                toast.error("Delete failed");
              });
          }
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  };

  const handleOpenAddSizeModal = (product) => {
    setProductForSizeAddition(product);
    setShowAddSizeModal(true);
  };

  const handleSizeAdded = (productId, newSizeData) => {
    fetchProducts(); 
    setShowAddSizeModal(false);
    setProductForSizeAddition(null);
    toast.success(`Size '${newSizeData.SizeName}' added to product ID ${productId}.`);
  };

  const columns = [
    { name: "NO.", selector: (row, i) => i + 1, width: "5%", center: true },
    {
      name: "IMAGE",
      cell: (row) => {
        const imageUrl = row.ProductImage ? row.ProductImage : DEFAULT_PROFILE_IMAGE;
        return (
            <img
                src={imageUrl}
                alt={row.ProductName}
                className="product-photo"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PROFILE_IMAGE;
                }}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
            />
        );
      },
      width: "12%", center: true, ignoreRowClick: true, allowOverflow: true,
    },
    { name: "NAME", selector: (row) => row.ProductName, wrap: true, width: "14%" },
    {
      name: "SIZE",
      selector: (row) =>
        row.ProductSizes && row.ProductSizes.length > 0
          ? row.ProductSizes.join(", ")
          : "N/A",
      width: "10%", center: true, wrap: true,
    },
    { name: "DESCRIPTION", selector: (row) => row.ProductDescription, wrap: true, center: true, width: "17%" },
    { name: "CATEGORY", selector: (row) => row.ProductCategory, wrap: true, center: true, width: "14%" },
    {
      name: "PRICE",
      selector: (row) => `₱${parseFloat(row.ProductPrice).toFixed(2)}`,
      sortable: true, center: true, wrap: true, width: "10%",
    },
    {
      name: "ACTIONS",
      cell: (row) => (
        <div className="action-buttons">
          <button className="action-button view" title="View Product" onClick={() => handleView(row)}><FaEye /></button>
          <button className="action-button edit" title="Edit Product" onClick={() => handleEdit(row)}><FaEdit /></button>
          <button className="action-button delete" title="Delete Product" onClick={() => handleDelete(row.ProductID)}><FaArchive /></button>
        </div>
      ),
      ignoreRowClick: true, width: "18%", center: true,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    navigate('/');
  };

  const filteredProducts = sortProducts(
    products.filter(product =>
      product &&
      (activeTab === null || product.ProductTypeID === activeTab) && 
      (product.ProductName && product.ProductName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return (
    <div className="products">
      <Sidebar />
      <div className="roles">

        <Header pageTitle="Product Management" />

        <div className="product-header">
          <div className="product-top-row">
            {productTypes.map((type) => ( 
              <button
                key={type.productTypeID}
                className={`product-tab-button ${activeTab === type.productTypeID ? "active" : ""}`}
                onClick={() => setActiveTab(type.productTypeID)}
              >
                {type.productTypeName}
              </button>
            ))}
          </div>

          <div className="product-bottom-row">
            <input
              type="text"
              className="product-search-box"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="sort-product-container">
              <label htmlFor="sort-product">Sort by:</label>
              <select
                id="sort-product"
                className="sort-product-select"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="nameAsc">Name A-Z</option>
                <option value="nameDesc">Name Z-A</option>
              </select>
            </div>
            <button className="add-product-button" onClick={() => setShowAddProductModal(true)}>+ Add Product</button>
            <button className="product-type-button" onClick={() => setShowProductTypeModal(true)}>Product Type</button>
          </div>
        </div>

        <div className="products-content">
          {loading ? (
            <div className="loading-container">
              <video
                src={loadingAnimation}
                autoPlay
                loop
                muted
                className="loading-animation"
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredProducts}
              striped
              highlightOnHover
              responsive
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
                rows: { style: { minHeight: "72px", alignItems: 'center' } },
                cells: { style: { paddingLeft: '16px', paddingRight: '16px', textAlign: 'left' } },
              }}
              noDataComponent={<div>No products found.</div>}
              paginationComponentOptions={{
                  rowsPerPageText: 'Rows per page:',
                  rangeSeparatorText: 'of',
                  selectAllRowsItem: true,
                  selectAllRowsItemText: 'All',
              }}
            />
          )}
        </div>
      </div>

      {viewedProduct && (
        <ViewProductModal
          product={viewedProduct} 
          imageBaseUrl={API_BASE_URL}
          onClose={() => setViewedProduct(null)}
          onEdit={handleEdit}
          onDelete={(id) => {
            handleDelete(id);
            setViewedProduct(null);
          }}
        />
      )}

      {showProductTypeModal && (
        <ProductTypeModal 
          onClose={() => setShowProductTypeModal(false)}
          onProductTypeAdded={() => {
            fetchProductTypes(); 
            setShowProductTypeModal(false);
          }}
        />
      )}

      {showAddProductModal && (
        <AddProductModal
          productTypes={productTypes} 
          onClose={() => setShowAddProductModal(false)}
          onSubmit={(newProduct) => setProducts((prev) => [...prev, newProduct])}
          onProductAdded={handleProductAdded}
        />
      )}

      {showEditProductModal && editModalData && (
        <EditProductModal
          product={editModalData} 
          productTypes={productTypes} 
          onClose={() => {
            setShowEditProductModal(false);
            setEditModalData(null);
          }}
          onUpdate={handleUpdateProduct}
        />
      )}

      {showAddSizeModal && productForSizeAddition && (
        <AddSizeModal
          product={productForSizeAddition} 
          onClose={() => {
            setShowAddSizeModal(false);
            setProductForSizeAddition(null);
          }}
          onSizeAdded={handleSizeAdded}
        />
      )}
      <ToastContainer />
    </div>
  );
}
 
export default Products;
