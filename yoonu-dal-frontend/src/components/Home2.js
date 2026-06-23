import React from 'react';

// ============================================================
// COMPOSANT HOME2 (V3) - Landing Page Yoonu Dal
// Fusion du meilleur de Home (design, couleurs, layout) 
// et Home2 (structure efficace, fonctionnalités, preuve)
// ============================================================

const Home2 = ({ onNavigate }) => {
  return (
    <div style={css.page}>

      {/* ======================================================
          SECTION 1 : HERO (Problème + Solution)
          Layout 2 colonnes : Texte à gauche, Téléphone à droite
      ====================================================== */}
      <section style={css.heroSection}>
        <div style={css.heroContainer}>
          
          {/* Colonne gauche : Texte */}
          <div style={css.heroLeft}>
            <div style={css.bookBadge}>
              📖 Inspiré du livre <em>Les Silences de nos Portefeuilles</em>
            </div>

            <h1 style={css.heroTitle}>
              Transformez vos{' '}
              <span style={css.heroTitleGradient}>silences financiers</span>{' '}
              en liberté
            </h1>

            <p style={css.heroSubtitle}>
              Yoonu Dal vous guide vers une relation apaisée avec l'argent.
              Pas de miracles, juste une méthode éprouvée en 4 étapes.
              Que vous gagniez beaucoup ou peu, Yoonu Dal commence là où vous êtes.
            </p>

            <div style={css.ctaGroup}>
              <button style={css.btnPrimary} onClick={() => onNavigate('register')}>
                Commencer gratuitement
              </button>
              <button style={css.btnSecondary} onClick={() => onNavigate('login')}>
                Se connecter
              </button>
            </div>
          </div>

          {/* Colonne droite : Téléphone avec halos */}
          <div style={css.heroRight}>
            <div style={css.phoneWrapper}>
              {/* Halos décoratifs */}
              <div style={css.haloTeal}></div>
              <div style={css.haloOrange}></div>

              {/* Mockup téléphone */}
              <div style={css.phoneFrame}>
                <img
                  src="/dashboard_v2_mobile.png"
                  alt="Tableau de bord Yoonu Dal"
                  style={css.phoneImage}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Badge score flottant */}
              <div style={css.badgeScore}>
                <span style={css.badgeIcon}>🏆</span>
                <div>
                  <div style={css.badgeLabel}>Score</div>
                  <div style={css.badgeValue}>90/100</div>
                </div>
              </div>

              {/* Badge maître flottant */}
              <div style={css.badgeMaitre}>
                <span style={css.badgeIcon}>✅</span>
                <div style={css.badgeMaitreText}>Maître Yoonu</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================
          SECTION 2 : "Où va votre argent" (Dégradé teal)
      ====================================================== */}
      <section style={css.questionSection}>
        <h2 style={css.questionTitle}>Où va votre argent chaque mois ?</h2>
        <p style={css.questionText}>
          La plupart des gens ne le savent pas vraiment. 
          Yoonu Dal vous donne cette clarté en quelques minutes.
        </p>
      </section>

      {/* ======================================================
          SECTION 3 : "Transformez vos silences" (Dégradé)
          Sous le téléphone, comme demandé
      ====================================================== */}
      <section style={css.transformSection}>
        <h2 style={css.transformTitle}>
          Transformez vos silences financiers en liberté
        </h2>
        <p style={css.transformText}>
          Avec Yoonu Dal, vous suivez vos dépenses, calculez votre reste à vivre par jour 
          et reprenez le contrôle de votre argent. Pas de miracles, juste une méthode éprouvée.
        </p>
      </section>

      {/* ======================================================
          SECTION 4 : FONCTIONNALITÉS
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
          SECTION 5 : TÉMOIGNAGES
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
          SECTION 6 : LA MÉTHODE EN 4 ÉTAPES
      ====================================================== */}
      <section style={css.methodSection}>
        <h2 style={css.sectionTitle}>La méthode Yoonu Dal</h2>
        <p style={css.sectionSubtitle}>
          Une approche progressive pour reprendre le contrôle de vos finances.
        </p>

        <div style={css.stepsGrid}>
          {[
            { num: '1', icon: '👁️', title: 'Conscience', text: 'Ouvrez les yeux sur vos habitudes sans jugement.', color: '#14B8A6', bg: '#f0fdfa' },
            { num: '2', icon: '💡', title: 'Clarté', text: 'Comprenez exactement où va votre argent.', color: '#84CC16', bg: '#fefce8' },
            { num: '3', icon: '🎯', title: 'Choix', text: 'Alignez vos achats avec vos priorités.', color: '#F97316', bg: '#fff7ed' },
            { num: '4', icon: '🚀', title: 'Contrôle', text: 'Construisez votre liberté financière.', color: '#FDE047', bg: '#fefce8' },
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
          SECTION 7 : CTA FINAL
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

  // ---- HERO SECTION ----
  heroSection: {
    padding: '64px 24px 0',
    backgroundColor: 'linear-gradient(to bottom right, #f0fdfa 0%, #f5f3ff 100%)',
  },
  heroContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '32px',
    }
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  heroRight: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBadge: {
    display: 'inline-block',
    width: 'fit-content',
    backgroundColor: '#f0fdfa',
    color: '#14B8A6',
    border: '1px solid #99f6e4',
    borderRadius: '20px',
    padding: '8px 16px',
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
  heroTitleGradient: {
    background: 'linear-gradient(to right, #14B8A6, #F97316)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '16px',
  },
  btnPrimary: {
    padding: '16px 28px',
    background: 'linear-gradient(to right, #14B8A6, #0F766E)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  btnSecondary: {
    padding: '16px 28px',
    backgroundColor: '#ffffff',
    color: '#111827',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  // ---- PHONE ----
  phoneWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '320px',
  },
  haloTeal: {
    position: 'absolute',
    top: '-24px',
    right: '-24px',
    width: '96px',
    height: '96px',
    backgroundColor: '#99f6e4',
    borderRadius: '50%',
    opacity: 0.4,
    filter: 'blur(32px)',
    zIndex: 0,
  },
  haloOrange: {
    position: 'absolute',
    bottom: '-24px',
    left: '-24px',
    width: '112px',
    height: '112px',
    backgroundColor: '#fed7aa',
    borderRadius: '50%',
    opacity: 0.4,
    filter: 'blur(32px)',
    zIndex: 0,
  },
  phoneFrame: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: '#1f2937',
    borderRadius: '48px',
    padding: '10px',
    boxShadow: '0 24px 40px rgba(0, 0, 0, 0.15)',
    border: '4px solid #374151',
  },
  phoneImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '40px',
    display: 'block',
  },
  badgeScore: {
    position: 'absolute',
    right: '-32px',
    top: '64px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #f3f4f6',
    zIndex: 20,
  },
  badgeIcon: {
    fontSize: '20px',
  },
  badgeLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
  },
  badgeValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#14B8A6',
  },
  badgeMaitre: {
    position: 'absolute',
    left: '-48px',
    bottom: '80px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #f3f4f6',
    zIndex: 20,
  },
  badgeMaitreText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#111827',
  },

  // ---- QUESTION SECTION ----
  questionSection: {
    background: 'linear-gradient(to right, #14B8A6, #0F766E)',
    color: '#ffffff',
    textAlign: 'center',
    padding: '56px 24px',
  },
  questionTitle: {
    fontSize: 'clamp(24px, 4vw, 36px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '16px',
  },
  questionText: {
    fontSize: '18px',
    opacity: 0.9,
    maxWidth: '560px',
    margin: '0 auto',
    lineHeight: '1.6',
  },

  // ---- TRANSFORM SECTION ----
  transformSection: {
    background: 'linear-gradient(135deg, #14B8A6 0%, #F97316 100%)',
    color: '#ffffff',
    textAlign: 'center',
    padding: '72px 24px',
  },
  transformTitle: {
    fontSize: 'clamp(28px, 5vw, 40px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '20px',
  },
  transformText: {
    fontSize: '18px',
    opacity: 0.95,
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.7',
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
    backgroundColor: '#f0fdfa',
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
    background: 'linear-gradient(to right, #14B8A6, #0F766E)',
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
    background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
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
    color: '#14B8A6',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
};

export default Home2;
