// src/services/TriangleService.js
import { useState, useEffect, useCallback } from 'react';
import API from './api';

export const triangleService = {
  // Récupérer les données du triangle de base
  getTriangleData: async (year = null, month = null) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      
      const response = await API.get(`/triangle/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du triangle:', error);
      throw error;
    }
  },

  // Récupérer les données enrichies du triangle
  getTriangleDataEnriched: async (year = null, month = null) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      
      // Utilise l'endpoint de test pour l'instant (sans authentification)
      const response = await API.get(`/triangle-enriched-test/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données enrichies:', error);
      // Fallback vers l'endpoint de base
      return await triangleService.getTriangleData(year, month);
    }
  },

  // Calculer les tendances du triangle (comparaison sur plusieurs mois)
  getTriangleTrends: async (months = 6) => {
    try {
      const currentDate = new Date();
      const promises = [];
      
      for (let i = 0; i < months; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        promises.push(
          triangleService.getTriangleData(date.getFullYear(), date.getMonth() + 1)
            .then(data => ({
              ...data,
              month: date.getMonth() + 1,
              year: date.getFullYear(),
              date: date.toISOString().slice(0, 7) // YYYY-MM format
            }))
            .catch(() => null) // Ignorer les erreurs pour les mois sans données
        );
      }
      
      const results = await Promise.all(promises);
      return results.filter(result => result !== null).reverse(); // Plus ancien en premier
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      throw error;
    }
  },

  // Simuler des projections d'amélioration
  getTriangleProjections: async (improvements = {}) => {
    try {
      const currentData = await triangleService.getTriangleData();
      
      // Calculs de projections basés sur les améliorations proposées
      const projectedData = {
        ...currentData,
        income_score: Math.min(100, currentData.income_score + (improvements.income_improvement || 0)),
        expense_score: Math.min(100, currentData.expense_score + (improvements.expense_improvement || 0)),
        value_score: Math.min(100, currentData.value_score + (improvements.value_improvement || 0))
      };
      
      // Recalculer l'équilibre global
      projectedData.triangle_balance = (
        projectedData.income_score + 
        projectedData.expense_score + 
        projectedData.value_score
      ) / 3;
      
      return {
        current: currentData,
        projected: projectedData,
        improvement: {
          income: projectedData.income_score - currentData.income_score,
          expense: projectedData.expense_score - currentData.expense_score,
          value: projectedData.value_score - currentData.value_score,
          balance: projectedData.triangle_balance - currentData.triangle_balance
        }
      };
    } catch (error) {
      console.error('Erreur lors du calcul des projections:', error);
      throw error;
    }
  },

  // Obtenir des recommandations personnalisées
  getPersonalizedRecommendations: async () => {
    try {
      // Essaie d'abord l'endpoint enrichi
      const enrichedData = await triangleService.getTriangleDataEnriched();
      
      return {
        triangle_data: enrichedData,
        recommendations: enrichedData.recommendations || []
      };
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations enrichies, fallback vers le mode basique:', error);
      
      // Fallback vers les calculs côté frontend
      try {
        const triangleData = await triangleService.getTriangleData();
        const recommendations = [];
        
        // Recommandations basées sur les scores
        if (triangleData.income_score < 60) {
          recommendations.push({
            type: 'income',
            priority: 'high',
            title: 'Diversifier vos sources de revenus',
            description: 'Votre score de revenus est faible. Considérez développer des revenus complémentaires.',
            actions: [
              'Identifier vos compétences monnayables',
              'Explorer les opportunités de freelance',
              'Envisager des investissements générant des revenus passifs'
            ]
          });
        }
        
        if (triangleData.expense_score < 60) {
          recommendations.push({
            type: 'expense',
            priority: 'high',
            title: 'Optimiser vos dépenses',
            description: 'Vos dépenses ne sont pas optimalement alignées avec votre budget.',
            actions: [
              'Revoir votre budget mensuel',
              'Identifier les dépenses non essentielles',
              'Automatiser votre épargne'
            ]
          });
        }
        
        if (triangleData.value_score < 60) {
          recommendations.push({
            type: 'value',
            priority: 'medium',
            title: 'Aligner vos finances avec vos valeurs',
            description: 'Il y a un décalage entre vos valeurs déclarées et vos habitudes financières.',
            actions: [
              'Clarifier vos valeurs prioritaires',
              'Analyser vos dépenses par rapport à vos valeurs',
              'Ajuster vos habitudes de consommation'
            ]
          });
        }
        
        return {
          triangle_data: triangleData,
          recommendations: recommendations
        };
      } catch (fallbackError) {
        console.error('Erreur lors du fallback:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Calculer le score de santé financière global
  calculateFinancialHealth: async () => {
    try {
      const triangleData = await triangleService.getTriangleData();
      const dashboardResponse = await API.get('/dashboard/');
      const dashboardData = dashboardResponse.data;
      
      // Calcul du score de santé basé sur plusieurs facteurs
      const scores = {
        triangle_balance: triangleData.triangle_balance || 0,
        savings_rate: dashboardData.financial_summary?.spending_percentage ? 
          Math.max(0, 100 - dashboardData.financial_summary.spending_percentage) : 0,
        income_stability: triangleData.income_score || 0,
        expense_control: triangleData.expense_score || 0,
        value_alignment: triangleData.value_score || 0
      };
      
      // Pondération des différents scores
      const weights = {
        triangle_balance: 0.3,
        savings_rate: 0.25,
        income_stability: 0.2,
        expense_control: 0.15,
        value_alignment: 0.1
      };
      
      const healthScore = Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * weights[key]);
      }, 0);
      
      return {
        overall_score: Math.round(healthScore),
        detailed_scores: scores,
        interpretation: healthScore >= 80 ? 'Excellente santé financière' :
                       healthScore >= 65 ? 'Bonne santé financière' :
                       healthScore >= 50 ? 'Santé financière correcte' :
                       'Santé financière à améliorer',
        next_review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Dans 30 jours
      };
    } catch (error) {
      console.error('Erreur lors du calcul de la santé financière:', error);
      throw error;
    }
  }
};

// Hook React personnalisé pour utiliser le triangle
export const useTriangle = (autoRefresh = false, refreshInterval = 30000) => {
  const [triangleData, setTriangleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTriangleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await triangleService.getTriangleData();
      setTriangleData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnrichedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await triangleService.getTriangleDataEnriched();
      setTriangleData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données enrichies');
      // Fallback vers les données de base
      try {
        const basicData = await triangleService.getTriangleData();
        setTriangleData(basicData);
      } catch (fallbackError) {
        setError(fallbackError.message || 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrichedData();
  }, [fetchEnrichedData]);

  useEffect(() => {
    if (autoRefresh && refreshInterval) {
      const interval = setInterval(fetchEnrichedData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchEnrichedData]);

  const refresh = useCallback(() => {
    fetchEnrichedData();
  }, [fetchEnrichedData]);

  return {
    triangleData,
    loading,
    error,
    lastUpdated,
    refresh,
    fetchBasicData: fetchTriangleData,
    fetchEnrichedData
  };
};

// Hook pour les recommandations
export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await triangleService.getPersonalizedRecommendations();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des recommandations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchRecommendations
  };
};

export default triangleService;