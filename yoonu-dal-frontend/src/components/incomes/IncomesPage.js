// src/components/incomes/IncomesPage.js
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import IncomeModal from './IncomeModal';

const IncomesPage = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total_amount: 0,
    total_count: 0
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const loadIncomes = async () => {
    setLoading(true);
    try {
      const response = await API.get('/incomes/');
      if (response.data) {
        setIncomes(response.data.incomes || []);
        setStats({
          total_amount: response.data.total_amount || 0,
          total_count: response.data.total_count || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement revenus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, []);

  const handleIncomeAdded = () => {
    loadIncomes();
  };

  const handleDelete = async (incomeId) => {
    if (!window.confirm('Supprimer ce revenu ?')) return;

    try {
      await API.delete(`/incomes/${incomeId}/`);
      loadIncomes();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getSourceIcon = (source) => {
    const icons = {
      'Salaire': '💼',
      'Freelance': '💻',
      'Business': '🏢',
      'Investissement': '📈',
      'Location': '🏠',
      'Pension': '👴',
      'Allocation': '🎁',
      'Prime': '⭐',
      'Cadeau': '🎁',
      'Autre': '💰'
    };
    return icons[source] || '💰';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">💰 Mes Revenus</h1>
        <p className="text-green-100">Gérez tous vos revenus</p>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm mb-1">Total des revenus</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_amount)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm mb-1">Nombre de revenus</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.total_count}
            </p>
          </div>
        </div>

        {/* Bouton Ajouter */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors mb-6 flex items-center justify-center gap-2"
        >
          <span className="text-xl">➕</span>
          Ajouter un revenu
        </button>

        {/* Liste des revenus */}
        {incomes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">💸</div>
            <p className="text-gray-600 mb-4">
              Aucun revenu enregistré
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ajouter mon premier revenu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {incomes.map(income => (
              <div
                key={income.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{getSourceIcon(income.source)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {income.source}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDate(income.date)}
                        </span>
                      </div>
                      {income.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {income.description}
                        </p>
                      )}
                      <p className="text-lg font-bold text-green-600">
                        + {formatCurrency(income.amount)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Bouton Supprimer */}
                  <button
                    onClick={() => handleDelete(income.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale d'ajout */}
      <IncomeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onIncomeAdded={handleIncomeAdded}
      />
    </div>
  );
};

export default IncomesPage;
