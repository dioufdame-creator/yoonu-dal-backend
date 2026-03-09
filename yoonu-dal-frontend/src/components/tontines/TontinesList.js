import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import TontineCardV2 from './TontineCardV2';

// ==========================================
// TONTINES LIST V2 - PREMIUM PAGE
// Matching Dashboard V6 design
// ==========================================

const TontinesListV2 = ({ onNavigate, toast }) => {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTontines();
  }, []);

  const loadTontines = async () => {
    setLoading(true);
    try {
      const response = await API.get('/tontines/');
      setTontines(response.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError?.('Erreur chargement tontines');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculées
  const stats = {
    total: tontines.length,
    active: tontines.filter(t => t.status === 'active').length,
    planning: tontines.filter(t => t.status === 'planning').length,
    completed: tontines.filter(t => t.status === 'completed').length,
    totalContribution: tontines
      .filter(t => t.status === 'active' || t.status === 'planning')
      .reduce((sum, t) => sum + (t.monthly_contribution || 0), 0),
    totalAmount: tontines.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  };

  // Filtrage
  const filteredTontines = tontines.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.invitation_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🦁</span>
                <span>Mes Tontines</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">Épargne collective et solidaire</p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span className="hidden sm:inline">Nouvelle tontine</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Tontines</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
            <div className="text-sm text-green-700 mb-1">Actives</div>
            <div className="text-3xl font-bold text-green-700">{stats.active}</div>
            <div className="text-xs text-green-600 mt-1">En cours</div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
            <div className="text-sm text-amber-700 mb-1">Planning</div>
            <div className="text-3xl font-bold text-amber-700">{stats.planning}</div>
            <div className="text-xs text-amber-600 mt-1">À démarrer</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200">
            <div className="text-sm text-orange-700 mb-1">Contribution</div>
            <div className="text-xl font-bold text-orange-700">
              {formatCurrency(stats.totalContribution)}
            </div>
            <div className="text-xs text-orange-600 mt-1">Par mois</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'Toutes', count: stats.total },
                { key: 'active', label: 'Actives', count: stats.active },
                { key: 'planning', label: 'Planning', count: stats.planning },
                { key: 'completed', label: 'Terminées', count: stats.completed }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${
                    filter === f.key
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredTontines.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🦁</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'Aucune tontine trouvée' : 'Aucune tontine'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filter !== 'all' ? 'Essaie d\'autres filtres' : 'Commence ton épargne collective'}
            </p>
            {!searchTerm && filter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                ➕ Créer ma première tontine
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTontines.map(tontine => (
              <TontineCardV2
                key={tontine.id}
                tontine={tontine}
                onNavigate={onNavigate}
                toast={toast}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Create */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Créer une tontine</h3>
            <p className="text-gray-600 mb-4">Formulaire à implémenter...</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full bg-gray-100 px-4 py-2 rounded-xl font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TontinesListV2;