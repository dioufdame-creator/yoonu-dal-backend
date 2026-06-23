import React from 'react';

// ============================================================
// COMPOSANT HOME2 (V2) - Landing Page Yoonu Dal
// Structure : Problème -> Solution -> Preuve -> Méthode -> Origine
// ============================================================

const Home2 = ({ onNavigate }) => {
  return (
    <div style={css.page}>

      {/* ======================================================
          SECTION 1 : HERO (Problème + Solution)
      ====================================================== */}
      <section style={css.hero}>
        <div style={css.bookBadge}>
          📖 Inspiré du livre <em>Les Silences de nos Portefeuilles</em>
        </div>

        <h1 style={css.heroTitle}>
          Où part votre argent <span style={css.heroTitleGreen}>chaque mois ?</span>
        </h1>

        <p style={css.heroSubtitle}>
          Vous ne le savez pas vraiment. C'est normal. <br/>
          <strong>Yoonu Dal</strong> suit vos dépenses, calcule votre reste à vivre par jour et vous aide à reprendre le contrôle.
        </p>

        <div style={css.ctaGroup}>
          <button style={css.btnPrimary} onClick={() => onNavigate('register')}>
            Commencer gratuitement
          </button>
          <button style={css.btnSecondary} onClick={() => onNavigate('login')}>
            Se connecter
          </button>
        </div>

        <div style={css.heroImageWrap}>
          <img
            src="/assets/images/dashboard_v2_mobile.png"
            alt="Tableau de bord Yoonu Dal montrant le score et le reste par jour"
            style={css.heroImage}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </section>

      {/* ======================================================
          SECTION 2 : FONCTIONNALITÉS (Ce que vous pouvez faire)
      ====================================================== */}
      <section style={css.featuresSection}>
        <h2 style={css.sectionTitle}>Ce que vous pouvez faire avec Yoonu Dal</h2>
        
        <div style={css.featuresGrid}>
          {[
            { icon: '💰', title: 'Suivre vos dépenses', text: 'Catégorisez automatiquement où va votre argent.' },
            { icon: '📅', title: 'Reste par jour', text: 'Sachez exactement combien vous pouvez dépenser aujourd\'hui.' },
            { icon: '🎯', title: 'Objectifs d\'épargne', text: 'Définissez des cibles et suivez votre progression.' },
            { icon: '🤝', title: 'Gérer vos tontines', text: 'Suivez vos cotisations de groupe sans stress.' },
            { icon: '🤖', title: 'Yoonu IA', text: 'Un assistant intelligent pour répondre à vos questions financières.' },
            { icon: '📈', title: 'Score Yoonu', text: 'Évaluez la santé de vos finances sur 100 points.' }
          ].map((feat, i) => (
            <div key={i} style={css.featureCard}>
              <div style={css.featureIcon}>{feat.icon}</div>
              <h3 style={css.featureTitle}>{feat.title}</h3>
              <p style={css.featureText}>{feat.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          SECTION 3 : TÉMOIGNAGES (Preuve)
      ====================================================== */}
      <section style={css.testimonialsSection}>
        <h2 style={css.sectionTitle}>Ce que disent nos premiers testeurs</h2>

        <div style={css.testimonialsGrid}>
          {[
            {
              quote: '"J\'ai enfin de la visibilité. Je sais exactement ce qu\'il me reste jusqu\'à la fin du mois."',
              author: 'Testeur phase bêta',
              highlight: true
            },
            {
              quote: '"Le score et le calcul par jour changent tout. Je comprends enfin où part mon argent."',
              author: 'Testeur phase bêta',
              highlight: false
            },
            {
              quote: '"L\'interface est simple. Les 4 enveloppes m\'ont aidé à structurer mon budget sans me priver."',
              author: 'Testeur phase bêta',
              highlight: false
            },
          ].map((t, i) => (
            <div key={i} style={{...css.testimonialCard, ...(t.highlight ? css.testimonialHighlight : {})}}>
              <p style={css.testimonialQuote}>{t.quote}</p>
              <div style={css.testimonialAuthor}>— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          SECTION 4 : LA MÉTHODE EN 4 ÉTAPES
      ====================================================== */}
      <section style={css.methodSection}>
        <h2 style={css.sectionTitle}>La méthode Yoonu Dal</h2>
        <p style={css.sectionSubtitle}>
          Une approche progressive pour reprendre le contrôle.
        </p>

        <div style={css.stepsGrid}>
          {[
            { num: '1', icon: '👁️', title: 'Conscience', text: 'Ouvrez les yeux sur vos habitudes sans jugement.', color: '#0a8043', bg: '#f0fdf4' },
            { num: '2', icon: '💡', title: 'Clarté', text: 'Comprenez exactement où va votre argent.', color: '#d97706', bg: '#fffbeb' },
            { num: '3', icon: '🎯', title: 'Choix', text: 'Alignez vos achats avec vos priorités.', color: '#2563eb', bg: '#eff6ff' },
            { num: '4', icon: '🚀', title: 'Contrôle', text: 'Construisez votre liberté financière.', color: '#7c3aed', bg: '#f5f3ff' },
          ].map((step) => (
            <div key={step.num} style={{ ...css.stepCard, backgroundColor: step.bg }}>
              <div style={{ ...css.stepNum, color: step.color }}>{step.num}.</div>
              <div style={css.stepIcon}>{step.icon}</div>
              <div style={{ ...css.stepTitle, color: step.color }}>{step.title}</div>
              <p style={css.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          SECTION 5 : CTA FINAL
      ====================================================== */}
      <section style={css.ctaSection}>
        <h2 style={css.ctaTitle}>Prêt à reprendre le contrôle ?</h2>
        <p style={css.ctaText}>
          Commencez dès aujourd'hui. L'application est en phase de test gratuite.
        </p>
        <button style={css.btnCta} onClick={() => onNavigate('register')}>
          Créer mon compte gratuitement
        </button>
      </section>

    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const css = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#ffffff',
    color: '#111827',
    overflowX: 'hidden',
  },

  // ---- HERO ----
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '48px 24px 0',
    maxWidth: '800px',
    margin: '0 auto',
  },
  bookBadge: {
    display: 'inline-block',
    backgroundColor: '#f0fdf4',
    color: '#0a8043',
    border: '1px solid #bbf7d0',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: 'clamp(32px, 6vw, 48px)',
    fontWeight: '800',
    lineHeight: '1.15',
    marginTop: 0,
    marginBottom: '20px',
    color: '#111827',
  },
  heroTitleGreen: {
    color: '#0a8043',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '36px',
    maxWidth: '600px',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
    marginBottom: '48px',
  },
  btnPrimary: {
    padding: '16px 28px',
    backgroundColor: '#0a8043',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(10, 128, 67, 0.25)',
  },
  btnSecondary: {
    padding: '16px 28px',
    backgroundColor: '#ffffff',
    color: '#111827',
    border: '1.5px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  heroImageWrap: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  heroImage: {
    width: '100%',
    maxWidth: '320px',
    height: 'auto',
    filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.15))',
    transform: 'translateY(20px)',
  },

  // ---- FEATURES ----
  featuresSection: {
    backgroundColor: '#f9fafb',
    padding: '80px 24px 64px',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(24px, 4vw, 32px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '40px',
    color: '#111827',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'left',
    border: '1px solid #f3f4f6',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  featureIcon: {
    fontSize: '28px',
    marginBottom: '16px',
    backgroundColor: '#f0fdf4',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
    marginTop: 0,
  },
  featureText: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.5',
    margin: 0,
  },

  // ---- TESTIMONIALS ----
  testimonialsSection: {
    padding: '64px 24px',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  testimonialCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    padding: '32px 24px',
    textAlign: 'left',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  testimonialHighlight: {
    backgroundColor: '#0a8043',
    color: '#ffffff',
    border: 'none',
  },
  testimonialQuote: {
    fontSize: '16px',
    lineHeight: '1.6',
    fontStyle: 'italic',
    margin: '0 0 20px 0',
    color: 'inherit',
  },
  testimonialAuthor: {
    fontSize: '14px',
    fontWeight: '700',
    opacity: 0.8,
  },

  // ---- METHOD SECTION ----
  methodSection: {
    padding: '64px 24px',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    maxWidth: '560px',
    margin: '0 auto 40px',
    lineHeight: '1.6',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  stepCard: {
    borderRadius: '16px',
    padding: '28px 20px',
    textAlign: 'left',
  },
  stepNum: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
    opacity: 0.7,
  },
  stepIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  stepText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
  },

  // ---- CTA FINAL ----
  ctaSection: {
    background: 'linear-gradient(135deg, #0a8043 0%, #065f46 100%)',
    color: '#ffffff',
    textAlign: 'center',
    padding: '72px 24px',
  },
  ctaTitle: {
    fontSize: 'clamp(26px, 4vw, 36px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '18px',
    opacity: 0.9,
    maxWidth: '500px',
    margin: '0 auto 32px',
    lineHeight: '1.6',
  },
  btnCta: {
    padding: '18px 36px',
    backgroundColor: '#ffffff',
    color: '#0a8043',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
};

export default Home2;
