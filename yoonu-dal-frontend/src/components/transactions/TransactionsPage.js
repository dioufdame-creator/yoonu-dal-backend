import React, { useState } from 'react';
import ExpensesPage from '../control/ExpenseTracker';
import IncomesPage from '../incomes/IncomesPage';

// ==========================================
// TRANSACTIONS PAGE V2 - MODERN DESIGN
// Gradient Header + Premium Tabs
// Cohérent avec Dashboard et app palette
// ==========================================

const TransactionsPage = ({ onNavigate, toast }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Premium avec Gradient VERT */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 sm:px-6 py-5 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl">💰</span>
            <span>Transactions</span>
          </h1>
          <p className="text-green-100 text-sm mt-1 sm:mt-2">
            Gérez vos dépenses et revenus en toute simplicité
          </p>
        </div>

        {/* Tabs Modernes avec transitions */}
        <div className="flex border-t border-green-500/30">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all duration-300 relative ${
              activeTab === 'expenses'
                ? 'text-white bg-white/10'
                : 'text-green-100 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">💸</span>
              <span>Dépenses</span>
            </span>
            {activeTab === 'expenses' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full animate-slideIn"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            className={`flex-1 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all duration-300 relative ${
              activeTab === 'incomes'
                ? 'text-white bg-white/10'
                : 'text-green-100 hover:bg-white/5'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">💰</span>
              <span>Revenus</span>
            </span>
            {activeTab === 'incomes' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full animate-slideIn"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content avec transition */}
      <div className="px-4 py-4">
        <div className="animate-fadeIn">
          {activeTab === 'expenses' ? (
            <ExpensesPage onNavigate={onNavigate} toast={toast} />
          ) : (
            <IncomesPage onNavigate={onNavigate} toast={toast} />
          )}
        </div>
      </div>

      {/* Animations CSS inline (si pas dans tailwind.config) */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TransactionsPage;
