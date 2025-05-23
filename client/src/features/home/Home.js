import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from './Home.module.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      title: "Crop Recommendation",
      image: "/assets/home/crop.png",
      description: "Get personalized crop suggestions based on your soil conditions.",
      path: "/crop-recommendation"
    },
    {
      title: "Fertilizer Recommendation",
      image: "/assets/home/fertilizer.png",
      description: "Receive custom fertilizer solutions for optimal yield.",
      path: "/fertilizer-recommendation"
    },
    {
      title: "Disease Detection",
      image: "/assets/home/disease.png",
      description: "Identify plant diseases with AI-powered image analysis.",
      path: "/disease-detection"
    },
    {
      title: "Community Forum",
      image: "/assets/home/forum.png",
      description: "Connect and share with the farming community.",
      path: "/forum"
    },
    {
      title: "Store",
      image: "/assets/home/store.png",
      description: "Browse and purchase top-quality farming essentials.",
      path: "/store"
    },
    {
      title: "Dashboard",
      image: "/assets/home/dashboard.png",
      description: "Manage your farm data, orders, and community insights.",
      path: "/dashboard"
    }
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <ErrorBoundary>
      <div className={styles.homeContainer}>
        <section className={styles.heroSection} data-aos="fade-in">
          <div className={styles.heroOverlay}>
            <h1 className={styles.brandTitle} data-aos="zoom-in">Welcome to FarmiCulture</h1>
            <p className={styles.tagline} data-aos="fade-up" data-aos-delay="200">
              Smart Agricultural Solutions for a Sustainable Future
            </p>
            <p className={styles.welcomeMessage} data-aos="fade-up" data-aos-delay="400">
              Empowering farmers with innovative technology and a supportive community. Let’s grow together!
            </p>
            {!currentUser && (
              <div className={styles.heroButtons} data-aos="fade-up" data-aos-delay="600">
                <Link to="/register" className={styles.btnPrimary}>Get Started</Link>
                <Link to="/login" className={styles.btnSecondary}>Existing User? Login</Link>
              </div>
            )}
          </div>
        </section>

        <section className={styles.featuresSection} data-aos="fade-up">
          <h2 className={styles.sectionTitle}>Our Features</h2>
          <div className={styles.featuresSlider}>
            <Slider {...sliderSettings}>
              {features.map((feature, index) => (
                <div key={index} className={styles.featureSlide}>
                  <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay={`${index * 100}`}>
                    <div className={styles.featureImageContainer}>
                      <img src={feature.image} alt={feature.title} className={styles.featureImage} />
                    </div>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                    <Link to={feature.path} className={styles.featureLink}>Learn More</Link>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
};

export default Home;
