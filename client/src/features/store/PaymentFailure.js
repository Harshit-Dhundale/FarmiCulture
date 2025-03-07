// client/src/features/store/PaymentFailure.js
import React from 'react';
import { Link } from 'react-router-dom';
import HeroHeader from '../../components/common/HeroHeader';
import './PaymentOutcome.css';

const PaymentFailure = () => {
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
          <Link to="/cart" className="btn">Return to Cart</Link>
          <Link to="/store" className="btn btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;