import React, { useState } from 'react';
import API from '../../services/api';

const SimpleDiagnostic = ({ onNavigate, toast }) => {
  const [selectedValues, setSelectedValues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const VALUES = [
    { id: 'famille', name: 'Famille', icon: '👨‍👩‍👧‍👦', description: 'Prendre soin de mes proches' },
    { id: 'spiritualite', name: 'Spiritualité', icon: '🕌', description: 'Ma foi et mes valeurs religieuses' },
    { id: 'education', name: 'Éducation', icon: '📚', description: 'Apprendre et me former' },
    { id: 'sante', name: 'Santé', icon: '💪', description: 'Mon bien-être physique et mental' },
    { id: 'travail', name: 'Travail', icon: '💼', description: 'Ma carrière professionnelle' },
    { id: 'loisirs', name: 'Loisirs', icon: '🎭', description: 'Mes passions et divertissements' },
    { id: 'communaute', name: 'Communauté', icon: '🤝', description: 'Aider les autres et ma communauté' },
  ];

  const toggleValue = (valueId) => {
    setSelectedValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(v => v !== valueId);
      } else {
        if (prev.length >= 3) {
          toast?.showWarning('Tu ne peux choisir que 3 valeurs maximum');
          return prev;
        }
        return [...prev, valueId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedValues.length !== 3) {
      toast?.showError('Choisis exactement 3 valeurs');
      return;
    }

    setIsSubmitting(true);
    try {
      // Supprimer les anciennes valeurs
      await API.delete('/user-values/');

      // Créer les nouvelles valeurs avec priorité
      for (let i = 0; i < selectedValues.length; i++) {
        await API.post('/user-values/', {
          value: selectedValues[i],
          priority: i + 1
        });
      }
      // ✅ NOUVEAU : Déclencher le calcul du score
      try {
        await API.post('/calculate-score/');
        toast?.showSuccess('✅ Tes valeurs sont enregistrées et ton score est calculé !');
      } catch (scoreError) {
        console.error('Erreur calcul score:', scoreError);
        toast?.showSuccess('✅ Tes valeurs sont enregistrées ! (Score en cours de calcul...)');
      }
      //toast?.showSuccess('✅ Tes valeurs sont enregistrées !');
      
      // Attendre un peu puis rediriger
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);

    } catch (error) {
      console.error('Erreur sauvegarde valeurs:', error);
      toast?.showError('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriority = (valueId) => {
    const index = selectedValues.indexOf(valueId);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Diagnostic Yoonu Dal
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Choisis tes <strong>3 priorités</strong> dans la vie
          </p>
          <p className="text-sm text-gray-600">
            Clique pour sélectionner, puis glisse pour classer par ordre d'importance
          </p>
        </div>

        {/* Sélection compteur */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">
              {selectedValues.length === 0 && "Commence par choisir 3 valeurs"}
              {selectedValues.length === 1 && "Encore 2 valeurs à choisir"}
              {selectedValues.length === 2 && "Encore 1 valeur à choisir"}
              {selectedValues.length === 3 && "✅ Parfait ! Tu peux valider"}
            </span>
            <div className="flex space-x-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    selectedValues.length >= i
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid des valeurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {VALUES.map(value => {
            const priority = getPriority(value.id);
            const isSelected = priority !== null;

            return (
              <button
                key={value.id}
                onClick={() => toggleValue(value.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all transform hover:scale-[1.02] text-left ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-500 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {priority}
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div className={`text-5xl ${isSelected ? 'scale-110' : ''} transition-transform`}>
                    {value.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-1 ${
                      isSelected ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {value.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {value.description}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 text-sm text-purple-600 font-semibold">
                    Priorité #{priority}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Ordre sélectionné */}
        {selectedValues.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-purple-200">
            <h3 className="font-bold text-gray-900 mb-4">Ton classement actuel :</h3>
            <div className="space-y-3">
              {selectedValues.map((valueId, index) => {
                const value = VALUES.find(v => v.id === valueId);
                return (
                  <div key={valueId} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="text-3xl">{value.icon}</span>
                    <span className="font-semibold text-gray-900">{value.name}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              💡 Reclique sur une valeur pour la désélectionner et changer l'ordre
            </p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex space-x-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            disabled={isSubmitting}
          >
            ← Retour
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedValues.length !== 3 || isSubmitting}
            className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
              selectedValues.length === 3 && !isSubmitting
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg transform hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Enregistrement...' : 'Valider mes valeurs ✓'}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>⏱️ Durée : 30 secondes</p>
          <p className="mt-1">Ces valeurs serviront à calculer ton Score Yoonu Dal</p>
        </div>

      </div>
    </div>
  );
};

export default SimpleDiagnostic;
