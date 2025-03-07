import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropAPI } from '../../utils/api';
import HeroHeader from '../../components/common/HeroHeader';
import { FormLayout } from '../../components/common/FormLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiInfo, FiDroplet, FiThermometer, FiSun, FiCloudRain } from 'react-icons/fi';
import './CropRecommend.css';

const CropRecommend = () => {
  const [inputs, setInputs] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Convert inputs to numbers
    const numericPayload = {
      nitrogen: parseFloat(inputs.nitrogen),
      phosphorus: parseFloat(inputs.phosphorus),
      potassium: parseFloat(inputs.potassium),
      temperature: parseFloat(inputs.temperature),
      humidity: parseFloat(inputs.humidity),
      ph: parseFloat(inputs.ph),
      rainfall: parseFloat(inputs.rainfall)
    };

    // Validate all fields
    if (Object.values(numericPayload).some(val => isNaN(val))) {
      setLoading(false);
      return setError('Please enter valid numbers in all fields');
    }

    try {
      // Structure payload according to backend requirements
      const payload = {
        features: [
          numericPayload.nitrogen,
          numericPayload.phosphorus,
          numericPayload.potassium,
          numericPayload.temperature,
          numericPayload.humidity,
          numericPayload.ph,
          numericPayload.rainfall
        ]
      };

      const response = await cropAPI.predict(payload);
      const recommendation = response.data.prediction || response.data;

      // IMPORTANT: match the old code's expected field names 
      // (soilTemperature, soilHumidity, soilPh) if your backend uses those.
      await cropAPI.createCropData({
        nitrogen: numericPayload.nitrogen,
        phosphorus: numericPayload.phosphorus,
        potassium: numericPayload.potassium,
        soilTemperature: numericPayload.temperature,
        soilHumidity: numericPayload.humidity,
        soilPh: numericPayload.ph,
        rainfall: numericPayload.rainfall,
        recommendation
      });

      // Navigate with the recommendation
      navigate('/crop-result', { 
        state: { 
          result: recommendation,
          inputs: numericPayload
        }
      });

    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.message || 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeroHeader
        title="Smart Crop Advisor"
        subtitle="Get AI-powered crop suggestions based on your soil conditions"
        backgroundImage="/assets/head/crop.jpg"
      />

<div className="crop-recommend-container">
  <FormLayout>
    <form onSubmit={handleSubmit} className="crop-form">
      <div className="form-sections">
        {/* Soil Nutrients Section */}
        <div className="form-section">
          <h3 className="section-title">
            <FiDroplet />
            Soil Nutrients
          </h3>
          <div className="parameter-grid">
            {[
              {
                label: "Nitrogen (N) ppm",
                key: "nitrogen",
                icon: <FiDroplet />,
                info: "Measure of soil nitrogen content"
              },
              {
                label: "Phosphorus (P) ppm",
                key: "phosphorus",
                icon: <FiDroplet />,
                info: "Measure of soil phosphorus content"
              },
              {
                label: "Potassium (K) ppm",
                key: "potassium",
                icon: <FiDroplet />,
                info: "Measure of soil potassium content"
              }
            ].map(({ label, key, icon, info }) => (
              <div className="input-group" key={key}>
                <label>{label}</label>
                <div className="input-wrapper">
                  {icon}
                  <input
                    type="number"
                    name={key}
                    value={inputs[key]}
                    onChange={handleChange}
                    placeholder={label}
                    required
                  />
                  {/* <div className="info-tooltip">
                    <FiInfo />
                    <span className="tooltip-text">{info}</span>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Factors Section */}
        <div className="form-section">
          <h3 className="section-title">
            <FiThermometer />
            Environmental Factors
          </h3>
          <div className="parameter-grid">
            {[
              {
                label: "Temperature (°C)",
                key: "temperature",
                icon: <FiThermometer />,
                // info: "Average daily temperature"
              },
              {
                label: "Humidity (%)",
                key: "humidity",
                icon: <FiCloudRain />,
                // info: "Relative humidity percentage"
              },
              {
                label: "pH Level",
                key: "ph",
                icon: <FiSun />,
                // info: "Soil acidity/alkalinity (0-14 scale)"
              },
              {
                label: "Rainfall (mm)",
                key: "rainfall",
                icon: <FiCloudRain />,
                // info: "Annual rainfall measurement"
              }
            ].map(({ label, key, icon, info }) => (
              <div className="input-group" key={key}>
                <label>{label}</label>
                <div className="input-wrapper">
                  {icon}
                  <input
                    type="number"
                    name={key}
                    value={inputs[key]}
                    onChange={handleChange}
                    placeholder={label}
                    required
                    step={key === 'ph' ? '0.1' : '1'}
                    min={key === 'ph' ? 0 : 0}
                    max={key === 'ph' ? 14 : undefined}
                  />
                  {/* <div className="info-tooltip">
                    <FiInfo />
                    <span className="tooltip-text">{info}</span>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


            <button type="submit" className="analyze-button" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner />
                  <span>Analyzing Soil Data...</span>
                </>
              ) : (
                <>
                  <FiSun />
                  <span>Generate Recommendation</span>
                </>
              )}
            </button>

            {error && <div className="error-message"><FiInfo /> {error}</div>}
          </form>
        </FormLayout>
      </div>
    </>
  );
};

export default CropRecommend;