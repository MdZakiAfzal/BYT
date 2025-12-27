import api from '../api/axios';

export const jobService = {
  getAllJobs: async () => {
    const response = await api.get('/jobs');
    return response.data; // { status: 'success', data: { jobs: [] } }
  },

  createJob: async (youtubeUrl) => {
    const response = await api.post('/jobs', { youtubeUrl });
    return response.data;
  },

  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  }
};