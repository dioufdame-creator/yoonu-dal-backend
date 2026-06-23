import React from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================
// COMPOSANT HOME2 - Landing Page améliorée de Yoonu Dal
// Remplace ou complète le Home.js existant
// ============================================================

const Home2 = () => {
  const navigate = useNavigate();

  return (
    <div style={css.page}>

      {/* ======================================================
          SECTION 1 : HERO
          Texte à gauche, mockup téléphone à droite (desktop)
          Empilés sur mobile
      ====================================================== */}
      <section style={css.hero}>
        <div style={css.heroText}>

          {/* Badge livre */}
          <div style={css.bookBadge}>
            📖 Inspiré du livre <em>Les Silences de nos Portefeuilles</em>
          </div>

          {/* Titre principal */}
          <h1 style={css.heroTitle}>
            Transformez vos{' '}
            <span style={css.heroTitleGreen}>silences financiers</span>{' '}
            en liberté
          </h1>

          {/* Sous-titre */}
          <p style={css.heroSubtitle}>
            Yoonu Dal vous guide vers une relation apaisée avec l'argent.
            Pas de miracles, juste une méthode éprouvée en 4 étapes.
            Que vous gagniez beaucoup ou peu, commencez là où vous êtes.
          </p>

          {/* Boutons CTA */}
          <div style={css.ctaGroup}>
            <button
              style={css.btnPrimary}
              onClick={() => navigate('/register')}
            >
              Commencer gratuitement
            </button>
            <button
              style={css.btnSecondary}
              onClick={() => navigate('/login')}
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Mockup téléphone */}
        <div style={css.heroImageWrap}>
          <img
            src="/assets/images/phone_mockup_dashboard.png"
            alt="Tableau de bord Yoonu Dal sur smartphone"
            style={css.heroImage}
          />
        </div>
      </section>

      {/* ======================================================
          SECTION 2 : QUESTION CLÉ (fond vert)
      ====================================================== */}
      <section style={css.questionSection}>
        <h2 style={css.questionTitle}>Où va votre argent chaque mois ?</h2>
        <p style={css.questionText}>
          La plupart des gens ne le savent pas vraiment.
          Yoonu Dal vous donne cette clarté en quelques minutes.
        </p>
      </section>

      {/* ======================================================
          SECTION 3 : LA MÉTHODE EN 4 ÉTAPES
      ====================================================== */}
      <section style={css.methodSection}>
        <h2 style={css.sectionTitle}>La méthode Yoonu Dal</h2>
        <p style={css.sectionSubtitle}>
          Inspirée du livre <em>Les Silences de nos Portefeuilles</em>,
          une approche progressive pour reprendre le contrôle.
        </p>

        <div style={css.stepsGrid}>
          {[
            {
              num: '1',
              icon: '👁️',
              title: 'Conscience',
              text: 'Ouvrez les yeux sur vos habitudes financières sans aucun jugement.',
              color: '#0a8043',
              bg: '#f0fdf4',
            },
            {
              num: '2',
              icon: '💡',
              title: 'Clarté',
              text: 'Comprenez exactement où va votre argent chaque mois.',
              color: '#d97706',
              bg: '#fffbeb',
            },
            {
              num: '3',
              icon: '🎯',
              title: 'Choix',
              text: 'Alignez vos décisions d\'achat avec vos priorités profondes.',
              color: '#2563eb',
              bg: '#eff6ff',
            },
            {
              num: '4',
              icon: '🚀',
              title: 'Contrôle',
              text: 'Reprenez le contrôle et construisez votre liberté financière.',
              color: '#7c3aed',
              bg: '#f5f3ff',
            },
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
          SECTION 4 : TÉMOIGNAGES
      ====================================================== */}
      <section style={css.testimonialsSection}>
        <h2 style={css.sectionTitle}>Ce que disent ceux qui l'ont essayé</h2>

        <div style={css.testimonialsGrid}>
          {[
            {
              avatar: '👩🏾‍🏫',
              name: 'Amsatou D.',
              role: 'Enseignante',
              quote: '"Fini l\'angoisse de fin de mois. Je sais exactement où va mon argent."',
            },
            {
              avatar: '👨🏾‍💻',
              name: 'Diégane F.',
              role: 'Développeur',
              quote: '"Les 4 enveloppes ont changé ma relation à l\'argent. Simple mais efficace."',
            },
            {
              avatar: '👩🏾‍💼',
              name: 'Laeticia K.',
              role: 'Entrepreneure',
              quote: '"Grâce aux tontines digitales, j\'ai pu racheter mon local."',
            },
          ].map((t) => (
            <div key={t.name} style={css.testimonialCard}>
              <div style={css.testimonialAvatar}>{t.avatar}</div>
              <div style={css.testimonialName}>{t.name}</div>
              <div style={css.testimonialRole}>{t.role}</div>
              <p style={css.testimonialQuote}>{t.quote}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          SECTION 5 : CTA FINAL (fond vert foncé)
      ====================================================== */}
      <section style={css.ctaSection}>
        <h2 style={css.ctaTitle}>Prêt à reprendre le contrôle ?</h2>
        <p style={css.ctaText}>
          Rejoignez les personnes qui transforment leur relation à l'argent avec Yoonu Dal.
        </p>
        <button
          style={css.btnCta}
          onClick={() => navigate('/register')}
        >
          Commencer maintenant — C'est gratuit
        </button>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <footer style={css.footer}>
        <div style={css.footerLeft}>
          <div style={css.footerLogo}>🌱 Yoonu Dal</div>
          <div style={css.footerTagline}>Une approche humaine vers la sérénité financière</div>
        </div>
        <div style={css.footerRight}>
          <div style={css.footerContactTitle}>Contact</div>
          <a href="mailto:contact@yoonudal.com" style={css.footerEmail}>
            contact@yoonudal.com
          </a>
        </div>
        <div style={css.footerCopyright}>
          © 2026 Yoonu Dal. Tous droits réservés.
        </div>
      </footer>

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
    padding: '48px 24px 0',
    maxWidth: '1100px',
    margin: '0 auto',
    // Sur desktop (>768px), utiliser flexDirection: 'row' via CSS media query
    // Ici on garde column pour mobile-first
  },
  heroText: {
    textAlign: 'center',
    maxWidth: '600px',
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
    fontSize: 'clamp(28px, 5vw, 44px)',
    fontWeight: '800',
    lineHeight: '1.2',
    marginTop: 0,
    marginBottom: '20px',
    color: '#111827',
  },
  heroTitleGreen: {
    color: '#0a8043',
  },
  heroSubtitle: {
    fontSize: '17px',
    color: '#4b5563',
    lineHeight: '1.7',
    marginBottom: '32px',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  },
  btnPrimary: {
    width: '100%',
    maxWidth: '320px',
    padding: '16px 24px',
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
    width: '100%',
    maxWidth: '320px',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    color: '#111827',
    border: '1.5px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  heroImageWrap: {
    marginTop: '40px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: '280px',
    height: 'auto',
    filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.12))',
  },

  // ---- QUESTION SECTION ----
  questionSection: {
    backgroundColor: '#0a8043',
    color: '#ffffff',
    textAlign: 'center',
    padding: '56px 24px',
    marginTop: '-2px',
  },
  questionTitle: {
    fontSize: 'clamp(22px, 4vw, 32px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '16px',
  },
  questionText: {
    fontSize: '17px',
    opacity: 0.9,
    maxWidth: '560px',
    margin: '0 auto',
    lineHeight: '1.6',
  },

  // ---- METHOD SECTION ----
  methodSection: {
    padding: '64px 24px',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(22px, 4vw, 30px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '12px',
    color: '#111827',
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
    gap: '16px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  stepCard: {
    borderRadius: '16px',
    padding: '28px 20px',
    textAlign: 'left',
  },
  stepNum: {
    fontSize: '13px',
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

  // ---- TESTIMONIALS ----
  testimonialsSection: {
    padding: '64px 24px',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    maxWidth: '900px',
    margin: '40px auto 0',
  },
  testimonialCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    padding: '28px 20px',
    textAlign: 'left',
    border: '1px solid #e5e7eb',
  },
  testimonialAvatar: {
    fontSize: '36px',
    marginBottom: '12px',
  },
  testimonialName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '2px',
  },
  testimonialRole: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '14px',
  },
  testimonialQuote: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    fontStyle: 'italic',
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
    fontSize: 'clamp(24px, 4vw, 34px)',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '17px',
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

  // ---- FOOTER ----
  footer: {
    backgroundColor: '#111827',
    color: '#9ca3af',
    padding: '40px 24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  footerLeft: {
    minWidth: '200px',
  },
  footerLogo: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px',
  },
  footerTagline: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  footerRight: {
    minWidth: '160px',
  },
  footerContactTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px',
  },
  footerEmail: {
    fontSize: '14px',
    color: '#9ca3af',
    textDecoration: 'none',
  },
  footerCopyright: {
    width: '100%',
    fontSize: '13px',
    textAlign: 'center',
    borderTop: '1px solid #1f2937',
    paddingTop: '20px',
    marginTop: '8px',
  },
};

export default Home2;
