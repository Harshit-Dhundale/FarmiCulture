import React from 'react';
import HeroHeader from '../../components/common/HeroHeader';
import { FiShoppingBag, FiPackage, FiShield, FiClock, FiDroplet, FiSun } from 'react-icons/fi';
import styles from './About.module.css';

const About = () => {
  return (
    <>
      <HeroHeader
        title="About FarmiCulture"
        subtitle="FarmiCulture combines cutting-edge technology with agricultural expertise to deliver a comprehensive platform featuring:"
        backgroundImage="/assets/head/about.jpg"
      />

      <div className={styles.aboutContainer}>
        <section className={styles.featureSection}>
          <h2>How We Empower Your Farming Journey</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <FiShoppingBag className={styles.featureIcon} />
              <h3>Agricultural Marketplace</h3>
              <ul>
                <li><FiPackage /> One-stop shop for seeds, tools & equipment</li>
                <li><FiShield /> Secure payment gateway with order tracking</li>
                <li><FiClock /> Express delivery to remote farming areas</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <FiDroplet className={styles.featureIcon} />
              <h3>Smart Recommendations</h3>
              <ul>
                <li>Personalized crop suggestions</li>
                <li>Optimal fertilizer calculations</li>
                <li>Disease detection with 95% accuracy</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <FiSun className={styles.featureIcon} />
              <h3>Farming Management</h3>
              <ul>
                <li>Multi-farm monitoring</li>
                <li>Weather-based alerts</li>
                <li>Yield prediction models</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.modelSection}>
          <h2>Our Intelligent Systems</h2>
          <p>Powered by machine learning and 90,000+ agricultural data points:</p>

          <div className={styles.modelGrid}>
            <div className={styles.modelCard}>
              <h3><span className={styles.modelIcon}>🌱</span>Crop Advisor</h3>
              <div>
                <p className={styles.modelAlgorithm}>Naive Bayes Algorithm</p>
                <p>Analyzes soil nutrients, weather patterns, and historical yield data to recommend optimal crops</p>
              </div>
            </div>

            <div className={styles.modelCard}>
              <h3><span className={styles.modelIcon}>🧪</span>Fertilizer Guide</h3>
              <div>
                <p className={styles.modelAlgorithm}>Random Forest Model</p>
                <p>Calculates precise nutrient requirements based on soil composition and crop type</p>
              </div>
            </div>

            <div className={styles.modelCard}>
              <h3><span className={styles.modelIcon}>🔍</span>Disease Detector</h3>
              <div>
                <p className={styles.modelAlgorithm}>CNN Deep Learning</p>
                <p>Identifies 50+ plant diseases through image analysis with 92% accuracy</p>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.aboutFooter}>
          <p>Join 10,000+ farmers transforming their harvests with FarmiCulture</p>
          <p>&copy; 2025 FarmiCulture. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default About;
