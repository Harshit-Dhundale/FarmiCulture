// FarmCard.js
import React from 'react';
import { FiEdit, FiTrash, FiMapPin, FiCrop, FiLayout, FiInfo, FiHome } from 'react-icons/fi';
import styles from './FarmCard.module.css';

const FarmCard = ({ farmData, onUpdate, onDelete, onEdit }) => {
  return (
    <div className={styles.farmCard}>
      <div className={styles.farmHeader}>
        <FiHome className={styles.farmIcon} />
        <h3>{farmData.name || "Unnamed Farm"}</h3>
        <span className={`${styles.farmType} ${styles[farmData.farmType.toLowerCase()]}`}>
          {farmData.farmType}
        </span>
      </div>
      
      <div className={styles.farmDetailsGrid}>
        <div className={styles.detailItem}>
          <FiMapPin />
          <div>
            <label>Location</label>
            <p>{farmData.location}</p>
          </div>
        </div>
        
        <div className={styles.detailItem}>
          <FiLayout />
          <div>
            <label>Size</label>
            <p>{farmData.size} acres</p>
          </div>
        </div>

        <div className={styles.detailItem}>
          <FiCrop />
          <div>
            <label>Crops</label>
            <div className={styles.cropsList}>
              {farmData.crops.map((crop, index) => (
                <span key={index} className={styles.cropTag}>{crop}</span>
              ))}
            </div>
          </div>
        </div>

        {farmData.description && (
          <div className={styles.detailItem}>
            <FiInfo />
            <div>
              <label>Description</label>
              <p className={styles.farmDescription}>{farmData.description}</p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.farmActions}>
        <button onClick={() => onEdit(farmData)} className={styles.btnEdit}>
          <FiEdit /> Edit
        </button>
        <button onClick={() => onDelete(farmData._id)} className={styles.btnDelete}>
          <FiTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default FarmCard;