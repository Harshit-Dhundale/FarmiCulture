import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroHeader from '../../components/common/HeroHeader';
import { FiArrowLeft, FiCheckCircle, FiDroplet, FiSun, FiShield } from 'react-icons/fi';
import './CropResult.css'; // Renamed CSS file

const CropResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result || 'No result available';

  // Construct image URL dynamically
  const imageUrl = `${process.env.PUBLIC_URL}/assets/crops/${result?.toLowerCase().replace(/\s+/g, '-')}.jpg`;

  return (
    <>
      <HeroHeader
        title="Optimal Crop Recommendation"
        subtitle="AI-powered recommendation for maximum yield"
        backgroundImage="/assets/head/crop.jpg"
      />

      <div className="result-container">
        <div className="result-card">
          <div className="image-container">
            <img
              src={imageUrl}
              alt="Crop preview"
              className="diagnosis-image"
              onError={(e) => {
                e.target.src = `${process.env.PUBLIC_URL}/assets/crops/placeholder.jpg`;
              }}
            />
            <div className="image-overlay">
              <span className="crop-name">{result}</span>
            </div>
          </div>

          <div className="result-content">
            <div className="diagnosis-card">
              <h3 className="diagnosis-title">Crop Recommendation</h3>
              <div className="disease-name">
                {result}
                <div className="severity-indicator success">Highly Suitable</div>
              </div>
            </div>

            <div className="recommendations-card">
              <h4 className="recommendations-title">Why {result}?</h4>
              <ul className="recommendations-list">
                <li>
                  <FiCheckCircle className="recommendation-icon" />
                  <span>Optimal for your soil nutrient levels</span>
                </li>
                <li>
                  <FiDroplet className="recommendation-icon" />
                  <span>Requires moderate water availability</span>
                </li>
                <li>
                  <FiSun className="recommendation-icon" />
                  <span>Thrives in your local climate conditions</span>
                </li>
                <li>
                  <FiShield className="recommendation-icon" />
                  <span>High market demand and profitability</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="primary-button"
            >
              <FiArrowLeft /> New Crop Recommendation
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CropResult;
