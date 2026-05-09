import React, { useState } from 'react';
import { PremiumButton } from '../subscription/SubscriptionComponents';
import API from '../../services/api';

const ExportButtons = ({ user, onNavigate, toast, selectedMonth }) => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const monthParam = selectedMonth ? `?month=${selectedMonth}` : '';
  const monthLabel = selectedMonth || new Date().toISOString().slice(0, 7);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const response = await API.get(`/export/pdf/${monthParam}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yoonu_dal_rapport_${monthLabel}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast?.showSuccess?.('📄 Rapport PDF téléchargé !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast?.showError?.(error.response?.data?.error || error.message || 'Erreur export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const response = await API.get(`/export/excel/${monthParam}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yoonu_dal_rapport_${monthLabel}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast?.showSuccess?.('📊 Rapport Excel téléchargé !');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast?.showError?.(error.response?.data?.error || error.message || 'Erreur export Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="flex gap-3">
      <PremiumButton
        user={user}
        feature="Export PDF"
        onUpgrade={() => onNavigate('pricing')}
        onClick={handleExportPDF}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
        disabled={exportingPDF}
      >
        {exportingPDF ? (
          <><span className="animate-spin">⏳</span><span>Export...</span></>
        ) : (
          <><span>📄</span><span>Export PDF</span></>
        )}
      </PremiumButton>

      <PremiumButton
        user={user}
        feature="Export Excel"
        onUpgrade={() => onNavigate('pricing')}
        onClick={handleExportExcel}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
        disabled={exportingExcel}
      >
        {exportingExcel ? (
          <><span className="animate-spin">⏳</span><span>Export...</span></>
        ) : (
          <><span>📊</span><span>Export Excel</span></>
        )}
      </PremiumButton>
    </div>
  );
};

export default ExportButtons;
