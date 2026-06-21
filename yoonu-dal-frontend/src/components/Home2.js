import React from 'react';

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 'bold',
    fontSize: '20px',
    color: '#0a8043',
  },
  heroSection: {
    background: 'linear-gradient(135deg, #0a8043 0%, #0d6538 100%)',
    padding: '40px 20px',
    color: 'white',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    marginBottom: '16px',
    marginTop: 0,
  },
  pillBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    marginBottom: '30px',
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#4ade80',
    color: '#064e3b',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    cursor: 'pointer',
  },
  secondaryBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  methodSection: {
    padding: '40px 20px',
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '24px',
    color: '#212529',
    marginBottom: '30px',
  },
  stepCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  stepNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0a8043',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#212529',
  },
  stepText: {
    fontSize: '14px',
    color: '#6c757d',
    lineHeight: '1.5',
    margin: 0,
  },
  bookSection: {
    padding: '40px 20px',
    backgroundColor: 'white',
    textAlign: 'center',
  },
  bookCoverMockup: {
    width: '180px',
    height: '260px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    margin: '0 auto 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '10px 10px 20px rgba(0,0,0,0.1)',
  },
  bookBtn: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#0a8043',
    border: '2px solid #0a8043',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  }
};

const LandingPageMobile = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          🌱 Yoonu Dal
        </div>
        <div style={{ fontSize: '24px', color: '#212529' }}>☰</div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>Transformez vos silences financiers en liberté</h1>
        
        <div style={styles.pillBadge}>
          📖 Inspiré du livre de Dame Diouf
        </div>

        {/* Espace pour l'image du téléphone (mockup) */}
        <div style={{ 
          height: '250px', 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: '24px', 
          margin: '0 auto 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ opacity: 0.8 }}>[Image Mockup App]</span>
        </div>

        <button style={styles.primaryBtn}>Commencer gratuitement</button>
        <button style={styles.secondaryBtn}>Se connecter</button>
      </section>

      {/* Method Section */}
      <section style={styles.methodSection}>
        <h2 style={styles.sectionTitle}>La méthode en 4 étapes</h2>
        
        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>1. 👁️</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Conscience</div>
            <p style={styles.stepText}>Ouvrez les yeux sur vos habitudes financières sans aucun jugement.</p>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>2. 💡</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Clarté</div>
            <p style={styles.stepText}>Comprenez exactement où va votre argent chaque mois.</p>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>3. 🎯</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Choix</div>
            <p style={styles.stepText}>Alignez vos décisions d'achat avec vos priorités profondes.</p>
          </div>
        </div>

        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>4. 🚀</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Contrôle</div>
            <p style={styles.stepText}>Reprenez le contrôle et construisez votre liberté financière.</p>
          </div>
        </div>
      </section>

      {/* Book Section */}
      <section style={styles.bookSection}>
        <div style={styles.bookCoverMockup}>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>LES SILENCES</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>DE NOS</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#212529', textAlign: 'center', padding: '5px' }}>PORTEFEUILLES</div>
          <div style={{ fontSize: '10px', marginTop: 'auto', marginBottom: '10px' }}>DAME DIOUF</div>
        </div>
        
        <h2 style={{ fontSize: '20px', color: '#212529', marginBottom: '10px' }}>Aller plus loin</h2>
        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '20px' }}>
          Un livre puissant pour transformer votre rapport à l'argent.
        </p>
        
        <button style={styles.bookBtn}>
          📖 Lire le 1er chapitre
        </button>
      </section>
    </div>
  );
};

export default LandingPageMobile;
