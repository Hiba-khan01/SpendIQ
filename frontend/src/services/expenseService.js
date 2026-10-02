import api from './api';

export const expenseService = {
  async getExpenses(params = {}) {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  async getExpense(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async createExpense(expenseData) {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  async updateExpense(id, expenseData) {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  async deleteExpense(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async parseNaturalLanguage(text) {
    const response = await api.post('/expenses/natural-language', { text });
    return response.data;
  },

  async scanReceipt(formData) {
    const response = await api.post('/expenses/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async categorize(text) {
    const response = await api.post('/expenses/categorize', { text });
    return response.data;
  }
};
