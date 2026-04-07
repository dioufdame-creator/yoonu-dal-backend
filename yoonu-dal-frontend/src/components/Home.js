import React, { useState } from 'react';

const Home = ({ onNavigate, toast, auth }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Les 4 étapes Yoonu Dal avec palette cohérente
  const yoonuSteps = [
    {
      title: "Conscience",
      problem: "Où va mon argent chaque mois ?",
      solution: "Voir clairement vos flux financiers",
      icon: "👁️",
      color: "from-[#14B8A6] to-[#0F766E]" // Teal Yoonu Dal
    },
    {
      title: "Clarté", 
      problem: "Qu'est-ce qui compte vraiment pour moi ?",
      solution: "Aligner vos dépenses avec vos valeurs",
      icon: "💡",
      color: "from-[#84CC16] to-[#65A30D]" // Lime Yoonu Dal
    },
    {
      title: "Choix",
      problem: "Comment mieux gérer mon budget ?", 
      solution: "Les 4 enveloppes : 50% essentiels, 30% plaisirs, 15% projets, 5% libération",
      icon: "🎯",
      color: "from-[#F97316] to-[#C2410C]" // Coral Yoonu Dal
    },
    {
      title: "Contrôle",
      problem: "Comment maintenir ces bonnes habitudes ?",
      solution: "Suivi simple et communauté d'entraide",
      icon: "🚀",
      color: "from-[#FDE047] to-[#CA8A04]" // Yellow Yoonu Dal
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
      quote: "Les 4 enveloppes ont changé ma relation à l'argent. Simple mais efficace.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transformez vos{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#F97316]">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {auth?.isAuthenticated ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Accéder à mon tableau de bord
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-8 py-4 bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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
                      ? 'bg-gradient-to-br ' + step.color + ' text-white transform scale-105 shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className={`text-sm ${currentStep === index ? 'text-white/90' : 'text-gray-600'}`}>
                    Étape {index + 1}/4
                  </p>
                </div>
              ))}
            </div>

            {/* Step Detail */}
            <div className="bg-white border-2 border-gray-200 p-8 rounded-2xl shadow-lg">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {yoonuSteps[currentStep].problem}
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  {yoonuSteps[currentStep].solution}
                </p>
                
                {currentStep === 2 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-teal-50 border-2 border-teal-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#14B8A6]">50%</div>
                      <div className="text-sm text-gray-700 font-medium">Essentiels</div>
                    </div>
                    <div className="bg-lime-50 border-2 border-lime-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#84CC16]">30%</div>
                      <div className="text-sm text-gray-700 font-medium">Plaisirs</div>
                    </div>
                    <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#F97316]">15%</div>
                      <div className="text-sm text-gray-700 font-medium">Projets</div>
                    </div>
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#CA8A04]">5%</div>
                      <div className="text-sm text-gray-700 font-medium">Libération</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Témoignages */}
      <div className="py-16 bg-gradient-to-br from-teal-50 to-lime-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ce que disent ceux qui l'ont essayé
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
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
      <div className="py-16 bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez les personnes qui transforment leur relation à l'argent avec Yoonu Dal.
          </p>
          
          {!auth?.isAuthenticated && (
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-white text-[#14B8A6] rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
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
