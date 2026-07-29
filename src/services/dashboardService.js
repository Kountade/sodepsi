// src/services/dashboardService.js
import AxiosInstance from '../components/AxiosInstance';

const getToken = () => localStorage.getItem('Token');

export const dashboardService = {
  getDashboard: async (period = 'month') => {
    try {
      const token = getToken();
      console.log('Fetching dashboard with period:', period);
      const response = await AxiosInstance.get(`/dashboard/?period=${period}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      console.log('Dashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  getStatistiques: async (period = 'month') => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/statistique/?period=${period}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      throw error;
    }
  },

  getAnalyses: async (period = 'month') => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/analyse/?period=${period}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement analyses:', error);
      throw error;
    }
  }
};