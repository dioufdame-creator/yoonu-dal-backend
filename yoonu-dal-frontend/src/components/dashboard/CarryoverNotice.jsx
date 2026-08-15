// src/components/dashboard/CarryoverNotice.jsx
// Remplace CarryoverCard — simple notification, plus de décision à prendre
// (le solde du mois précédent rejoint automatiquement le Disponible)
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const CarryoverNotice = ({ onNavigate }) => {
  const [notice, setNotice] = useState(null);
  const [deficit, setDeficit] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

  useEffect(() => {
    API.get('/carryover/check/')
      .then(res => {
        if (res.data?.just_added) setNotice(res.data.just_added);
        if (res.data?.deficit) setDeficit(res.data.deficit);
      })
      .catch(() => {});
  }, []);

  if (dismissed || (!notice && !deficit)) return null;

  if (notice) {
    return (
      <button
        onClick={() => onNavigate?.('pockets')}
        className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-start gap-3 text-left hover:border-blue-300 transition-all"
      >
        <span className="text-lg flex-shrink-0">💰</span>
        <p className="text-sm text-blue-800 font-medium flex-1">
          +{formatFCFA(notice.amount)} FCFA de {notice.from_month_label} ajoutés à votre Disponible.
        </p>
        <span
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="text-blue-300 hover:text-blue-500 text-sm flex-shrink-0"
        >
          ✕
        </span>
      </button>
    );
  }

  if (deficit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-sm text-red-800 font-medium flex-1">
          Vous démarrez le mois avec un déficit de {formatFCFA(deficit.amount)} FCFA ({deficit.from_month_label}) à rattraper.
        </p>
        <button onClick={() => setDismissed(true)} className="text-red-300 hover:text-red-500 text-sm flex-shrink-0">✕</button>
      </div>
    );
  }

  return null;
};

export default CarryoverNotice;
