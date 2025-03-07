// DiseaseResult.js (updated)
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroHeader from '../../components/common/HeroHeader';
import { FiArrowLeft, FiActivity, FiCheckCircle, FiDroplet, FiSun, FiShield } from 'react-icons/fi';
import './DiseaseResult.css';

const DiseaseResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { prediction, image } = location.state || { 
    prediction: 'No Prediction', 
    image: '/assets/placeholder.jpg' 
  };

  return (
    <>
      <HeroHeader
        title="Crop Health Report"
        subtitle="Detailed diagnosis and recommendations"
        backgroundImage="/assets/head/dis.jpg"
      />

      <div className="result-container">
        <div className="result-card">
          <div className="image-container">
            <img 
              src={image} 
              alt="Analysis preview" 
              className="diagnosis-image"
            />
            <div className="image-overlay">
              <span className="crop-name">{prediction.split(' ')[0]}</span>
            </div>
          </div>
          
          <div className="result-content">
            <div className="diagnosis-card">
              <FiActivity className="diagnosis-icon" />
              <h3 className="diagnosis-title">Diagnosis Result</h3>
              <div className="disease-name">
                {prediction}
                <div className="severity-indicator medium">Medium Severity</div>
              </div>
            </div>

            <div className="recommendations-card">
              <h4 className="recommendations-title">Recommended Actions</h4>
              <ul className="recommendations-list">
                <li>
                  <FiCheckCircle className="recommendation-icon" />
                  <span>Isolate affected plants immediately</span>
                </li>
                <li>
                  <FiDroplet className="recommendation-icon" />
                  <span>Apply copper-based fungicides every 7 days</span>
                </li>
                <li>
                  <FiSun className="recommendation-icon" />
                  <span>Ensure proper sunlight exposure</span>
                </li>
                <li>
                  <FiShield className="recommendation-icon" />
                  <span>Monitor growth for 2 weeks</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => navigate(-1)}
              className="primary-button"
            >
              <FiArrowLeft /> New Analysis
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default DiseaseResult;
