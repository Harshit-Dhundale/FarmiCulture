import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { diseaseAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FormLayout } from '../../components/common/FormLayout';
import HeroHeader from '../../components/common/HeroHeader';
import { FiCrop, FiUpload, FiAlertTriangle, FiChevronDown, FiSearch } from 'react-icons/fi';
import './DiseaseDetection.css';

const DiseaseDetection = () => {
  const [formData, setFormData] = useState({
    crop: '',
    file: null
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const crop_list = [
    'strawberry', 'potato', 'corn', 'apple',
    'cherry', 'grape', 'peach', 'pepper', 'tomato'
  ];

  // Handle image selection and preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formPayload = new FormData();
      formPayload.append('crop', formData.crop);
      formPayload.append('file', formData.file);

      // Call API
      const response = await diseaseAPI.create(formPayload);
      console.log("API Response:", response.data);
      
      // Navigate to result page
      navigate('/disease-result', {
        state: {
          prediction: response.data.prediction,
          image: URL.createObjectURL(formData.file),
        },
      });
    } catch (error) {
      console.error("Error in disease detection:", error);
      setError(error.response?.data?.error || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Header */}
      <HeroHeader
        title="Crop Health Guardian"
        subtitle="Early disease detection for healthier crops"
        backgroundImage="/assets/head/dis.jpg"
      />

      <div className="disease-container">
        <FormLayout>
          <form onSubmit={handleSubmit} className="disease-form">
            
            {/* Select Crop Type */}
            <div className="form-section">
              <h3 className="section-title"><FiCrop /> Select Crop Type</h3>
              <div className="custom-select">
                <select
                  value={formData.crop}
                  onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                  required
                >
                  <option value="">Choose crop type</option>
                  {crop_list.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop.charAt(0).toUpperCase() + crop.slice(1)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-arrow" />
              </div>
            </div>

            {/* Upload Leaf Image */}
            <div className="form-section">
              <h3 className="section-title"><FiUpload /> Upload Leaf Image</h3>
              <label className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                <div className="upload-content">
                  {preview ? (
                    <img src={preview} alt="Upload preview" />
                  ) : (
                    <>
                      <FiUpload className="upload-icon" />
                      <p>Click to select leaf image</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <FiAlertTriangle /> {error}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="analyze-button" disabled={loading}>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <FiSearch />
                  Analyze Image
                </>
              )}
            </button>

          </form>
        </FormLayout>
      </div>
    </>
  );
};

export default DiseaseDetection;
