import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QueryManagement from './QueryManagement';
import QueryReport from './QueryReport';

function SalesPage() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock_quantity: '' });
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [editProduct, setEditProduct] = useState(null);
  const [editService, setEditService] = useState(null);
  const [activeSection, setActiveSection] = useState('queryReport');

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Invalid token:', e);
      return null;
    }
  };
  const userRole = decodeToken(token)?.role;

  useEffect(() => {
    if (userRole !== 'sales') {
      navigate('/'); // Redirect if not sales
      return;
    }
    fetchData();
  }, [navigate, userRole]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchProducts(), fetchServices()]);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const response = await fetch('http://localhost:5000/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid products data');
    setProducts(result.data);
  };

  const fetchServices = async () => {
    const response = await fetch('http://localhost:5000/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch services');
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid services data');
    setServices(result.data);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity, 10),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewProduct({ name: '', description: '', price: '', stock_quantity: '' });
        fetchProducts();
        alert('Product added successfully!');
      } else {
        setError(data.error || 'Failed to add product');
      }
    } catch (err) {
      setError('Failed to add product: ' + err.message);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newService.name,
          description: newService.description,
          price: parseFloat(newService.price),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewService({ name: '', description: '', price: '' });
        fetchServices();
        alert('Service added successfully!');
      } else {
        setError(data.error || 'Failed to add service');
      }
    } catch (err) {
      setError('Failed to add service: ' + err.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editProduct.name,
          description: editProduct.description,
          price: parseFloat(editProduct.price),
          stock_quantity: parseInt(editProduct.stock_quantity, 10),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEditProduct(null);
        fetchProducts();
        alert('Product updated successfully!');
      } else {
        setError(data.error || 'Failed to update product');
      }
    } catch (err) {
      setError('Failed to update product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchProducts();
        alert('Product deleted successfully!');
      } else {
        setError(data.error || 'Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product: ' + err.message);
    }
  };

  const handleEditService = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/services/${editService.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editService.name,
          description: editService.description,
          price: parseFloat(editService.price),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEditService(null);
        fetchServices();
        alert('Service updated successfully!');
      } else {
        setError(data.error || 'Failed to update service');
      }
    } catch (err) {
      setError('Failed to update service: ' + err.message);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchServices();
        alert('Service deleted successfully!');
      } else {
        setError(data.error || 'Failed to delete service');
      }
    } catch (err) {
      setError('Failed to delete service: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
          color: '#fff',
          fontSize: '24px',
        }}
      >
        Loading sales data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
          color: '#ff4d4d',
          fontSize: '24px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        {error}
        <button
          onClick={fetchData}
          style={{
            marginLeft: '20px',
            padding: '10px 20px',
            background: '#24cf5f',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
        padding: '40px 20px',
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            marginBottom: '40px',
            background: 'linear-gradient(45deg, #24cf5f, #fbcf34)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Sales Dashboard
        </h1>

        {/* Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '40px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setActiveSection('queryReport')}
            style={{
              padding: '12px 20px',
              background: activeSection === 'queryReport' ? '#24cf5f' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s',
            }}
          >
            Query Report
          </button>
          <button
            onClick={() => setActiveSection('queryManagement')}
            style={{
              padding: '12px 20px',
              background: activeSection === 'queryManagement' ? '#24cf5f' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s',
            }}
          >
            Query Management
          </button>
          <button
            onClick={() => setActiveSection('products')}
            style={{
              padding: '12px 20px',
              background: activeSection === 'products' ? '#24cf5f' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s',
            }}
          >
            Products
          </button>
          <button
            onClick={() => setActiveSection('services')}
            style={{
              padding: '12px 20px',
              background: activeSection === 'services' ? '#24cf5f' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s',
            }}
          >
            Services
          </button>
        </div>

        {/* Sections */}
        {activeSection === 'queryReport' && (
          <div
            style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '20px',
              }}
            >
              Query Report
            </h2>
            <QueryReport />
          </div>
        )}

        {activeSection === 'queryManagement' && (
          <div
            style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '20px',
              }}
            >
              Customer Queries
            </h2>
            <QueryManagement />
          </div>
        )}

        {activeSection === 'products' && (
          <div
            style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '20px',
              }}
            >
              Add New Product
            </h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Product Name"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                required
              />
              <input
                type="text"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Description"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
              />
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="Price (M)"
                step="0.01"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                required
              />
              <input
                type="number"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                placeholder="Stock Quantity"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                required
              />
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  background: '#24cf5f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Add Product
              </button>
            </form>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#fff',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >
              Products
            </h2>
            {products.length > 0 ? (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(45deg, #24cf5f, #1ab54a)',
                      color: '#fff',
                    }}
                  >
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      ID
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Name
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Price (M)
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Stock
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {product.id}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {product.name}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {parseFloat(product.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {product.stock_quantity}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        <button
                          onClick={() => setEditProduct(product)}
                          style={{
                            padding: '8px 12px',
                            background: '#fbcf34',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginRight: '10px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          style={{
                            padding: '8px 12px',
                            background: '#ff4d4d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p
                style={{
                  textAlign: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  padding: '20px',
                }}
              >
                No products found
              </p>
            )}
          </div>
        )}

        {activeSection === 'services' && (
          <div
            style={{
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '20px',
              }}
            >
              Add New Service
            </h2>
            <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Service Name"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                required
              />
              <input
                type="text"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Description"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
              />
              <input
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                placeholder="Price (M)"
                step="0.01"
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                required
              />
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  background: '#24cf5f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Add Service
              </button>
            </form>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#fff',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >
              Services
            </h2>
            {services.length > 0 ? (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(45deg, #24cf5f, #1ab54a)',
                      color: '#fff',
                    }}
                  >
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      ID
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Name
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Description
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Price (M)
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '16px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {service.id}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {service.name}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {service.description}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        {parseFloat(service.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px', color: '#fff', fontSize: '15px' }}>
                        <button
                          onClick={() => setEditService(service)}
                          style={{
                            padding: '8px 12px',
                            background: '#fbcf34',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginRight: '10px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          style={{
                            padding: '8px 12px',
                            background: '#ff4d4d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p
                style={{
                  textAlign: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  padding: '20px',
                }}
              >
                No services found
              </p>
            )}
          </div>
        )}

        {/* Edit Product Modal */}
        {editProduct && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '30px',
                borderRadius: '15px',
                width: '400px',
                maxWidth: '90%',
                color: '#fff',
              }}
            >
              <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Edit Product</h2>
              <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  placeholder="Product Name"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                  required
                />
                <input
                  type="text"
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  placeholder="Description"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                />
                <input
                  type="number"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  placeholder="Price (M)"
                  step="0.01"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                  required
                />
                <input
                  type="number"
                  value={editProduct.stock_quantity}
                  onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: e.target.value })}
                  placeholder="Stock Quantity"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: '#24cf5f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProduct(null)}
                    style={{
                      padding: '10px 20px',
                      background: '#ff4d4d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {editService && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '30px',
                borderRadius: '15px',
                width: '400px',
                maxWidth: '90%',
                color: '#fff',
              }}
            >
              <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Edit Service</h2>
              <form onSubmit={handleEditService} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  type="text"
                  value={editService.name}
                  onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                  placeholder="Service Name"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                  required
                />
                <input
                  type="text"
                  value={editService.description}
                  onChange={(e) => setEditService({ ...editService, description: e.target.value })}
                  placeholder="Description"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                />
                <input
                  type="number"
                  value={editService.price}
                  onChange={(e) => setEditService({ ...editService, price: e.target.value })}
                  placeholder="Price (M)"
                  step="0.01"
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: '#24cf5f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditService(null)}
                    style={{
                      padding: '10px 20px',
                      background: '#ff4d4d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesPage;