import React, { useState } from 'react';
import PropTypes from 'prop-types';
import "./addSizeModal.css"; 

const API_BASE_URL = "http://127.0.0.1:8001"; 
const getAuthToken = () => localStorage.getItem("authToken");

function AddSizeModal({ product, onClose, onSizeAdded }) {
  const [sizeName, setSizeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sizeName.trim()) {
      setError("Size name cannot be empty.");
      return;
    }
    setError('');
    setIsLoading(true);

    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/is_products/products/${product.ProductID}/sizes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ SizeName: sizeName.trim() }),
      });

      const responseData = await response.json(); 

      if (!response.ok) {
        throw new Error(responseData.detail || `Failed to add size: ${response.status}`);
      }
      
      onSizeAdded(product.ProductID, responseData); 
      onClose(); 

    } catch (err) {
      console.error("Error adding size:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop"> {/* add css styling */}
      <div className="modal-content">
        <h2>Add Size for {product.ProductName}</h2>
        {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sizeName">Size Name:</label>
            <input
              type="text"
              id="sizeName"
              value={sizeName}
              onChange={(e) => setSizeName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" disabled={isLoading} className="button-primary">
              {isLoading ? 'Adding...' : 'Add Size'}
            </button>
            <button type="button" onClick={onClose} disabled={isLoading} className="button-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddSizeModal.propTypes = {
  product: PropTypes.shape({
    ProductID: PropTypes.number.isRequired,
    ProductName: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSizeAdded: PropTypes.func.isRequired,
};

export default AddSizeModal;