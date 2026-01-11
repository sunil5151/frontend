import api from './api';

const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
};

export default analyticsAPI;