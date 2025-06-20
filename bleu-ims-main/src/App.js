import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Dashboard from './components/manager/dashboard/dashboard';
import RecipeManagement from './components/manager/recipeManagement/recipeManagement';
import Products from './components/manager/products/products';
import Ingredients from './components/manager/ingredients/ingredients';
import Supplies from './components/manager/supplies/supplies';
import Merchandise from './components/manager/merchandise/merchandise';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/manager/dashboard" element={<Dashboard />} />
        <Route path="/manager/recipeManagement" element={<RecipeManagement />} />
        <Route path="/manager/products" element={<Products />} />
        <Route path="/manager/ingredients" element={<Ingredients />} />
        <Route path="/manager/supplies" element={<Supplies />} />
        <Route path="/manager/merchandise" element={<Merchandise />} />
      </Routes>
    </Router>
  );
}

export default App;
