// src/components/exports/ExportPage.jsx
// Page dédiée aux exports — accessible depuis Moi
import React, { useState } from 'react';
import API from '../../services/api';
import { PremiumButton } from '../subscription/SubscriptionComponents';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
      isCurrent: i === 0,
    });
  }
  return options;
};

const ExportPage = ({ onNavigate, toast, user }) => {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].key);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const selectedLabel = monthOptions.find(m => m.key === selectedMonth)?.label || '';

  const downloadFile = async (endpoint, filename, mimeType, setLoading) => {
    setLoading(true);
    try {
      const response = await API.get(`${endpoint}?month=${selectedMonth}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast?.showSuccess?.('Téléchargement démarré');
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = () => downloadFile(
    '/export/pdf/',
    `yoonu_dal_${selectedMonth}.pdf`,
    'application/pdf',
    setExportingPDF
  );

  const handleExcel = () => downloadFile(
    '/export/excel/',
    `yoonu_dal_${selectedMonth}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    setExportingExcel
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onNavigate('profile-hub')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">📄 Exporter mes données</h1>
            <p className="text-xs text-gray-400">Rapport complet de vos finances</p>
          </div>
        </div>

        {/* Sélection du mois */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
            Période à exporter
          </p>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-green-500"
          >
            {monthOptions.map(m => (
              <option key={m.key} value={m.key}>
                {m.label}{m.isCurrent ? ' (en cours)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Formats */}
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center text-xl">
                📄
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Rapport PDF</p>
                <p className="text-xs text-gray-500">Document prêt à imprimer ou partager</p>
              </div>
            </div>
            <PremiumButton
              user={user}
              feature="Export PDF"
              onUpgrade={() => onNavigate('pricing')}
              onClick={handlePDF}
              disabled={exportingPDF}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {exportingPDF ? 'Génération...' : `Télécharger le PDF de ${selectedLabel}`}
            </PremiumButton>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center text-xl">
                📊
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Fichier Excel</p>
                <p className="text-xs text-gray-500">Données brutes pour vos propres calculs</p>
              </div>
            </div>
            <PremiumButton
              user={user}
              feature="Export Excel"
              onUpgrade={() => onNavigate('pricing')}
              onClick={handleExcel}
              disabled={exportingExcel}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {exportingExcel ? 'Génération...' : `Télécharger l'Excel de ${selectedLabel}`}
            </PremiumButton>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Ce que contient le rapport :</strong> vos revenus, dépenses par catégorie,
            état des enveloppes, objectifs et score du mois sélectionné.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ExportPage;
