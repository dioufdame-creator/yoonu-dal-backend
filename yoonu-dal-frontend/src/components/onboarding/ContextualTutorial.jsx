// src/components/onboarding/ContextualTutorial.jsx
// Tutoriel contextuel — bulles pointant les vrais éléments de l'interface
// Remplace OnboardingTutorial.js (slides plein écran)
import React, { useState, useEffect, useRef } from 'react';

const TUTORIAL_KEY = 'yoonu_tutorial_done_v2';

// Chaque étape cible un élément réel via data-tutorial-target="..."
const STEPS = [
  {
    target: 'add-button',
    title: 'Ajoutez une dépense',
    text: 'Touchez le bouton vert pour enregistrer une dépense ou un revenu en quelques secondes.',
    position: 'top',
  },
  {
    target: 'score-card',
    title: 'Votre Score Yoonu Dal',
    text: 'Il évolue selon vos habitudes : plus vos dépenses reflètent vos valeurs, plus il grandit.',
    position: 'bottom',
  },
  {
    target: 'nav-profile',
    title: 'Retrouvez tout ici',
    text: 'Vos règles, vos dettes, votre historique et vos paramètres sont dans "Moi".',
    position: 'top',
  },
];

const ContextualTutorial = ({ onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (done) {
      onFinish?.();
      return;
    }
    // Laisser le Dashboard finir de se rendre avant de pointer les éléments
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const locate = () => {
      const el = document.querySelector(`[data-tutorial-target="${step.target}"]`);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };
    locate();
    window.addEventListener('resize', locate);
    const interval = setInterval(locate, 300); // suit l'élément s'il bouge (scroll, layout)
    return () => {
      window.removeEventListener('resize', locate);
      clearInterval(interval);
    };
  }, [visible, stepIndex]);

  const finish = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onFinish?.();
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setStepIndex((s) => s + 1);
    }
  };

  if (!visible) return null;

  // Élément introuvable (page pas encore chargée) → on n'affiche rien plutôt qu'un flou dans le vide
  if (!targetRect) {
    return (
      <div className="fixed inset-0 bg-black/40 z-[60]" />
    );
  }

  // Position de la bulle selon le point visé
  const bubbleStyle = (() => {
    const margin = 12;
    if (step.position === 'top') {
      return {
        bottom: `${window.innerHeight - targetRect.top + margin}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }
    return {
      top: `${targetRect.bottom + margin}px`,
      left: '50%',
      transform: 'translateX(-50%)',
    };
  })();

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay sombre avec trou découpé sur la cible */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 60 }}>
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 8}
              y={targetRect.top - 8}
              width={targetRect.width + 16}
              height={targetRect.height + 16}
              rx="20"
              fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tutorial-mask)" />
        <rect
          x={targetRect.left - 8}
          y={targetRect.top - 8}
          width={targetRect.width + 16}
          height={targetRect.height + 16}
          rx="20"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
        />
      </svg>

      {/* Zone cliquable pour fermer en tapant en dehors */}
      <div className="fixed inset-0" onClick={finish} />

      {/* Bulle d'explication */}
      <div
        className="fixed z-[61] w-[260px] bg-white rounded-2xl shadow-2xl p-4 animate-bubble-in"
        style={bubbleStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wide">
            Étape {stepIndex + 1}/{STEPS.length}
          </p>
          <button onClick={finish} className="text-gray-300 hover:text-gray-500 text-sm">
            Passer
          </button>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{step.text}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === stepIndex ? 'bg-green-600 w-4' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            {isLast ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bubble-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-bubble-in { animation: bubble-in 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default ContextualTutorial;
