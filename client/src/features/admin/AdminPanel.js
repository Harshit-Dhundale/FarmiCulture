import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import HeroHeader from "../../components/common/HeroHeader";
import ProductModal from "./ProductModal";
import "./AdminPanel.css";

const subCategories = {
  "Crop Seeds": ["Cereals", "Pulses", "Oilseeds", "Vegetables", "Fruits"],
  "Fertilizers": ["Nitrogen-based", "Phosphorus-based", "Potassium-based", "Complex"],
  "Pesticides": ["Insecticides", "Fungicides", "Herbicides", "Organic"],
  "Farming Equipment": ["Tillage", "Planting", "Irrigation", "Harvesting"]
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const navigate = useNavigate();

  // ----------------------
  // PRODUCT FILTER STATES
  // ----------------------
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSubCategory, setFilterSubCategory] = useState("All");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMinStock, setFilterMinStock] = useState("");
  const [filterMaxStock, setFilterMaxStock] = useState("");

  // ----------------------
  // ORDER FILTER STATES
  // ----------------------
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState("All");

  // MODAL (ADD/EDIT PRODUCTS)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // --------------------------------
  // FETCH PRODUCTS ON COMPONENT LOAD
  // --------------------------------
  const fetchProducts = () => {
    setLoadingProducts(true);
    axios.get("/api/products")
      .then((res) => {
        setProducts(res.data);
        setLoadingProducts(false);
      })
      .catch(() => {
        setGlobalError("Failed to load products");
        setLoadingProducts(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --------------------------------
  // FETCH ORDERS ON COMPONENT LOAD
  // --------------------------------
  useEffect(() => {
    setLoadingOrders(true);
    axios.get("/api/orders")
      .then((res) => {
        setOrders(res.data);
        setLoadingOrders(false);
      })
      .catch(() => {
        setGlobalError("Failed to load orders");
        setLoadingOrders(false);
      });
  }, []);

  // ----------------------
  // PRODUCT CRUD HANDLERS
  // ----------------------
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts(products.filter(prod => prod._id !== id));
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct._id}`, productData);
      } else {
        await axios.post("/api/products", productData);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product", error);
    }
  };

  // ----------------------
  // ORDER CRUD HANDLERS
  // ----------------------
  const deleteOrder = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await axios.delete(`/api/orders/${id}`);
        setOrders(orders.filter(order => order._id !== id));
      } catch (error) {
        console.error("Failed to delete order", error);
        alert("Failed to delete order. Please try again.");
      }
    }
  };

  // -----------------------------
  // FILTER: Products
  // -----------------------------
  const filteredProducts = products.filter(prod => {
    const catMatch = filterCategory === "All" || prod.category === filterCategory;
    const subCatMatch = filterSubCategory === "All" || prod.subCategory === filterSubCategory;
    const minPriceMatch = !filterMinPrice || prod.price >= Number(filterMinPrice);
    const maxPriceMatch = !filterMaxPrice || prod.price <= Number(filterMaxPrice);
    const minStockMatch = !filterMinStock || prod.stock >= Number(filterMinStock);
    const maxStockMatch = !filterMaxStock || prod.stock <= Number(filterMaxStock);

    return catMatch && subCatMatch && minPriceMatch && maxPriceMatch && minStockMatch && maxStockMatch;
  });

  const getFilterSubcategories = () => {
    if (filterCategory === "All") return [];
    return subCategories[filterCategory] || [];
  };

  // -----------------------------
  // FILTER: Orders by Delivery Status
  // -----------------------------
  const filteredOrders = orders.filter(order => {
    // “All” passes everything, otherwise match the order’s deliveryStatus
    return filterDeliveryStatus === "All"
      || order.deliveryStatus === filterDeliveryStatus;
  });

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div>
      <HeroHeader 
        title="Admin Panel" 
        subtitle="Manage your products and orders" 
        backgroundImage="/assets/head/profile.jpg"
      />

      <div className="admin-panel">
        {globalError && <p className="error">{globalError}</p>}

        <div className="admin-tabs">
          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Manage Products
          </button>
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Manage Orders
          </button>
        </div>

        {/* ------------------------------------ */}
        {/* TAB: Products                        */}
        {/* ------------------------------------ */}
        {activeTab === "products" && (
          <div className="admin-products">
            <div className="admin-products-header">
              <h2>Products</h2>
              <button className="btn btn-primary" onClick={openNewProductModal}>
                Add Product
              </button>
            </div>

            {/* Product Filter Panel */}
            <div className="admin-filter-panel">
              <div className="filter-group">
                <label>Category:</label>
                <select
                  value={filterCategory}
                  onChange={e => {
                    setFilterCategory(e.target.value);
                    setFilterSubCategory("All");
                  }}
                >
                  <option value="All">All</option>
                  {Object.keys(subCategories).map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {filterCategory !== "All" && (
                <div className="filter-group">
                  <label>Subcategory:</label>
                  <select
                    value={filterSubCategory}
                    onChange={e => setFilterSubCategory(e.target.value)}
                  >
                    <option value="All">All</option>
                    {getFilterSubcategories().map(sub => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label>Min Price:</label>
                <input
                  type="number"
                  value={filterMinPrice}
                  onChange={e => setFilterMinPrice(e.target.value)}
                  placeholder="₹"
                />
              </div>

              <div className="filter-group">
                <label>Max Price:</label>
                <input
                  type="number"
                  value={filterMaxPrice}
                  onChange={e => setFilterMaxPrice(e.target.value)}
                  placeholder="₹"
                />
              </div>

              <div className="filter-group">
                <label>Min Stock:</label>
                <input
                  type="number"
                  value={filterMinStock}
                  onChange={e => setFilterMinStock(e.target.value)}
                  placeholder="Stock"
                />
              </div>

              <div className="filter-group">
                <label>Max Stock:</label>
                <input
                  type="number"
                  value={filterMaxStock}
                  onChange={e => setFilterMaxStock(e.target.value)}
                  placeholder="Stock"
                />
              </div>
            </div>

            {/* Products Table */}
            {loadingProducts ? (
              <p>Loading products...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod, index) => (
                    <tr key={prod._id}>
                      <td>{index + 1}</td>
                      <td>
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      </td>
                      <td>{prod.name}</td>
                      <td>₹{prod.price}</td>
                      <td>{prod.category}</td>
                      <td>{prod.subCategory}</td>
                      <td>{prod.stock}</td>
                      <td>
                        <button
                          onClick={() => openEditProductModal(prod)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(prod._id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ------------------------------------ */}
        {/* TAB: Orders                          */}
        {/* ------------------------------------ */}
        {activeTab === "orders" && (
          <div className="admin-orders">
            <h2>Orders</h2>

            {/* Delivery Status Filter */}
            <div className="order-filter-panel">
              <label>Delivery Status:</label>
              <select
                value={filterDeliveryStatus}
                onChange={(e) => setFilterDeliveryStatus(e.target.value)}
              >
                <option value="All">All Delivery Statuses</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="out-for-delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Order ID</th>
                    <th>Order Date</th>
                    <th>User</th>
                    <th>Total Amount</th>
                    <th>Payment Status</th>
                    <th>Delivery Status</th>
                    <th>Estimated Delivery</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order._id}>
                      <td>{index + 1}</td>
                      <td>{order.orderId}</td>
                      <td>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        {order.user && order.user.username
                          ? order.user.username
                          : 'N/A'}
                      </td>
                      <td>₹{order.totalAmount}</td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.deliveryStatus}</td>
                      <td>
                        {order.estimatedDelivery
                          ? new Date(order.estimatedDelivery).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/order-details/${order._id}`)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => deleteOrder(order._id)}
                          style={{ marginLeft: "8px" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveProduct}
          initialData={editingProduct}
          subCategories={subCategories}
        />
      )}
    </div>
  );
};

export default AdminPanel;