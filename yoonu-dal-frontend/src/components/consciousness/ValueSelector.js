import React, { useState, useEffect } from 'react';

const ValueSelector = ({ onNavigate }) => {
  const [selectedValues, setSelectedValues] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const coreValues = [
    // Valeurs personnelles
    { id: 1, name: 'Famille', icon: '👨‍👩‍👧‍👦', category: 'Personnel', description: 'Priorité aux liens familiaux et au bien-être des proches', color: 'bg-red-500' },
    { id: 2, name: 'Santé', icon: '🏥', category: 'Personnel', description: 'Investir dans la santé physique et mentale', color: 'bg-green-500' },
    { id: 3, name: 'Éducation', icon: '📚', category: 'Personnel', description: 'Formation continue et développement personnel', color: 'bg-blue-500' },
    { id: 4, name: 'Spiritualité', icon: '🙏', category: 'Personnel', description: 'Développement spirituel et connexion intérieure', color: 'bg-purple-500' },
    { id: 5, name: 'Aventure', icon: '🌍', category: 'Personnel', description: 'Exploration, voyages et nouvelles expériences', color: 'bg-orange-500' },
    { id: 6, name: 'Créativité', icon: '🎨', category: 'Personnel', description: 'Expression artistique et innovation', color: 'bg-pink-500' },
    
    // Valeurs sociales
    { id: 7, name: 'Communauté', icon: '🤝', category: 'Social', description: 'Contribution au bien-être de la communauté', color: 'bg-teal-500' },
    { id: 8, name: 'Justice', icon: '⚖️', category: 'Social', description: 'Équité et défense des droits', color: 'bg-indigo-500' },
    { id: 9, name: 'Solidarité', icon: '🤲', category: 'Social', description: 'Entraide et soutien mutuel', color: 'bg-cyan-500' },
    { id: 10, name: 'Tradition', icon: '🏛️', category: 'Social', description: 'Respect et préservation des traditions', color: 'bg-amber-500' },
    { id: 11, name: 'Leadership', icon: '👑', category: 'Social', description: 'Influence positive et guidage des autres', color: 'bg-yellow-500' },
    
    // Valeurs financières
    { id: 12, name: 'Sécurité', icon: '🛡️', category: 'Financier', description: 'Stabilité financière et protection contre les risques', color: 'bg-gray-600' },
    { id: 13, name: 'Croissance', icon: '📈', category: 'Financier', description: 'Augmentation du patrimoine et des investissements', color: 'bg-emerald-500' },
    { id: 14, name: 'Indépendance', icon: '🗽', category: 'Financier', description: 'Liberté financière et autonomie', color: 'bg-blue-600' },
    { id: 15, name: 'Générosité', icon: '💝', category: 'Financier', description: 'Partage et aide financière aux autres', color: 'bg-rose-500' },
    { id: 16, name: 'Épargne', icon: '🏦', category: 'Financier', description: 'Constitution de réserves pour l\'avenir', color: 'bg-green-600' },
    { id: 17, name: 'Impact', icon: '🌱', category: 'Financier', description: 'Investissements responsables et durables', color: 'bg-lime-500' },
    
    // Valeurs professionnelles
    { id: 18, name: 'Réussite', icon: '🏆', category: 'Professionnel', description: 'Accomplissement et reconnaissance professionnelle', color: 'bg-yellow-600' },
    { id: 19, name: 'Innovation', icon: '💡', category: 'Professionnel', description: 'Créativité et solutions nouvelles', color: 'bg-blue-400' },
    { id: 20, name: 'Équilibre', icon: '⚖️', category: 'Professionnel', description: 'Harmony entre vie professionnelle et personnelle', color: 'bg-violet-500' },
    { id: 21, name: 'Excellence', icon: '⭐', category: 'Professionnel', description: 'Qualité et perfectionnement constant', color: 'bg-orange-600' }
  ];

  const categories = ['Tous', 'Personnel', 'Social', 'Financier', 'Professionnel'];
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const filteredValues = coreValues.filter(value => {
    const matchesCategory = selectedCategory === 'Tous' || value.category === selectedCategory;
    const matchesSearch = value.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         value.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleValue = (valueId) => {
    setSelectedValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(id => id !== valueId);
      } else if (prev.length < 7) {
        return [...prev, valueId];
      }
      return prev;
    });
  };

  const getValuePriority = (valueId) => {
    const index = selectedValues.indexOf(valueId);
    return index >= 0 ? index + 1 : null;
  };

  const generateRecommendations = () => {
    const selectedValueObjects = coreValues.filter(v => selectedValues.includes(v.id));
    const categories = selectedValueObjects.reduce((acc, value) => {
      acc[value.category] = (acc[value.category] || 0) + 1;
      return acc;
    }, {});

    const recommendations = [];

    // Recommandations basées sur les catégories dominantes
    if (categories['Financier'] >= 2) {
      recommendations.push({
        title: 'Optimisez vos investissements',
        description: 'Vos valeurs financières sont importantes. Explorez les tontines pour faire croître votre épargne.',
        action: 'Simuler une tontine',
        icon: '🏦',
        color: 'bg-green-500',
        page: 'tontine-simulator'
      });
    }

    if (categories['Personnel'] >= 3) {
      recommendations.push({
        title: 'Budget personnel équilibré',
        description: 'Créez un budget qui reflète vos priorités personnelles et familiales.',
        action: 'Créer mon budget',
        icon: '👨‍👩‍👧‍👦',
        color: 'bg-blue-500',
        page: 'expenses'
      });
    }

    if (categories['Social'] >= 2) {
      recommendations.push({
        title: 'Épargne collaborative',
        description: 'Rejoignez des tontines communautaires pour allier épargne et solidarité.',
        action: 'Voir les tontines',
        icon: '🤝',
        color: 'bg-purple-500',
        page: 'tontines'
      });
    }

    // Recommandations par valeurs spécifiques
    if (selectedValues.includes(12)) { // Sécurité
      recommendations.push({
        title: 'Fonds d\'urgence prioritaire',
        description: 'La sécurité est votre priorité. Constituez un fonds d\'urgence solide.',
        action: 'Calculer mon fonds',
        icon: '🛡️',
        color: 'bg-gray-600',
        page: 'dashboard'
      });
    }

    if (selectedValues.includes(1)) { // Famille
      recommendations.push({
        title: 'Plan d\'épargne familial',
        description: 'Organisez l\'épargne familiale avec des objectifs clairs pour chaque membre.',
        action: 'Planifier l\'épargne',
        icon: '👨‍👩‍👧‍👦',
        color: 'bg-red-500',
        page: 'dashboard'
      });
    }

    if (selectedValues.includes(17)) { // Impact
      recommendations.push({
        title: 'Investissements responsables',
        description: 'Explorez des options d\'épargne qui ont un impact positif sur la société.',
        action: 'Découvrir les options',
        icon: '🌱',
        color: 'bg-green-500',
        page: 'tontines'
      });
    }

    return recommendations.slice(0, 4); // Limite à 4 recommandations
  };

  if (showResults) {
    const selectedValueObjects = coreValues.filter(v => selectedValues.includes(v.id));
    const recommendations = generateRecommendations();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Profil de Valeurs Créé !
            </h1>
            <p className="text-xl text-gray-600">
              Vos valeurs guideront maintenant vos décisions financières
            </p>
          </div>

          {/* Valeurs sélectionnées */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">💎</span>
              Vos valeurs prioritaires
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedValueObjects.map((value, index) => {
                const priority = getValuePriority(value.id);
                return (
                  <div 
                    key={value.id}
                    className="relative group animate-slide-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`${value.color} rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">{value.icon}</span>
                        <span className="bg-white bg-opacity-20 text-white text-sm font-bold px-3 py-1 rounded-full">
                          #{priority}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{value.name}</h3>
                      <p className="text-sm opacity-90">{value.description}</p>
                      <span className="inline-block mt-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        {value.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommandations */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🎯</span>
              Recommandations basées sur vos valeurs
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="group cursor-pointer animate-slide-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                  onClick={() => onNavigate && onNavigate(rec.page)}
                >
                  <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`${rec.color} text-white p-3 rounded-full text-xl`}>
                        {rec.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{rec.description}</p>
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                      {rec.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform"
              >
                📊 Voir mon tableau de bord
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('tontine-simulator')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform"
              >
                🧮 Simuler une épargne
              </button>
            </div>
            <button 
              onClick={() => {
                setShowResults(false);
                setCurrentStep(1);
                setSelectedValues([]);
              }}
              className="text-gray-600 hover:text-purple-600 font-semibold transition-colors duration-200"
            >
              🔄 Modifier mes valeurs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💎 Sélection de Valeurs
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Choisissez 3 à 7 valeurs qui guident vos décisions financières
          </p>
          
          {/* Compteur de sélection */}
          <div className="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg">
            <span className="text-gray-600">Sélectionnées:</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-purple-600">{selectedValues.length}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">7</span>
            </div>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${(selectedValues.length / 7) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-8 animate-scale-in">
          {/* Catégories */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Barre de recherche */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une valeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Grille de valeurs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredValues.map((value, index) => {
            const isSelected = selectedValues.includes(value.id);
            const priority = getValuePriority(value.id);
            const canSelect = selectedValues.length < 7 || isSelected;

            return (
              <div 
                key={value.id}
                className={`relative group cursor-pointer animate-slide-in ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => canSelect && toggleValue(value.id)}
              >
                <div className={`relative bg-white rounded-2xl p-6 shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border-2 ${
                  isSelected 
                    ? `${value.color.replace('bg-', 'border-')} scale-105` 
                    : 'border-gray-200 hover:border-purple-300'
                }`}>
                  
                  {/* Badge de priorité */}
                  {isSelected && (
                    <div className={`absolute -top-2 -right-2 ${value.color} text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
                      {priority}
                    </div>
                  )}

                  {/* Icon avec animation */}
                  <div className={`text-5xl mb-4 transform transition-all duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {value.icon}
                  </div>

                  {/* Contenu */}
                  <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                    isSelected ? 'text-white' : 'text-gray-900 group-hover:text-purple-600'
                  }`}>
                    {value.name}
                  </h3>
                  
                  <p className={`text-sm leading-relaxed mb-4 transition-colors duration-300 ${
                    isSelected ? 'text-white opacity-90' : 'text-gray-600'
                  }`}>
                    {value.description}
                  </p>

                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    isSelected 
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700'
                  }`}>
                    {value.category}
                  </span>

                  {/* Effet de sélection */}
                  {isSelected && (
                    <div className={`absolute inset-0 ${value.color} rounded-2xl -z-10`}></div>
                  )}

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-white text-green-500 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="text-center space-y-4 animate-fade-in">
          {selectedValues.length >= 3 ? (
            <button 
              onClick={() => setShowResults(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform"
            >
              ✨ Voir mes recommandations
            </button>
          ) : (
            <p className="text-gray-600 text-lg">
              Sélectionnez au moins 3 valeurs pour continuer
            </p>
          )}
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="text-gray-600 hover:text-purple-600 font-semibold transition-colors duration-200"
            >
              ← Retour au tableau de bord
            </button>
            <button 
              onClick={() => setSelectedValues([])}
              className="text-gray-600 hover:text-red-600 font-semibold transition-colors duration-200"
            >
              🔄 Tout effacer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValueSelector;