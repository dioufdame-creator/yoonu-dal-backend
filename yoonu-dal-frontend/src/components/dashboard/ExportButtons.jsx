import React, { useState } from 'react';
import { PremiumButton } from '../subscription/SubscriptionComponents';

const ExportButtons = ({ user, onNavigate, toast }) => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/export/pdf/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('yoonu_dal_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yoonu_dal_rapport_${new Date().toISOString().slice(0, 7)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast?.showSuccess?.('📄 Rapport PDF téléchargé !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast?.showError?.(error.message || 'Erreur export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/export/excel/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('yoonu_dal_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur export Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yoonu_dal_rapport_${new Date().toISOString().slice(0, 7)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast?.showSuccess?.('📊 Rapport Excel téléchargé !');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast?.showError?.(error.message || 'Erreur export Excel');
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
          <>
            <span className="animate-spin">⏳</span>
            <span>Export...</span>
          </>
        ) : (
          <>
            <span>📄</span>
            <span>Export PDF</span>
          </>
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
          <>
            <span className="animate-spin">⏳</span>
            <span>Export...</span>
          </>
        ) : (
          <>
            <span>📊</span>
            <span>Export Excel</span>
          </>
        )}
      </PremiumButton>
    </div>
  );
};

export default ExportButtons;
