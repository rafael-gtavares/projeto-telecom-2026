import api from './axios'

export const getAllFeedbacksAPI = () => api.get('/feedbacks');
export const getFeaturedFeedbacksAPI = () => api.get('/feedbacks/featured');
export const getCourseFeedbacksAPI = (idCourse) => api.get(`/feedbacks/course/${idCourse}`);

export const createFeedbackAPI = (data) => api.post('/feedbacks', data);
export const toggleFeaturedFeedbackAPI = (id, data) => api.put(`/feedbacks/${id}`, data)
export const deleteFeedbackAPI = (id) => api.delete(`/feedbacks/${id}`)