// src/components/quickadd/QuickAdd.jsx
// Saisie rapide — bouton sticky + catégories alignées sur ExpenseTracker
import React, { useState } from 'react';
import API from '../../services/api';

// Catégories fréquentes affichées en premier
const TOP_EXPENSE_CATEGORIES = [
  { value: 'alimentation',       label: 'Alimentation',        icon: '🍽️' },
  { value: 'transport',          label: 'Transport',           icon: '🚗' },
  { value: 'maison_courses',     label: 'Maison / Courses',    icon: '🛒' },
  { value: 'solidarite_famille', label: 'Solidarité / Famille',icon: '👨‍👩‍👧' },
  { value: 'restaurant',         label: 'Restaurant / Café',   icon: '🍜' },
  { value: 'loyer',              label: 'Loyer',               icon: '🏠' },
];

// Liste complète — mêmes value/label/icon que ExpenseTracker
const ALL_EXPENSE_CATEGORIES = [
  { value: 'loyer',               label: 'Loyer',                  icon: '🏠' },
  { value: 'alimentation',        label: 'Alimentation',           icon: '🍽️' },
  { value: 'transport',           label: 'Transport',              icon: '🚗' },
  { value: 'sante_courante',      label: 'Santé courante',         icon: '💊' },
  { value: 'eau_electricite',     label: 'Eau / Électricité',      icon: '💡' },
  { value: 'telephone_internet',  label: 'Téléphone / Internet',   icon: '📱' },
  { value: 'aide_menagere',       label: 'Aide ménagère',          icon: '🧹' },
  { value: 'solidarite_famille',  label: 'Solidarité / Famille',   icon: '👨‍👩‍👧' },
  { value: 'maison_courses',      label: 'Maison / Courses',       icon: '🛒' },
  { value: 'restaurant',          label: 'Restaurant / Café',      icon: '🍜' },
  { value: 'loisirs',             label: 'Loisirs / Sorties',      icon: '🎬' },
  { value: 'vetements',           label: 'Vêtements / Mode',       icon: '👔' },
  { value: 'beaute',              label: 'Beauté / Coiffure',      icon: '💅' },
  { value: 'voyage',              label: 'Voyage / Vacances',      icon: '✈️' },
  { value: 'education',           label: 'Éducation / Scolarité',  icon: '📚' },
  { value: 'epargne',             label: 'Épargne / Invest.',      icon: '💰' },
  { value: 'fetes_ceremonies',    label: 'Fêtes & Cérémonies',     icon: '🎊' },
  { value: 'spiritualite',        label: 'Spiritualité / Aumône',  icon: '🕌' },
  { value: 'sante_exceptionnelle',label: 'Santé exceptionnelle',   icon: '🏥' },
  { value: 'immobilier',          label: 'Immobilier / Constr.',   icon: '🏗️' },
  { value: 'tontine_epargne',     label: 'Tontine / Épargne coll.',icon: '🤝' },
  { value: 'remboursement_dette', label: 'Remboursement dette',    icon: '💳' },
  { value: 'autre',               label: 'Autre',                  icon: '📝' },
];

const INCOME_SOURCES = [
  { value: 'Salaire',        label: 'Salaire',        icon: '💼' },
  { value: 'Business',       label: 'Business',       icon: '🏪' },
  { value: 'Freelance',      label: 'Freelance',      icon: '💻' },
  { value: 'Location',       label: 'Location',       icon: '🏠' },
  { value: 'Investissement', label: 'Investissement', icon: '📈' },
  { value: 'remboursement_recu', label: 'Remboursement reçu', icon: '🤝' },
  { value: 'Autre',          label: 'Autre',          icon: '💵' },
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
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(new Date().getDate());

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
      const finalDescription = description || categories.find(c => c.value === category)?.label || category;

      if (isExpense) {
        await API.post('/expenses/', {
          amount: parseFloat(amount),
          category,
          description: finalDescription,
          date,
        });
        toast?.showSuccess('✅ Dépense enregistrée !');
      } else {
        await API.post('/incomes/', {
          amount: parseFloat(amount),
          source: category,
          description: finalDescription,
          date,
        });
        toast?.showSuccess('✅ Revenu enregistré !');
      }

      // ✅ Créer le patron récurrent si demandé
      if (makeRecurring) {
        try {
          await API.post('/recurring/', {
            type: isExpense ? 'expense' : 'income',
            category_or_source: category,
            description: finalDescription,
            amount: parseFloat(amount),
            day_of_month: recurringDay,
          });
          toast?.showSuccess('🔁 Transaction récurrente activée !');
        } catch {
          // silencieux — la transaction principale est déjà enregistrée
        }
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

          {/* 1. MONTANT */}
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
            {isExpense && showAllCategories && (
              <button
                onClick={() => setShowAllCategories(false)}
                className="w-full mt-3 py-2 text-sm text-gray-400 font-semibold hover:text-gray-600"
              >
                Réduire ↑
              </button>
            )}
          </div>

          {/* 3. NOTE + DATE */}
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

          {/* 4. RENDRE RÉCURRENT */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 mb-4 shadow-sm">
            <button
              onClick={() => setMakeRecurring(!makeRecurring)}
              className="w-full flex items-center gap-3"
            >
              <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${
                makeRecurring ? 'bg-green-500' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  makeRecurring ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-800">🔁 Rendre récurrent</p>
                <p className="text-xs text-gray-400">Se répète automatiquement chaque mois</p>
              </div>
            </button>

            {makeRecurring && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                <span className="text-xs text-gray-500">Chaque mois le</span>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-green-500"
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* BOUTON STICKY */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-lg z-40">
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
