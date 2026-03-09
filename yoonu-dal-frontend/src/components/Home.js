import React, { useState } from 'react';

const Home = ({ onNavigate, toast, auth }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Les 4 étapes Yoonu Dal avec leurs problèmes concrets
  const yoonuSteps = [
    {
      title: "Conscience",
      problem: "Où va mon argent chaque mois ?",
      solution: "Voir clairement vos flux financiers",
      icon: "👁️",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Clarté", 
      problem: "Qu'est-ce qui compte vraiment pour moi ?",
      solution: "Aligner vos dépenses avec vos valeurs",
      icon: "💡",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Choix",
      problem: "Comment mieux gérer mon budget ?", 
      solution: "Les 3 enveloppes : 50% essentiels, 30% plaisirs, 20% projets",
      icon: "🎯",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Contrôle",
      problem: "Comment maintenir ces bonnes habitudes ?",
      solution: "Suivi simple et communauté d'entraide",
      icon: "🚀",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const testimonials = [
    {
      name: "Amsatou D.",
      role: "Enseignante",
      quote: "Fini l'angoisse de fin de mois. Je sais exactement où va mon argent.",
      avatar: "👩🏾‍🏫"
    },
    {
      name: "Diégane F.", 
      role: "Développeur",
      quote: "Les 3 enveloppes ont changé ma relation à l'argent. Simple mais efficace.",
      avatar: "👨🏾‍💻"
    },
    {
      name: "Laeticia K.",
      role: "Entrepreneure",
      quote: "Grâce aux tontines digitales, j'ai pu racheter mon local.",
      avatar: "👩🏾‍💼"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transformez vos{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              silences financiers
            </span>{' '}
            en liberté
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Yoonu Dal vous guide vers une relation apaisée avec l'argent.
            <br />
            Pas de miracles, juste une méthode éprouvée en 4 étapes.
            <br />
            Que vous gagniez beaucoup ou peu, Yoonu Dal commence là où vous êtes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {auth?.isAuthenticated ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Accéder à mon tableau de bord
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Commencer gratuitement
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Se connecter
                </button>
              </>
            )}
          </div>

          {/* Stats rapides */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">73%</div>
              <div className="text-sm text-gray-600">Taux de réussite</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">324</div>
              <div className="text-sm text-gray-600">Entrepreneurs aidés</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">4</div>
              <div className="text-sm text-gray-600">Étapes simples</div>
            </div>
          </div>
        </div>
      </div>

      {/* La méthode Yoonu Dal */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              La méthode Yoonu Dal
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Inspirée du livre "Les silences de nos portefeuilles", 
              une approche progressive pour reprendre le contrôle.
            </p>
          </div>

          {/* Steps Interactive */}
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {yoonuSteps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                    currentStep === index 
                      ? 'bg-gradient-to-br ' + step.color + ' text-white transform scale-105' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className={`text-sm ${currentStep === index ? 'text-white' : 'text-gray-600'}`}>
                    Étape {index + 1}/4
                  </p>
                </div>
              ))}
            </div>

            {/* Step Detail */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {yoonuSteps[currentStep].problem}
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  {yoonuSteps[currentStep].solution}
                </p>
                
                {currentStep === 2 && (
                  <div className="flex justify-center gap-4 mt-6">
                    <div className="bg-blue-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">50%</div>
                      <div className="text-sm text-blue-700">Essentiels</div>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">30%</div>
                      <div className="text-sm text-green-700">Plaisirs</div>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">20%</div>
                      <div className="text-sm text-purple-700">Projets</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Témoignages */}
      <div className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ce que disent ceux qui l'ont essayé
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
                      

          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez les centaines de personnes qui ont transformé 
            leur relation à l'argent avec Yoonu Dal.
          </p>
          
          {!auth?.isAuthenticated && (
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              Commencer maintenant - C'est gratuit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;