// src/components/quickadd/QuickAdd.jsx
// Saisie rapide dépense/revenu — bouton Enregistrer sticky en bas
import React, { useState } from 'react';
import API from '../../services/api';

const TOP_EXPENSE_CATEGORIES = [
  { value: 'alimentation',       label: 'Alimentation',   icon: '🍽️' },
  { value: 'transport',          label: 'Transport',      icon: '🚗' },
  { value: 'maison_courses',     label: 'Courses maison', icon: '🛒' },
  { value: 'solidarite_famille', label: 'Famille',        icon: '👨‍👩‍👧' },
  { value: 'restaurant',         label: 'Restaurant',     icon: '🍜' },
  { value: 'loyer',              label: 'Loyer',          icon: '🏠' },
];

const ALL_EXPENSE_CATEGORIES = [
  ...TOP_EXPENSE_CATEGORIES,
  { value: 'sante_courante',       label: 'Santé',              icon: '💊' },
  { value: 'eau_electricite',      label: 'Eau / Électricité',  icon: '💡' },
  { value: 'telephone_internet',   label: 'Téléphone',          icon: '📱' },
  { value: 'aide_menagere',        label: 'Aide ménagère',      icon: '🧹' },
  { value: 'loisirs',              label: 'Loisirs',            icon: '🎬' },
  { value: 'vetements',            label: 'Vêtements',          icon: '👔' },
  { value: 'beaute',               label: 'Beauté',             icon: '💅' },
  { value: 'voyage',               label: 'Voyage',             icon: '✈️' },
  { value: 'education',            label: 'Éducation',          icon: '📚' },
  { value: 'epargne',              label: 'Épargne',            icon: '💰' },
  { value: 'fetes_ceremonies',     label: 'Cérémonies',         icon: '🎊' },
  { value: 'spiritualite',         label: 'Spiritualité',       icon: '🕌' },
  { value: 'sante_exceptionnelle', label: 'Santé except.',      icon: '🏥' },
  { value: 'immobilier',           label: 'Immobilier',         icon: '🏗️' },
  { value: 'tontine_epargne',      label: 'Tontine',            icon: '🤝' },
  { value: 'remboursement_dette',  label: 'Dette',              icon: '💳' },
  { value: 'autre',                label: 'Autre',              icon: '📝' },
];

const INCOME_SOURCES = [
  { value: 'Salaire',        label: 'Salaire',       icon: '💼' },
  { value: 'Business',       label: 'Business',      icon: '🏪' },
  { value: 'Freelance',      label: 'Freelance',     icon: '💻' },
  { value: 'Location',       label: 'Location',      icon: '🏠' },
  { value: 'Investissement', label: 'Investissement',icon: '📈' },
  { value: 'Autre',          label: 'Autre',         icon: '💵' },
];

const QuickAdd = ({ type = 'expense', onNavigate, toast }) => {
  const isExpense = type === 'expense';
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = isExpense
    ? (showAllCategories ? ALL_EXPENSE_CATEGORIES : TOP_EXPENSE_CATEGORIES)
    : INCOME_SOURCES;

  const canSave = amount && category && !saving;

  const handleSubmit = async () => {
    if (!amount || !category) {
      toast?.showError('Montant et catégorie requis');
      return;
    }

    setSaving(true);
    try {
      if (isExpense) {
        await API.post('/expenses/', {
          amount: parseFloat(amount),
          category,
          description: description || categories.find(c => c.value === category)?.label || category,
          date,
        });
        toast?.showSuccess('✅ Dépense enregistrée !');
      } else {
        await API.post('/incomes/', {
          amount: parseFloat(amount),
          source: category,
          description: description || category,
          date,
        });
        toast?.showSuccess('✅ Revenu enregistré !');
      }
      onNavigate('dashboard');
    } catch (error) {
      toast?.showError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Contenu défilable */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-md mx-auto px-4 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {isExpense ? '💸 Nouvelle dépense' : '💵 Nouveau revenu'}
            </h1>
          </div>

          {/* 1. MONTANT — priorité visuelle */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 mb-4 text-center shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Montant</p>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="text-4xl font-bold text-gray-900 text-center w-full outline-none placeholder-gray-300"
            />
            <p className="text-sm text-gray-400 mt-1">FCFA</p>
          </div>

          {/* 2. CATÉGORIE */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 mb-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              {isExpense ? 'Catégorie' : 'Source'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-2xl border-2 transition-all text-center ${
                    category === cat.value
                      ? 'border-green-500 bg-green-50 scale-105'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className={`text-[11px] font-semibold leading-tight ${
                    category === cat.value ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {cat.label}
                  </div>
                </button>
              ))}
            </div>

            {isExpense && !showAllCategories && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="w-full mt-3 py-2 text-sm text-green-600 font-semibold hover:text-green-700"
              >
                Voir toutes les catégories ↓
              </button>
            )}
          </div>

          {/* 3. NOTE + DATE — repliés, optionnels */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 mb-4 shadow-sm space-y-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Note (optionnel)
              </p>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isExpense ? 'Ex: Marché Sandaga' : 'Ex: Salaire juin'}
                className="w-full text-sm outline-none placeholder-gray-300"
              />
            </div>

            {/* Date repliée par défaut (aujourd'hui) */}
            {!showDate ? (
              <button
                onClick={() => setShowDate(true)}
                className="text-xs text-gray-400 hover:text-green-600 flex items-center gap-1"
              >
                📅 Aujourd'hui · Modifier la date
              </button>
            ) : (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Date</p>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm outline-none"
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* BOUTON STICKY — toujours visible en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-lg z-30">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              canSave
                ? isExpense
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {saving ? 'Enregistrement...' : (isExpense ? 'Enregistrer la dépense' : 'Enregistrer le revenu')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAdd;
