// client/src/features/dashboard/PredictionsList.js
import React from 'react';
import Slider from "react-slick";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSeedling, 
  faPills, 
  faBug, 
  faChevronLeft, 
  faChevronRight,
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import styles from './PredictionsList.module.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const NextArrow = ({ onClick }) => (
  <button className={styles.slickArrow + " " + styles.next} onClick={onClick}>
    <FontAwesomeIcon icon={faChevronRight} />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button className={styles.slickArrow + " " + styles.prev} onClick={onClick}>
    <FontAwesomeIcon icon={faChevronLeft} />
  </button>
);

const PredictionsList = ({ predictions }) => {
  const navigate = useNavigate();

  const grouped = predictions.reduce((acc, pred) => {
    const type = pred.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(pred);
    return acc;
  }, {});

  const handleAddPrediction = (type) => {
    const routes = {
      Crop: '/crop-recommendation',
      Fertilizer: '/fertilizer-recommendation',
      Disease: '/disease-detection'
    };
    navigate(routes[type]);
  };

  const renderTypeGrid = (type) => {
    const group = grouped[type] || [];
    const icons = { Crop: faSeedling, Fertilizer: faPills, Disease: faBug };
    
    let uniquePredictions = type === 'Disease' 
      ? Array.from(new Map(group.map(pred => [pred.imageUrl, pred])).values())
      : Array.from(new Map(group.map(pred => [pred.recommendation, pred])).values());

    return (
      <div className={styles.predictionCard}>
        <div className={styles.cardHeader}>
          <FontAwesomeIcon icon={icons[type]} className={styles.typeIcon} />
          <h3>{type} Predictions</h3>
        </div>
        
        <div className={styles.predictionGrid}>
          {uniquePredictions.map((pred, index) => {
            let imgSrc = '';
            let label = '';
            
            if (type === 'Disease') {
              imgSrc = `/${pred.imageUrl.replace(/\\/g, "/")}`;
              label = `${pred.crop.charAt(0).toUpperCase() + pred.crop.slice(1)} - ${pred.prediction}`;
            } else {
              const rec = pred.recommendation.toLowerCase().replace(/\s+/g, '-');
              imgSrc = `/assets/${type.toLowerCase()}s/${rec}.jpg`;
              label = pred.recommendation;
            }

            return (
              <div key={index} className={styles.gridItem}>
                <div className={styles.imageContainer}>
                  <img
                    src={imgSrc}
                    alt={label}
                    loading="lazy"
                    onError={(e) => e.target.src = '/assets/placeholder.jpg'}
                  />
                  <div className={styles.imageLabel}>
                    {type === 'Disease' && <FontAwesomeIcon icon={faBug} className={styles.labelIcon} />}
                    <span>{label}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {uniquePredictions.length === 0 && (
            <div className={styles.emptyState}>
              <FontAwesomeIcon icon={icons[type]} className={styles.emptyIcon} />
              <p>No {type.toLowerCase()} predictions found</p>
            </div>
          )}
        </div>

        <button 
          className={styles.predictionButton}
          onClick={() => handleAddPrediction(type)}
        >
          <FontAwesomeIcon icon={faPlus} />
          {type === 'Disease' ? ' New Detection' : ' New Prediction'}
        </button>
      </div>
    );
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    appendDots: dots => <ul className={styles.customDots}>{dots}</ul>
  };

  return (
    <div className={styles.predictionsCarousel + " card"}>
      <div className={styles.sectionHeader}>
        <h2><FontAwesomeIcon icon={faChartLine} /> Prediction History</h2>
      </div>
      <Slider {...sliderSettings}>
        {['Crop', 'Fertilizer', 'Disease'].map((type) => (
          <div key={type}>
            {renderTypeGrid(type)}
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default PredictionsList;