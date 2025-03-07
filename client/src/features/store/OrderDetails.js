import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiClipboard,
  FiClock,
  FiUser,
  FiMapPin,
  FiDollarSign,
} from "react-icons/fi";
import HeroHeader from "../../components/common/HeroHeader";
import "./OrderDetails.css";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const getStatusBadge = (status) => {
    const statusColors = {
      paid: "#28a745",
      pending: "#ffc107",
      failed: "#dc3545",
      processing: "#17a2b8",
      shipped: "#007bff",
      delivered: "#28a745",
    };

    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: statusColors[status.toLowerCase()] || "#6c757d",
        }}
      >
        {status}
      </span>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );

  if (!order) return <p className="error-message">Order not found.</p>;

  return (
    <div className="order-details">
      <HeroHeader
        title={`Order #${order.orderId}`}
        subtitle="Detailed view of your order"
        backgroundImage="/assets/head/order-history.jpg"
      />

      <div className="order-details-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>

        {/* Horizontal Layout */}
        <div className="horizontal-layout">
          {/* Left Column */}
          <div className="left-column">
            {/* Order Overview Card */}
            <div className="card overview-card">
              <h2>
                <FiClipboard /> Order Overview
              </h2>
              <div className="overview-grid">
                <div className="overview-item">
                  <FiUser className="icon" />
                  <div>
                    <label>Customer</label>
                    <p>{order.user?.username || order.user?.email || "N/A"}</p>
                  </div>
                </div>
                <div className="overview-item">
                  <FiClock className="icon" />
                  <div>
                    <label>Order Date</label>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="overview-item">
                  <FiDollarSign className="icon" />
                  <div>
                    <label>Total Amount</label>
                    <p>₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="overview-item">
                  <FiTruck className="icon" />
                  <div>
                    <label>Delivery Status</label>
                    {getStatusBadge(order.deliveryStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information Card */}
            <div className="card shipping-card">
              <h2>
                <FiMapPin /> Shipping Details
              </h2>
              <div className="shipping-info">
                <p className="address-line">{order.shippingAddress.street}</p>
                <p className="address-line">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p className="address-line">
                  {order.shippingAddress.postalCode},{" "}
                  {order.shippingAddress.country}
                </p>
                <div className="delivery-estimate">
                  <FiClock className="icon" />
                  <span>
                    Estimated Delivery:{" "}
                    {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Order Items Card */}
            <div className="card items-card">
              <h2>
                <FiPackage /> Order Items
              </h2>
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((item) => (
                      <tr key={item.product._id}>
                        <td className="product-cell">
                          <img
                            src={
                              item.product?.imageUrl
                                ? item.product.imageUrl.startsWith("/")
                                  ? item.product.imageUrl
                                  : "/" + item.product.imageUrl
                                : "/assets/products/default.jpg"
                            }
                            alt={item.product?.name || "Product"}
                            className="product-image"
                          />
                          <span>{item.product.name}</span>
                        </td>
                        <td>₹{item.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Information Card (Only if Razorpay ID exists) */}
            {order.razorpayPaymentId && (
              <div className="card payment-card">
                <h2>
                  <FiCreditCard /> Payment Details
                </h2>
                <div className="payment-details">
                  <div className="payment-item">
                    <label>Payment Status:</label>
                    {getStatusBadge(order.paymentStatus)}
                  </div>
                  <div className="payment-item">
                    <label>Razorpay Order ID:</label>
                    <span
                      className="clickable-id"
                      onClick={() => copyToClipboard(order.razorpayOrderId)}
                    >
                      {order.razorpayOrderId}
                    </span>
                  </div>
                  <div className="payment-item">
                    <label>Payment ID:</label>
                    <span
                      className="clickable-id"
                      onClick={() => copyToClipboard(order.razorpayPaymentId)}
                    >
                      {order.razorpayPaymentId}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
