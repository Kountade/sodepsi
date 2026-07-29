// src/components/dashboard/DashboardAPI.js
import AxiosInstance from '../AxiosInstance';

const DashboardAPI = {
  // ============================================================
  // PAGE DASHBOARD - /dashboard
  // ============================================================
  getDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/dashboard/${query ? '?' + query : ''}`);
  },
  
  getDashboardStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/dashboard/stats/${query ? '?' + query : ''}`);
  },
  
  getDashboardKPI: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/dashboard/kpi/${query ? '?' + query : ''}`);
  },
  
  getDashboardActivities: (limit = 20, params = {}) => {
    const query = new URLSearchParams({ limit, ...params }).toString();
    return AxiosInstance.get(`/dashboard/activities/${query ? '?' + query : ''}`);
  },
  
  getDashboardSalesChart: (type = 'daily', params = {}) => {
    const query = new URLSearchParams({ type, ...params }).toString();
    return AxiosInstance.get(`/dashboard/sales-chart/${query ? '?' + query : ''}`);
  },
  
  getDashboardPieChart: (type = 'sales_by_category', params = {}) => {
    const query = new URLSearchParams({ type, ...params }).toString();
    return AxiosInstance.get(`/dashboard/pie-chart/${query ? '?' + query : ''}`);
  },

  // ============================================================
  // PAGE STATISTIQUES - /statistiques
  // ============================================================
  getStatistiques: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/statistiques/${query ? '?' + query : ''}`);
  },
  
  getStatistiquesStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/statistiques/stats/${query ? '?' + query : ''}`);
  },
  
  getStatistiquesSalesChart: (type = 'daily', params = {}) => {
    const query = new URLSearchParams({ type, ...params }).toString();
    return AxiosInstance.get(`/statistiques/sales-chart/${query ? '?' + query : ''}`);
  },
  
  getStatistiquesPieChart: (type = 'sales_by_category', params = {}) => {
    const query = new URLSearchParams({ type, ...params }).toString();
    return AxiosInstance.get(`/statistiques/pie-chart/${query ? '?' + query : ''}`);
  },
  
  getStatistiquesKPI: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/statistiques/kpi/${query ? '?' + query : ''}`);
  },

  // ============================================================
  // PAGE ANALYSES - /analyses
  // ============================================================
  getAnalyses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/analyses/${query ? '?' + query : ''}`);
  },
  
  getAnalysesComparison: (metric = 'sales', compareWith = 'previous', params = {}) => {
    const query = new URLSearchParams({ metric, compare_with: compareWith, ...params }).toString();
    return AxiosInstance.get(`/analyses/comparison/${query ? '?' + query : ''}`);
  },
  
  getAnalysesTrends: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/analyses/trends/${query ? '?' + query : ''}`);
  },
  
  getAnalysesProduct: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/analyses/product-analysis/${query ? '?' + query : ''}`);
  },
  
  getAnalysesClient: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/analyses/client-analysis/${query ? '?' + query : ''}`);
  },
  
  getAnalysesFinancial: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return AxiosInstance.get(`/analyses/financial-analysis/${query ? '?' + query : ''}`);
  },
};

export default DashboardAPI;