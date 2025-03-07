import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import FarmDetailsForm from './FarmDetailsForm';
import styles from './FarmModal.module.css';

const modalRoot = document.getElementById('modal-root');

const FarmModal = ({ isOpen, onClose, farmData, onSubmit, userId }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{farmData ? 'Edit Farm' : 'New Farm'}</h2>
          <button className={styles.closeButton} onClick={onClose}></button>
        </div>
        <div className={styles.modalBody}>
          <FarmDetailsForm
            farmData={farmData}
            onUpdate={(data) => {
              onSubmit(data);
              onClose();
            }}
            userId={userId}
          />
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default FarmModal;