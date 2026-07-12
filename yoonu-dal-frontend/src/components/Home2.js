import React from 'react';

// ============================================================
// COMPOSANT HOME2 - Landing Page Yoonu Dal (version corrigée)
//
// Changements par rapport à la version précédente :
// 1. CARTES COMPACTES : icône + titre sur la même ligne,
//    padding réduit → le scroll mobile est divisé par ~2.
// 2. PALETTE HARMONISÉE : les 4 étapes utilisent la palette
//    de marque (teal → lime → orange → ambre) au lieu de
//    vert/orange/bleu/violet.
// 3. "Se connecter" ajouté dans le hero (bouton secondaire).
// 4. Mockup : fond dégradé posé derrière l'image pour masquer
//    le damier. ⚠️ Le damier est probablement DANS le PNG :
//    ré-exporte dashboard_v2_mobile.png avec un vrai fond
//    transparent pour un rendu parfait.
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

        {/* Fond dégradé derrière le mockup pour masquer le damier */}
        <div style={css.heroImageWrap}>
          <img
            src="/dashboard_v2_mobile.png"
            alt="Tableau de bord Yoonu Dal montrant le score et le reste par jour"
            style={css.heroImage}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </section>

      {/* ======================================================
          SECTION 2 : FONCTIONNALITÉS — cartes compactes
          Icône à gauche, texte à droite → hauteur divisée par 2
      ====================================================== */}
      <section style={css.featuresSection}>
        <h2 style={css.sectionTitle}>Ce que vous pouvez faire avec Yoonu Dal</h2>

        <div style={css.featuresGrid}>
          {[
            { icon: '💰', title: 'Suivre vos dépenses', text: 'Catégorisez automatiquement où va votre argent.' },
            { icon: '📅', title: 'Reste par jour', text: 'Sachez exactement combien vous pouvez dépenser aujourd\'hui.' },
            { icon: '🎯', title: 'Objectifs d\'épargne', text: 'Définissez des cibles et suivez votre progression.' },
            { icon: '🤝', title: 'Gérer vos tontines', text: 'Suivez vos cotisations de groupe sans stress.' },
            { icon: '🤖', title: 'Yoonu IA', text: 'Un assistant intelligent pour vos questions financières.' },
            { icon: '📈', title: 'Score Yoonu', text: 'Évaluez la santé de vos finances sur 100 points.' }
          ].map((feat, i) => (
            <div key={i} style={css.featureCard}>
              <div style={css.featureIcon}>{feat.icon}</div>
              <div style={css.featureBody}>
                <h3 style={css.featureTitle}>{feat.title}</h3>
                <p style={css.featureText}>{feat.text}</p>
              </div>
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
          SECTION 4 : LA MÉTHODE — cartes compactes,
          palette harmonisée teal → lime → orange → ambre
      ====================================================== */}
      <section style={css.methodSection}>
        <h2 style={css.sectionTitle}>La méthode Yoonu Dal</h2>
        <p style={css.sectionSubtitle}>
          Une approche progressive pour reprendre le contrôle.
        </p>

        <div style={css.stepsGrid}>
          {[
            { num: '1', icon: '👁️', title: 'Conscience', text: 'Ouvrez les yeux sur vos habitudes sans jugement.', color: '#0F766E', bg: '#f0fdfa' },
            { num: '2', icon: '💡', title: 'Clarté', text: 'Comprenez exactement où va votre argent.', color: '#65A30D', bg: '#f7fee7' },
            { num: '3', icon: '🎯', title: 'Choix', text: 'Alignez vos achats avec vos priorités.', color: '#C2410C', bg: '#fff7ed' },
            { num: '4', icon: '🚀', title: 'Contrôle', text: 'Construisez votre liberté financière.', color: '#CA8A04', bg: '#fefce8' },
          ].map((step) => (
            <div key={step.num} style={{ ...css.stepCard, backgroundColor: step.bg }}>
              <div style={css.stepHeader}>
                <span style={css.stepIcon}>{step.icon}</span>
                <span style={{ ...css.stepTitle, color: step.color }}>
                  <span style={css.stepNum}>{step.num}.</span> {step.title}
                </span>
              </div>
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
    backgroundColor: '#f0fdfa',
    color: '#14B8A6',
    border: '1px solid #99f6e4',
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
    background: 'linear-gradient(to right, #14B8A6, #F97316)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
    background: 'linear-gradient(to right, #14B8A6, #0F766E)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)',
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
  // Fond dégradé derrière le mockup — masque le damier tant que
  // le PNG n'est pas ré-exporté avec une vraie transparence
  heroImageWrap: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
    background: 'radial-gradient(ellipse at center, #f0fdfa 0%, #ffffff 70%)',
    borderRadius: '24px',
    padding: '16px 0 0',
  },
  heroImage: {
    width: '100%',
    maxWidth: '320px',
    height: 'auto',
    filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.15))',
    transform: 'translateY(20px)',
  },

  // ---- FEATURES (compactes) ----
  featuresSection: {
    backgroundColor: '#f9fafb',
    padding: '64px 24px 56px',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(24px, 4vw, 32px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '32px',
    color: '#111827',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  // ✅ Carte horizontale : icône à gauche, texte à droite
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '16px',
    textAlign: 'left',
    border: '1px solid #f3f4f6',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  featureIcon: {
    fontSize: '22px',
    backgroundColor: '#f0fdfa',
    width: '44px',
    height: '44px',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  featureText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.45',
    margin: 0,
  },

  // ---- TESTIMONIALS ----
  testimonialsSection: {
    padding: '56px 24px',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  testimonialCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    padding: '24px 20px',
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
    fontSize: '15px',
    lineHeight: '1.55',
    fontStyle: 'italic',
    margin: '0 0 16px 0',
    color: 'inherit',
  },
  testimonialAuthor: {
    fontSize: '13px',
    fontWeight: '700',
    opacity: 0.8,
  },

  // ---- METHOD SECTION (compacte + palette harmonisée) ----
  methodSection: {
    padding: '56px 24px',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    maxWidth: '560px',
    margin: '0 auto 32px',
    lineHeight: '1.6',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  // ✅ Carte compacte : numéro + icône + titre sur une seule ligne
  stepCard: {
    borderRadius: '14px',
    padding: '16px 18px',
    textAlign: 'left',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  stepIcon: {
    fontSize: '24px',
    lineHeight: 1,
  },
  stepTitle: {
    fontSize: '17px',
    fontWeight: '700',
  },
  stepNum: {
    opacity: 0.6,
    fontWeight: '700',
    marginRight: '2px',
  },
  stepText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.5',
    margin: 0,
  },

  // ---- CTA FINAL ----
  ctaSection: {
    background: 'linear-gradient(to right, #14B8A6, #0F766E)',
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
