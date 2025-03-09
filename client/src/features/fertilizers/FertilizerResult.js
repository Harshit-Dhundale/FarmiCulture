import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiDroplet, FiSun, FiShield } from "react-icons/fi";
import HeroHeader from "../../components/common/HeroHeader";
import "./FertilizerResult.css"; // Renamed CSS file

const FertilizerResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result } = location.state || { result: "No Result" };

  const imageUrl = `${process.env.PUBLIC_URL}/assets/fertilizers/${result.toLowerCase()}.jpg`;

  return (
    <>
      <HeroHeader
        title="Optimal Fertilizer Found!"
        subtitle="AI-powered recommendation for maximum yield"
        backgroundImage="/assets/head/fert.jpg"
      />

      <div className="result-container">
        <div className="result-card">
          <div className="image-container">
            <img
              src={imageUrl}
              alt="Fertilizer preview"
              className="diagnosis-image"
              onError={(e) => {
                e.target.src = `${process.env.PUBLIC_URL}/assets/fertilizers/placeholder.jpg`;
              }}
            />
            <div className="image-overlay">
              <span className="crop-name">{result}</span>
            </div>
          </div>

          <div className="result-content">
            <div className="diagnosis-card">
              <h3 className="diagnosis-title">Fertilizer Recommendation</h3>
              <div className="disease-name">
                {result}
                <div className="severity-indicator success">Highly Effective</div>
              </div>
            </div>

            <div className="recommendations-card">
              <h4 className="recommendations-title">Why {result}?</h4>
              <ul className="recommendations-list">
                <li>
                  <FiCheckCircle className="recommendation-icon" />
                  <span>Optimal N-P-K ratio for your soil condition</span>
                </li>
                <li>
                  <FiDroplet className="recommendation-icon" />
                  <span>Improves water retention and nutrient absorption</span>
                </li>
                <li>
                  <FiSun className="recommendation-icon" />
                  <span>Enhances crop growth and yield</span>
                </li>
                <li>
                  <FiShield className="recommendation-icon" />
                  <span>Safe for the environment and sustainable farming</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="primary-button"
            >
              <FiArrowLeft /> New Soil Analysis
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FertilizerResult;
