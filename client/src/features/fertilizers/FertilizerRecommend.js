import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fertilizerAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FormLayout } from '../../components/common/FormLayout';
import HeroHeader from '../../components/common/HeroHeader';
import { FiThermometer, FiDroplet, FiCloudRain, FiCheckCircle, FiChevronDown, FiInfo } from 'react-icons/fi';
import './FertilizerRecommend.css';

const soilTypes = ['Black', 'Clayey', 'Loamy', 'Red', 'Sandy'];
const cropTypes = [
  'Barley', 'Cotton', 'Ground Nuts', 'Maize', 'Millets', 
  'Oil seeds', 'Paddy', 'Pulses', 'Sugarcane', 'Tobacco', 'Wheat'
];

const FertilizerRecommend = () => {
  const [formData, setFormData] = useState({
    temperature: '', humidity: '', moisture: '',
    nitrogen: '', phosphorus: '', potassium: '',
    soilType: '', cropType: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ✅ Handle Input Changes (Prevent Negative Values)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue < 0) {
      setFormData({ ...formData, [name]: '' }); // Reset if invalid
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert input values to positive numbers
      const parsedData = {
        temperature: Math.max(0, parseFloat(formData.temperature)),
        humidity: Math.max(0, parseFloat(formData.humidity)),
        moisture: Math.max(0, parseFloat(formData.moisture)),
        nitrogen: Math.max(0, parseFloat(formData.nitrogen)),
        phosphorus: Math.max(0, parseFloat(formData.phosphorus)),
        potassium: Math.max(0, parseFloat(formData.potassium))
      };

      // Validate that all numeric fields are valid
      if (Object.values(parsedData).some(isNaN)) {
        throw new Error('Please enter valid positive numbers in all fields.');
      }

      // Validate categorical selections
      const soilTypeIndex = soilTypes.indexOf(formData.soilType);
      const cropTypeIndex = cropTypes.indexOf(formData.cropType);

      if (soilTypeIndex === -1 || cropTypeIndex === -1) {
        throw new Error('Invalid soil or crop type selected.');
      }

      // Construct payload
      const payload = {
        num_features: Object.values(parsedData),
        cat_features: [soilTypeIndex, cropTypeIndex]
      };

      console.log('Submitting payload:', payload); // Debugging

      // ✅ Send Request to Backend
      const response = await fertilizerAPI.predict(payload);
      console.log('Response:', response.data);

      // ✅ Extract recommendation correctly
      const recommendation = response.data?.recommendation || response.data;

      // ✅ Store Data in Backend
      await fertilizerAPI.createFertilizerData({
        soilTemperature: parsedData.temperature,
        soilHumidity: parsedData.humidity,
        soilMoisture: parsedData.moisture,
        nitrogen: parsedData.nitrogen,
        phosphorous: parsedData.phosphorus, // ✅ Fix incorrect key
        potassium: parsedData.potassium,
        soilType: formData.soilType,
        cropType: formData.cropType,
        recommendation
      });

      // ✅ Navigate to Result Page
      navigate('/fertilizer-result', { state: { result: recommendation } });

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Header Section */}
      <HeroHeader
        title="Smart Fertilizer Advisor"
        subtitle="Optimize your crop yield with AI-powered fertilizer recommendations"
        backgroundImage="/assets/head/fert.jpg"
      />

      {/* ✅ Form Section */}
      <div className="fertilizer-container">
        <FormLayout>
          <form onSubmit={handleSubmit} className="fertilizer-form">

            {/* ✅ Soil Conditions */}
            <div className="form-section">
              <h3 className="section-title"><FiThermometer className="section-icon" /> Soil Conditions</h3>
              <div className="input-grid">
                {[
                  { label: "Temperature (°C)", key: "temperature", icon: <FiThermometer /> },
                  { label: "Humidity (%)", key: "humidity", icon: <FiDroplet /> },
                  { label: "Moisture (%)", key: "moisture", icon: <FiCloudRain /> }
                ].map(({ label, key, icon }) => (
                  <div className="input-group" key={key}>
                    <label>{label}</label>
                    <div className="input-wrapper">
                      {icon}
                      <input
                        type="number"
                        name={key}
                        min="0"
                        value={formData[key]}
                        onChange={handleInputChange}
                        placeholder={`Enter ${label}`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Nutrient Levels */}
            <div className="form-section">
              <h3 className="section-title"><FiCheckCircle className="section-icon" /> Nutrient Levels</h3>
              <div className="input-grid">
                {[
                  { label: "Nitrogen (ppm)", key: "nitrogen", color: "#3498db" },
                  { label: "Phosphorus (ppm)", key: "phosphorus", color: "#2ecc71" },
                  { label: "Potassium (ppm)", key: "potassium", color: "#e67e22" }
                ].map(({ label, key, color }) => (
                  <div className="input-group" key={key}>
                    <label>{label}</label>
                    <div className="input-wrapper">
                      <div className="nutrient-indicator" style={{ backgroundColor: color }} />
                      <input
                        type="number"
                        name={key}
                        min="0"
                        value={formData[key]}
                        onChange={handleInputChange}
                        placeholder={`Enter ${label}`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Crop & Soil Type */}
            <div className="form-section">
              <h3 className="section-title">Crop & Soil Details</h3>
              <div className="select-grid">
                {[
                  { label: "Soil Type", key: "soilType", options: soilTypes },
                  { label: "Crop Type", key: "cropType", options: cropTypes }
                ].map(({ label, key, options }) => (
                  <div className="select-group" key={key}>
                    <label>{label}</label>
                    <div className="custom-select">
                      <select
                        name={key}
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        required
                      >
                        <option value="">Select {label}</option>
                        {options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Error & Submit */}
            {error && <div className="error-message"><FiInfo /> {error}</div>}
            <button type="submit" className="recommendation-button" disabled={loading}>
              {loading ? <LoadingSpinner /> : <><FiCheckCircle /> Get Fertilizer Recommendation</>}
            </button>

          </form>
        </FormLayout>
      </div>
    </>
  );
};

export default FertilizerRecommend;
