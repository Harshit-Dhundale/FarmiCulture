// client/src/features/store/PaymentFailure.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import HeroHeader from '../../components/common/HeroHeader';
import './PaymentOutcome.css';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Assume orderId is passed in location.state
  const { orderId } = location.state || {};

  const handleRetry = async () => {
    if (!orderId) {
      alert('Order ID not found for retry');
      return;
    }
    try {
      const response = await axios.post(`/api/orders/${orderId}/retry`);
      // After retry, navigate to a dedicated retry payment page
      navigate(`/retry-payment/${orderId}`, { state: { razorpayOrder: response.data.razorpayOrder } });
    } catch (error) {
      console.error("Retry Payment error:", error);
      alert("Unable to retry payment at this time.");
    }
  };

  return (
    <div className="payment-outcome-page">
      <HeroHeader 
        title="Payment Failed" 
        subtitle="There was an issue processing your payment." 
        backgroundImage="/assets/head/failure.jpg" 
      />
      <div className="payment-content">
        <h2>Payment was not successful.</h2>
        <p>Please verify your payment details and try again.</p>
        <div className="action-buttons">
          <button onClick={handleRetry} className="btn">Retry Payment</button>
          <Link to="/cart" className="btn">Return to Cart</Link>
          <Link to="/store" className="btn btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;