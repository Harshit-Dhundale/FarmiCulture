// client/src/features/store/Checkout.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import HeroHeader from '../../components/common/HeroHeader';
import { useAuth } from '../../context/AuthContext';
import './Checkout.css';
import { FiArrowLeft, FiCreditCard, FiTruck } from 'react-icons/fi';

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState({
    street: currentUser?.address?.street || '',
    city: currentUser?.address?.city || '',
    state: currentUser?.address?.state || '',
    postalCode: currentUser?.address?.postalCode || '',
    country: currentUser?.address?.country || 'India'
  });

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(storedCart);
    setTotal(storedCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
  }, []);

  const handleAddressChange = (e) => {
    setShippingAddress(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.postalCode) {
      alert('Please fill in all required address fields.');
      return;
    }
  
    if (!cart.length) {
      alert('Your cart is empty');
      return;
    }
  
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Payment gateway failed to load');
  
      const orderData = {
        user: currentUser._id,
        products: cart.map(item => ({
          product: item.product._id, 
          quantity: Number(item.quantity),
          price: parseFloat(item.product.price)
        })),
        totalAmount: parseFloat(total.toFixed(2)),
        shippingAddress
      };
  
      const { data } = await axios.post('/api/orders/create', orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      console.log('Order creation response:', data); // 🔹 Debug log
  
      // ✅ Validate Razorpay response
      if (!data?.razorpayOrder?.id || !data?.order?.orderId) {
        throw new Error('Invalid order creation response');
      }
  
      if (!window.Razorpay) {
        throw new Error('Razorpay not loaded');
      }
  
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "FarmiCulture Equipment",
        description: `Order ${data.order.orderId}`,
        order_id: data.razorpayOrder.id,
        handler: async (response) => {
          try {
            const { data: verification } = await axios.post('/api/orders/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
  
            if (verification.success) {
              localStorage.removeItem('cart');
              navigate('/payment-success', {
                state: {
                  orderId: verification.order.orderId,
                  amount: verification.order.totalAmount,
                  deliveryDate: verification.deliveryDate
                }
              });
            } else {
              navigate('/payment-failed', {
                state: { error: verification.error }
              });
            }
          } catch (error) {
            console.error("Verification error:", error);
            navigate('/payment-failed', {
              state: { error: error.response?.data?.error || 'Payment verification failed' }
            });
          }
        },
        prefill: {
          name: currentUser.username || currentUser.fullName,
          email: currentUser.email,
          contact: currentUser.phone || "9999999999"
        },
        theme: { color: "#2e7d32" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            alert('Payment cancelled. Please try again if needed.');
          }
        }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
  
      rzp.open();
  
    } catch (error) {
      console.error("Full payment error:", error);
      const serverError = error.response?.data?.error;
      const validationError = error.response?.data?.errors?.[0]?.msg;
      const errorMessage = serverError || validationError || error.message;
  
      alert(`Payment Error: ${errorMessage}`);
      setLoading(false);
  
      // ✅ Clear cart if order creation fails
      if (error.response?.status === 400) {
        localStorage.removeItem('cart');
        setCart([]);
      }
    }
  };  
  
  return (
    <div className="checkout-page">
      <HeroHeader 
        title="Secure Checkout" 
        subtitle="Complete your purchase with confidence" 
        backgroundImage="/assets/head/check.jpg"
      />
      
      <div className="checkout-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back to Cart
        </button>

        <div className="checkout-grid">
          <div className="checkout-details">
            <section className="checkout-section">
              <h2><FiTruck /> Delivery Information</h2>
              <div className="delivery-info">
                <div className="address-form">
                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={shippingAddress.country}
                        onChange={handleAddressChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <h2><FiCreditCard /> Payment Method</h2>
              <div className="payment-methods">
                <div className="payment-card active">
                  <div className="payment-header">
                    <img src="/assets/razorpay-logo.png" alt="Razorpay" />
                    <span>Cards, UPI, NetBanking</span>
                  </div>
                  <p>Secure payment processing powered by Razorpay</p>
                </div>
              </div>
            </section>
          </div>

          <div className="order-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>
              <div className="order-items">
                {cart.map(item => (
                  <div key={item.product._id} className="order-item">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="item-image"
                    />
                    <div className="item-details">
                      <h4>{item.product.name}</h4>
                      <p className="quantity">
                        {item.quantity} × ₹{item.product.price}
                      </p>
                      <p className="subtotal">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-total">
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePayment} 
                className="btn-pay"
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
              </button>

              <p className="security-note">
                <img src="/assets/ssl-secure.png" alt="SSL Secure" />
                Your payment is securely encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;