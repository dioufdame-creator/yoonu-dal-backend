// src/components/quickadd/QuickAdd.jsx
// Saisie rapide — Dépense / Revenu / Épargner (vers une poche ou un objectif)
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TOP_EXPENSE_CATEGORIES = [
  { value: 'alimentation',       label: 'Alimentation',        icon: '🍽️' },
  { value: 'transport',          label: 'Transport',           icon: '🚗' },
  { value: 'maison_courses',     label: 'Maison / Courses',    icon: '🛒' },
  { value: 'solidarite_famille', label: 'Solidarité / Famille',icon: '👨‍👩‍👧' },
  { value: 'restaurant',         label: 'Restaurant / Café',   icon: '🍜' },
  { value: 'loyer',              label: 'Loyer',               icon: '🏠' },
];

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

const QuickAdd = ({ type = 'expense', onNavigate, toast, pageParams }) => {
  const isExpense = type === 'expense';
  const isSavings = type === 'savings';

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(isSavings ? 'epargne' : '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(new Date().getDate());

  // ── Mode Épargner — choix de la poche destination ──────────
  const [pockets, setPockets] = useState([]); // accounts + goals fusionnés
  const [destination, setDestination] = useState(''); // "account:3" ou "goal:7"
  const [loadingPockets, setLoadingPockets] = useState(isSavings);

  useEffect(() => {
    if (!isSavings) return;
    API.get('/pockets/')
      .then(res => {
        const accounts = (res.data?.accounts || []).map(a => ({
          type: 'account', id: a.id,
          name: a.account_type === 'disponible' ? 'Trésorerie' : a.name,
          icon: a.icon,
        }));
        const goals = (res.data?.goals || []).map(g => ({
          type: 'goal', id: g.id, name: g.title, icon: '🎯',
        }));
        // Trésorerie exclue — on épargne VERS une réserve/objectif, pas
        // vers la trésorerie elle-même (ça n'aurait pas de sens ici)
        const filtered = accounts.filter(a => a.name !== 'Trésorerie').concat(goals);
        setPockets(filtered);

        // ✅ Pré-sélection si on arrive depuis "Ajouter à mon objectif"
        const preselect = pageParams?.preselectGoalId;
        if (preselect && filtered.some(p => p.type === 'goal' && String(p.id) === String(preselect))) {
          setDestination(`goal:${preselect}`);
        } else if (filtered.length > 0) {
          setDestination(`${filtered[0].type}:${filtered[0].id}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPockets(false));
  }, [isSavings, pageParams]);

  const categories = isSavings ? [] : (isExpense
    ? (showAllCategories ? ALL_EXPENSE_CATEGORIES : TOP_EXPENSE_CATEGORIES)
    : INCOME_SOURCES);

  const canSave = isSavings
    ? amount && destination && !saving
    : amount && category && !saving;

  const handleSubmit = async () => {
    if (isSavings) {
      if (!amount || !destination) {
        toast?.showError('Montant et destination requis');
        return;
      }
      setSaving(true);
      try {
        const [destType, destId] = destination.split(':');
        const payload = {
          amount: parseFloat(amount),
          category: 'epargne',
          description: description || 'Épargne',
          date,
        };
        if (destType === 'account') payload.destination_account_id = destId;
        if (destType === 'goal') payload.destination_goal_id = destId;

        await API.post('/expenses/', payload);
        toast?.showSuccess('🎯 Épargne enregistrée !');

        if (makeRecurring) {
          try {
            await API.post('/recurring/', {
              type: 'expense',
              category_or_source: 'epargne',
              description: description || 'Épargne',
              amount: parseFloat(amount),
              day_of_month: recurringDay,
            });
            toast?.showSuccess('🔁 Épargne récurrente activée !');
          } catch {}
        }

        onNavigate('dashboard');
      } catch (error) {
        toast?.showError(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
      } finally {
        setSaving(false);
      }
      return;
    }

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
        } catch {}
      }

      onNavigate('dashboard');
    } catch (error) {
      toast?.showError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const titles = {
    expense: '💸 Nouvelle dépense',
    income: '💵 Nouveau revenu',
    savings: '🎯 Épargner',
  };

  const buttonColor = isSavings
    ? 'bg-gradient-to-r from-indigo-600 to-purple-700'
    : isExpense
      ? 'bg-gradient-to-r from-red-500 to-rose-600'
      : 'bg-gradient-to-r from-green-600 to-emerald-600';

  const buttonLabel = saving
    ? 'Enregistrement...'
    : isSavings ? 'Confirmer l\'épargne' : (isExpense ? 'Enregistrer la dépense' : 'Enregistrer le revenu');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <h1 className="text-lg font-bold text-gray-900">{titles[type] || titles.expense}</h1>
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

          {/* 2a. CATÉGORIE (dépense/revenu) — masqué en mode Épargner */}
          {!isSavings && (
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
          )}

          {/* 2b. DESTINATION — uniquement en mode Épargner */}
          {isSavings && (
            <div className="bg-white rounded-3xl border border-gray-200 p-4 mb-4 shadow-sm">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
                Vers quelle poche ?
              </p>

              {loadingPockets ? (
                <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>
              ) : pockets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">Aucune poche disponible.</p>
                  <button
                    onClick={() => onNavigate('pockets')}
                    className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold"
                  >
                    Créer une poche
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {pockets.map(p => {
                    const key = `${p.type}:${p.id}`;
                    return (
                      <button
                        key={key}
                        onClick={() => setDestination(key)}
                        className={`p-3 rounded-2xl border-2 transition-all text-center ${
                          destination === key
                            ? 'border-indigo-500 bg-indigo-50 scale-105'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{p.icon}</div>
                        <div className={`text-[11px] font-semibold leading-tight ${
                          destination === key ? 'text-indigo-700' : 'text-gray-600'
                        }`}>
                          {p.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-3">
                💡 Cette somme sort de votre budget du mois et rejoint la poche choisie.
              </p>
            </div>
          )}

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
                placeholder={isSavings ? 'Ex: Épargne mensuelle' : isExpense ? 'Ex: Marché Sandaga' : 'Ex: Salaire juin'}
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
                <p className="text-xs text-gray-400">
                  {isSavings ? 'Épargner automatiquement chaque mois' : 'Se répète automatiquement chaque mois'}
                </p>
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
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all text-white shadow-xl ${
              canSave ? buttonColor : 'bg-gray-200 text-gray-400 shadow-none'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAdd;
