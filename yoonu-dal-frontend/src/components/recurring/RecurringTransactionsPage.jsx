// src/components/recurring/RecurringTransactionsPage.jsx
// Gestion des patrons de transactions récurrentes
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const CATEGORY_LABELS = {
  loyer: 'Loyer', alimentation: 'Alimentation', transport: 'Transport',
  sante_courante: 'Santé', eau_electricite: 'Eau / Électricité',
  telephone_internet: 'Téléphone / Internet', aide_menagere: 'Aide ménagère',
  solidarite_famille: 'Solidarité / Famille', maison_courses: 'Maison / Courses',
  restaurant: 'Restaurant', loisirs: 'Loisirs', vetements: 'Vêtements',
  beaute: 'Beauté', voyage: 'Voyage', education: 'Éducation', epargne: 'Épargne',
  fetes_ceremonies: 'Cérémonies', spiritualite: 'Spiritualité',
  sante_exceptionnelle: 'Santé except.', immobilier: 'Immobilier',
  tontine_epargne: 'Tontine', remboursement_dette: 'Dette', autre: 'Autre',
};

const RecurringTransactionsPage = ({ onNavigate, toast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/recurring/');
      setItems(res.data?.recurring_transactions || []);
    } catch {
      toast?.showError?.('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await API.patch(`/recurring/${item.id}/`, { is_active: !item.is_active });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
      toast?.showSuccess?.(item.is_active ? 'Désactivée' : 'Réactivée');
    } catch {
      toast?.showError?.('Erreur');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditAmount(item.amount.toString());
  };

  const saveEdit = async (item) => {
    try {
      await API.patch(`/recurring/${item.id}/`, { amount: parseFloat(editAmount) });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, amount: parseFloat(editAmount) } : i));
      toast?.showSuccess?.('Montant mis à jour');
      setEditingId(null);
    } catch {
      toast?.showError?.('Erreur lors de la mise à jour');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Supprimer "${item.description}" ? Cette action est définitive.`)) return;
    try {
      await API.delete(`/recurring/${item.id}/`);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast?.showSuccess?.('Supprimée');
    } catch {
      toast?.showError?.('Erreur lors de la suppression');
    }
  };

  const activeItems = items.filter(i => i.is_active);
  const inactiveItems = items.filter(i => !i.is_active);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderItem = (item) => (
    <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              item.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {item.type === 'expense' ? 'Dépense' : 'Revenu'}
            </span>
            <span className="text-xs text-gray-400">
              {CATEGORY_LABELS[item.category_or_source] || item.category_or_source}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 truncate">{item.description}</p>
          <p className="text-xs text-gray-400">Le {item.day_of_month} de chaque mois</p>
        </div>

        <div className="text-right flex-shrink-0">
          {editingId === item.id ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-green-500"
                autoFocus
              />
              <button onClick={() => saveEdit(item)} className="text-green-600 text-sm font-bold px-1">✓</button>
              <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm px-1">✕</button>
            </div>
          ) : (
            <p
              onClick={() => startEdit(item)}
              className={`text-sm font-bold cursor-pointer hover:underline ${
                item.type === 'expense' ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {formatFCFA(item.amount)} FCFA
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => toggleActive(item)}
          className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-colors ${
            item.is_active
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {item.is_active ? 'Mettre en pause' : 'Réactiver'}
        </button>
        <button
          onClick={() => remove(item)}
          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Supprimer
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onNavigate('profile-hub')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">🔁 Transactions récurrentes</h1>
            <p className="text-xs text-gray-400">Se répètent automatiquement chaque mois</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🔁</div>
            <p className="text-sm text-gray-500 mb-4">
              Aucune transaction récurrente pour l'instant.
            </p>
            <p className="text-xs text-gray-400">
              Coche "Rendre récurrent" en ajoutant une dépense ou un revenu pour ne plus avoir à le ressaisir chaque mois.
            </p>
          </div>
        ) : (
          <>
            {activeItems.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  Actives ({activeItems.length})
                </h2>
                <div className="space-y-2">
                  {activeItems.map(renderItem)}
                </div>
              </div>
            )}

            {inactiveItems.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  En pause ({inactiveItems.length})
                </h2>
                <div className="space-y-2 opacity-60">
                  {inactiveItems.map(renderItem)}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default RecurringTransactionsPage;
