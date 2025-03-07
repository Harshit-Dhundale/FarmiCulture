// client/src/features/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, farmAPI, cropAPI, fertilizerAPI, diseaseAPI, forumAPI } from '../../utils/api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTractor, 
  faChartLine, 
  faShoppingCart, 
  faSeedling
} from '@fortawesome/free-solid-svg-icons';
import FarmList from './FarmList';
import PredictionsList from './PredictionsList';
import ForumPostsList from './ForumPostsList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import HeroHeader from '../../components/common/HeroHeader';
import OrdersSummary from './OrdersSummary';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [farms, setFarms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await userAPI.get(currentUser._id);
        setUserData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load user data.');
      }
    };

    const loadFarms = async () => {
      try {
        const res = await farmAPI.get(currentUser._id);
        setFarms(res.data);
      } catch (err) {
        setFarms([]);
      }
    };

    const loadPredictions = async () => {
      try {
        const [cropRes, fertRes, diseaseRes] = await Promise.all([
          cropAPI.getUserPredictions(currentUser._id),
          fertilizerAPI.getUserPredictions(currentUser._id),
          diseaseAPI.getUserPredictions(currentUser._id),
        ]);
        const cropPreds = cropRes.data.map(item => ({ ...item, type: 'Crop' }));
        const fertPreds = fertRes.data.map(item => ({ ...item, type: 'Fertilizer' }));
        const diseasePreds = diseaseRes.data.map(item => ({ ...item, type: 'Disease' }));
        const combined = [...cropPreds, ...fertPreds, ...diseasePreds];
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPredictions(combined);
      } catch (err) {
        setPredictions([]);
      }
    };

    const loadForumPosts = async () => {
      try {
        const res = await forumAPI.getUserPosts(currentUser._id);
        setForumPosts(res.data);
      } catch (err) {
        setForumPosts([]);
      }
    };

    const loadOrders = async () => {
      try {
        const { data } = await axios.get(`/api/orders/user/${currentUser._id}`);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    if (currentUser) {
      Promise.all([
        loadUserData(),
        loadFarms(),
        loadPredictions(),
        loadForumPosts(),
        loadOrders(),
      ]).finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className={styles.dashboardError}>{error}</p>;

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(
    (order) =>
      order.deliveryStatus &&
      order.deliveryStatus.toLowerCase() === 'delivered'
  ).length;
  const pendingOrders = totalOrders - deliveredOrders;

  return (
    <>
      <HeroHeader
        title={
          <>
            <FontAwesomeIcon icon={faSeedling} /> Welcome, {userData.username || userData.fullName}!
          </>
        }
        subtitle="Your Agricultural Management Hub"
        backgroundImage="/assets/head/dash.jpg"
      />
      
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardStatsRow}>
          <div className={styles.statCard}>
            <FontAwesomeIcon icon={faTractor} className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>{farms.length}</h3>
              <p>Active Farms</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <FontAwesomeIcon icon={faChartLine} className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>{predictions.length}</h3>
              <p>Total Predictions</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <FontAwesomeIcon icon={faShoppingCart} className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>{pendingOrders}</h3>
              <p>Pending Orders</p>
            </div>
          </div>
        </div>

        <div className={styles.dashboardTopGrid}>
          <div className={styles.dashboardSection}>
            <FarmList farms={farms} setFarms={setFarms} userId={currentUser._id} />
          </div>
          <div className={styles.dashboardSection}>
            <PredictionsList predictions={predictions} />
          </div>
        </div>

        <div className={styles.dashboardSection}>
          <OrdersSummary />
        </div>

        <div className={styles.dashboardSection}>
          <ForumPostsList forumPosts={forumPosts} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;