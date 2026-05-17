// src/components/onboarding/OnboardingTutorial.js
// Tuto simple affiché une seule fois après l'onboarding

import React, { useState, useEffect } from 'react';

const TUTORIAL_KEY = 'yoonu_tutorial_done';

const steps = [
  {
    emoji: '🌿',
    title: 'Bienvenue sur Yoonu Dal !',
    description: 'Ton coach financier personnel est prêt. En 2 minutes, découvre comment tirer le meilleur de l\'app.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    emoji: '📊',
    title: 'Budget & Enveloppes',
    description: 'Va dans "Budget" pour voir tes 4 enveloppes : Essentiels, Plaisirs, Projets et Libération. Tu peux ajuster les pourcentages selon ta réalité.',
    color: 'from-blue-500 to-indigo-600',
    action: 'envelopes',
    actionLabel: 'Voir mes enveloppes'
  },
  {
    emoji: '💸',
    title: 'Revenus & Dépenses',
    description: 'Dans "Transactions", enregistre chaque revenu et dépense. L\'app calcule automatiquement ton score d\'alignement avec tes valeurs.',
    color: 'from-purple-500 to-violet-600',
    action: 'transactions',
    actionLabel: 'Voir mes transactions'
  },
  {
    emoji: '🎯',
    title: 'Objectifs financiers',
    description: 'Crée des objectifs concrets — terrain, voyage, fonds d\'urgence. Suis ta progression et reste motivé.',
    color: 'from-orange-500 to-amber-600',
    action: 'goals',
    actionLabel: 'Créer un objectif'
  },
  {
    emoji: '🔓',
    title: 'Gestion des dettes',
    description: 'Dans "Dettes", enregistre tes remboursements. Chaque paiement compte dans ton enveloppe Libération.',
    color: 'from-red-500 to-rose-600',
    action: 'debts',
    actionLabel: 'Gérer mes dettes'
  },
  {
    emoji: '🦁',
    title: 'Tontines digitales',
    description: 'Crée une tontine avec ta famille ou tes amis, partage le code d\'invitation et suivez vos contributions ensemble.',
    color: 'from-teal-500 to-cyan-600',
    action: 'tontines',
    actionLabel: 'Voir les tontines'
  },
  {
    emoji: '🌟',
    title: 'C\'est parti !',
    description: 'Tu as tout ce qu\'il faut. Commence par enregistrer ton premier revenu ou ta première dépense. Ton score Yoonu Dal se mettra à jour automatiquement.',
    color: 'from-green-500 to-emerald-600',
  },
];

const OnboardingTutorial = ({ onNavigate, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) {
      setVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onClose?.();
  };

  const handleAction = (page) => {
    handleClose();
    onNavigate?.(page);
  };

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">

        {/* Header coloré */}
        <div className={`bg-gradient-to-br ${step.color} p-8 text-center text-white relative`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-xl"
          >
            ✕
          </button>
          <div className="text-6xl mb-4">{step.emoji}</div>
          <h2 className="text-xl font-bold leading-tight">{step.title}</h2>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <p className="text-gray-600 text-center leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Bouton action optionnel */}
          {step.action && (
            <button
              onClick={() => handleAction(step.action)}
              className={`w-full bg-gradient-to-r ${step.color} text-white py-3 rounded-2xl font-semibold mb-3 hover:opacity-90 transition-all`}
            >
              {step.actionLabel} →
            </button>
          )}

          {/* Bouton suivant */}
          <button
            onClick={handleNext}
            className={`w-full py-3 rounded-2xl font-semibold transition-all ${
              step.action
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : `bg-gradient-to-r ${step.color} text-white hover:opacity-90`
            }`}
          >
            {isLast ? '🚀 Commencer !' : 'Suivant →'}
          </button>

          {/* Indicateurs de progression */}
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 h-2 bg-green-500'
                    : 'w-2 h-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Passer */}
          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 py-1"
          >
            Passer le tutoriel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
