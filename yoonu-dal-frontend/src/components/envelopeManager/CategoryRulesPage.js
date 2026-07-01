import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ENVELOPE_CONFIG = {
  essentiels: { label: 'Essentiels', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', emoji: '🏠' },
  plaisirs:   { label: 'Plaisirs',   color: 'bg-teal-100 text-teal-700 border-teal-200', dot: 'bg-teal-500', emoji: '🎉' },
  projets:    { label: 'Projets',    color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', emoji: '🎯' },
  liberation: { label: 'Libération', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', emoji: '🕊️' },
};

const CategoryRulesPage = ({ onNavigate, toast }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // category en cours de sauvegarde
  const [customizedCount, setCustomizedCount] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [filterEnvelope, setFilterEnvelope] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await API.get('/category-rules/');
      setCategories(res.data.categories);
      setCustomizedCount(res.data.customized_count);
    } catch (err) {
      toast?.showError('Impossible de charger les règles');
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (category, newEnvelope) => {
    setSaving(category);
    // Mise à jour optimiste
    setCategories(prev => prev.map(c =>
      c.category === category
        ? { ...c, current_envelope: newEnvelope, is_customized: newEnvelope !== c.default_envelope }
        : c
    ));

    try {
      const res = await API.post('/category-rules/update/', {
        category,
        envelope: newEnvelope,
      });
      setCustomizedCount(prev => {
        const cat = categories.find(c => c.category === category);
        const wasCustomized = cat?.is_customized;
        const isNowCustomized = newEnvelope !== cat?.default_envelope;
        if (!wasCustomized && isNowCustomized) return prev + 1;
        if (wasCustomized && !isNowCustomized) return prev - 1;
        return prev;
      });
      toast?.showSuccess(res.data.message);
    } catch (err) {
      // Rollback
      loadRules();
      toast?.showError('Erreur lors de la mise à jour');
    } finally {
      setSaving(null);
    }
  };

  const resetRules = async () => {
    try {
      const res = await API.post('/category-rules/reset/');
      toast?.showSuccess(res.data.message);
      setShowResetConfirm(false);
      loadRules();
    } catch (err) {
      toast?.showError('Erreur lors de la réinitialisation');
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesEnvelope = filterEnvelope === 'all' || cat.current_envelope === filterEnvelope;
    const matchesSearch = cat.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEnvelope && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des règles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('envelopes')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
          >
            ← Retour aux enveloppes
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">🗂️ Mes règles de classement</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Chaque personne organise son argent selon sa réalité. Choisissez dans quelle enveloppe
            ranger chaque catégorie.
          </p>
        </div>

        {/* Bandeau personnalisations */}
        {customizedCount > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">✏️</span>
              <span className="text-sm text-blue-800 font-medium">
                {customizedCount} règle{customizedCount > 1 ? 's' : ''} personnalisée{customizedCount > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              Restaurer les règles Yoonu Dal
            </button>
          </div>
        )}

        {/* Légende enveloppes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {Object.entries(ENVELOPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterEnvelope(filterEnvelope === key ? 'all' : key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                filterEnvelope === key
                  ? config.color + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
              <span className="ml-auto text-gray-400">
                {categories.filter(c => c.current_envelope === key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Rechercher une catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Liste des catégories */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>Aucune catégorie trouvée</p>
            </div>
          ) : (
            filteredCategories.map((cat, idx) => {
              const currentConfig = ENVELOPE_CONFIG[cat.current_envelope];
              const defaultConfig = ENVELOPE_CONFIG[cat.default_envelope];
              return (
                <div
                  key={cat.category}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < filteredCategories.length - 1 ? 'border-b border-gray-100' : ''
                  } ${cat.is_customized ? 'bg-blue-50/30' : ''}`}
                >
                  {/* Label catégorie */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        {cat.label}
                      </span>
                      {cat.is_customized && (
                        <span className="text-xs text-blue-500 font-medium flex-shrink-0">✏️</span>
                      )}
                    </div>
                    {cat.is_customized && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Défaut : {defaultConfig?.label}
                      </p>
                    )}
                  </div>

                  {/* Dropdown enveloppe */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {saving === cat.category && (
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <select
                      value={cat.current_envelope}
                      onChange={(e) => updateRule(cat.category, e.target.value)}
                      disabled={saving === cat.category}
                      className={`text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${currentConfig?.color} disabled:opacity-50`}
                    >
                      {Object.entries(ENVELOPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.emoji} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note coach */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-800 font-semibold mb-1">💡 Note de Yoonu Dal</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Yoonu Dal propose une méthode, mais vous adaptez les règles à votre vie.
            Si vos essentiels dépassent 70% de vos dépenses, votre coach IA vous le signalera
            et suggèrera de revoir certains classements.
          </p>
        </div>

        {/* Bouton reset si pas de perso */}
        {customizedCount === 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">Vous utilisez les règles par défaut Yoonu Dal</p>
          </div>
        )}

      </div>

      {/* Modal confirmation reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-4xl mb-3 text-center">🔄</div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Restaurer les règles Yoonu Dal ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Toutes vos personnalisations seront supprimées et les règles par défaut restaurées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={resetRules}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                Restaurer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryRulesPage;
