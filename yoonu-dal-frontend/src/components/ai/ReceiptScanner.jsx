import React, { useState } from 'react';
import API from '../../services/api';

const ReceiptScanner = ({ onReceiptScanned, onClose, toast }) => {
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scannedData, setScannedData] = useState(null);

  // Gérer l'upload de l'image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Scanner
    setScanning(true);
    setScannedData(null);

    try {
      // Convertir en base64
      const base64 = await new Promise((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result);
        r.readAsDataURL(file);
      });

      // Envoyer à l'API
      const response = await API.post('/ai/scan-receipt/', {
        image: base64
      });

      if (response.data.success) {
        setScannedData(response.data.data);
      } else {
        const errorMsg = response.data.error || 'Scan impossible';
        toast?.showError?.(errorMsg) || alert('Erreur : ' + errorMsg);
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      const errorMsg = error.response?.data?.error || error.message;
      toast?.showError?.('Erreur scan : ' + errorMsg) || alert('Erreur scan : ' + errorMsg);
    } finally {
      setScanning(false);
    }
  };

  // ✅ CORRECTION : Confirmer et CRÉER la dépense via API
  const handleConfirm = async () => {
    if (!scannedData) return;
    
    setScanning(true);
    
    try {
      // ✅ APPEL API pour créer la dépense
      const response = await API.post('/expenses/', {
        amount: scannedData.amount,
        category: scannedData.category,
        description: scannedData.description || scannedData.merchant || 'Dépense scannée',
        date: scannedData.date || new Date().toISOString().split('T')[0],
        envelope: null // Ou mapper la catégorie vers une enveloppe si besoin
      });
      
      console.log('✅ Dépense créée:', response.data);
      
      // ✅ Notifier le parent si callback existe
      if (onReceiptScanned) {
        onReceiptScanned(response.data);
      }
      
      // ✅ Dispatcher l'event pour rafraîchir ExpenseTracker
      window.dispatchEvent(new Event('expense-added'));
      
      // ✅ Message de succès
      toast?.showSuccess?.('Dépense ajoutée avec succès !') || alert('✅ Dépense ajoutée avec succès !');
      
      handleCancel();
      
    } catch (error) {
      console.error('❌ Erreur ajout dépense:', error);
      const errorMsg = error.response?.data?.error || error.message;
      toast?.showError?.('Erreur : ' + errorMsg) || alert('❌ Erreur : ' + errorMsg);
    } finally {
      setScanning(false);
    }
  };

  // Annuler
  const handleCancel = () => {
    setPreviewUrl(null);
    setScannedData(null);
    setScanning(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">📸 Scanner un reçu</h3>
            <button
              onClick={handleCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs opacity-90 mt-1">
            Prends une photo claire du reçu
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload zone */}
          {!previewUrl && (
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-gray-700 font-semibold mb-2">
                  Cliquer pour choisir une photo
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG ou GIF • Max 10 MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Preview + Résultat */}
          {previewUrl && (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Reçu"
                  className="w-full rounded-lg shadow-md"
                />
                {scanning && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="animate-spin text-4xl mb-2">🔄</div>
                      <p className="text-sm font-semibold">
                        {scannedData ? 'Enregistrement...' : 'Analyse en cours...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Résultat du scan */}
              {scannedData && !scanning && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center">
                    <span className="text-xl mr-2">✅</span>
                    Reçu analysé
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Magasin :</span>
                      <span className="font-semibold">{scannedData.merchant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant :</span>
                      <span className="font-bold text-green-700 text-lg">
                        {scannedData.amount.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Catégorie :</span>
                      <span className="font-semibold capitalize">{scannedData.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date :</span>
                      <span className="font-semibold">{scannedData.date}</span>
                    </div>

                    {scannedData.items && scannedData.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-gray-600 text-xs mb-2">Articles :</p>
                        <ul className="text-xs space-y-1">
                          {scannedData.items.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {scannedData.confidence === 'low' && (
                      <div className="mt-3 pt-3 border-t border-orange-200 bg-orange-50 p-2 rounded">
                        <p className="text-xs text-orange-700">
                          ⚠️ Confiance faible - Vérifie les informations
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={scanning}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ❌ Annuler
                </button>
                {scannedData && (
                  <button
                    onClick={handleConfirm}
                    disabled={scanning}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ✅ Ajouter cette dépense
                  </button>
                )}
              </div>

              {!scannedData && !scanning && (
                <label className="block">
                  <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    🔄 Scanner une autre photo
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;