import api from './api';

export const budgetService = {
  async getBudgets(month, year) {
    const response = await api.get('/budgets', { params: { month, year } });
    return response.data;
  },

  async createBudget(data) {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  async updateBudget(id, data) {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },

  async deleteBudget(id) {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },

  async getBudgetHealth(month, year) {
    const response = await api.get('/budget-health', { params: { month, year } });
    return response.data;
  }
};

export const analyticsService = {
  async getSummary(month, year) {
    const response = await api.get('/analytics/summary', { params: { month, year } });
    return response.data;
  },

  async getCategories(month, year) {
    const response = await api.get('/analytics/categories', { params: { month, year } });
    return response.data;
  },

  async getMonthlyHistory(count = 6) {
    const response = await api.get('/analytics/monthly', { params: { count } });
    return response.data;
  },

  async getTrends(month, year) {
    const response = await api.get('/analytics/trends', { params: { month, year } });
    return response.data;
  }
};

export const insightService = {
  async getInsights() {
    const response = await api.get('/ai/insights');
    return response.data;
  },

  async generateInsights(month, year) {
    const response = await api.post('/ai/insights/generate', { month, year });
    return response.data;
  }
};

export const reportService = {
  async getReport(year, month) {
    const response = await api.get(`/reports/${year}/${month}`);
    return response.data;
  },

  async generateReport(month, year) {
    const response = await api.post('/reports/generate', { month, year });
    return response.data;
  },

  async downloadPdf(year, month) {
    const response = await api.get(`/reports/${year}/${month}/pdf`, {
      responseType: 'blob',
    });
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SpendIQ_Report_${year}_${String(month).padStart(2, '0')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const profileService = {
  async getProfile() {
    const response = await api.get('/profile');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/profile', data);
    return response.data;
  }
};
