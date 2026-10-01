// src/components/profile/CurrencySettingsPage.jsx
// Page de choix de la devise d'affichage de l'utilisateur.
import React, { useState } from 'react';
import API from '../../services/api';
import authService from '../../services/authService';
import { getCurrencyOptions, DEFAULT_CURRENCY } from '../../utils/currency';
import { useCurrency } from '../../contexts/CurrencyContext';

const CurrencySettingsPage = ({ onNavigate, user, setUser, toast }) => {
  const { currency } = useCurrency();
  const [selected, setSelected] = useState(currency || DEFAULT_CURRENCY);
  const [saving, setSaving] = useState(false);
  const options = getCurrencyOptions();

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/profile/', { currency: selected });
      const freshUser = await authService.getUserProfile();
      if (freshUser && setUser) setUser(freshUser);
      toast?.showSuccess?.('Devise mise à jour');
      onNavigate('profile-hub');
    } catch (err) {
      toast?.showError?.("Impossible de mettre à jour la devise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => onNavigate('profile-hub')}
          className="text-sm text-gray-500 mb-4 flex items-center gap-1"
        >
          ← Retour
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Devise</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choisissez la devise utilisée pour afficher vos montants. Cela ne
          convertit pas vos données, seul l'affichage change.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-6">
          {options.map((opt, idx) => (
            <button
              key={opt.code}
              onClick={() => setSelected(opt.code)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors ${
                idx < options.length - 1 ? 'border-b border-gray-100' : ''
              } ${selected === opt.code ? 'bg-green-50' : ''}`}
            >
              <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
              {selected === opt.code && <span className="text-green-600 text-lg">✓</span>}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selected === currency}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};

export default CurrencySettingsPage;
