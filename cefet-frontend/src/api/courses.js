import api from './axios'

export const getCoursesAPI = (params) => api.get('/courses', { params })
export const getAllCoursesAPI = (params) => api.get('/courses/all', { params })
export const getCourseAPI = (id) => api.get(`/courses/${id}`)
export const getCourseStatsAPI = (id, period) => api.get(`/courses/${id}/stats`, {params: { period }})
export const createCourseAPI = (data) => api.post('/courses', data)
export const updateCourseAPI = (id, data) => api.put(`/courses/${id}`, data)
export const deleteCourseAPI = (id) => api.delete(`/courses/${id}`)
export const enrollAPI = (courseId) => api.post('/enrollments', { courseId })
export const getMyEnrollmentsAPI = () => api.get('/enrollments/my')
export const checkEnrollmentAPI = (courseId) => api.get(`/enrollments/check/${courseId}`)
export const cancelEnrollmentAPI = (courseId) => api.delete(`/enrollments/${courseId}`)

// Aulas
export const getLessonsAPI = (courseId) => api.get(`/courses/${courseId}/lessons`)
export const createLessonAPI = (courseId, data) => api.post(`/courses/${courseId}/lessons`, data)
export const updateLessonAPI = (courseId, lessonId, data) => api.put(`/courses/${courseId}/lessons/${lessonId}`, data)
export const deleteLessonAPI = (courseId, lessonId) => api.delete(`/courses/${courseId}/lessons/${lessonId}`)

// Materiais
export const getMaterialsAPI = (courseId) => api.get(`/courses/${courseId}/materials`)
export const createMaterialAPI = (courseId, data) => api.post(`/courses/${courseId}/materials`, data)
export const updateMaterialAPI = (courseId, materialId, data) => api.put(`/courses/${courseId}/materials/${materialId}`, data)
export const deleteMaterialAPI = (courseId, materialId) => api.delete(`/courses/${courseId}/materials/${materialId}`)

// Alunos do curso
export const getCourseStudentsAPI = (courseId) => api.get(`/courses/${courseId}/students`)

// Notas
export const getCourseGradesAPI = (courseId) => api.get(`/courses/${courseId}/grades`)
export const getMyGradesAPI = (courseId) => api.get(`/courses/${courseId}/grades/my`)
export const createGradeAPI = (courseId, data) => api.post(`/courses/${courseId}/grades`, data)
export const updateGradeAPI = (courseId, gradeId, data) => api.put(`/courses/${courseId}/grades/${gradeId}`, data)
export const deleteGradeAPI = (courseId, gradeId) => api.delete(`/courses/${courseId}/grades/${gradeId}`)

// Fase do curso
export const changeCoursePhaseAPI = (courseId, phase) =>
  api.patch(`/courses/${courseId}/phase`, { phase })

// Permissões de professor no curso
export const addAllowedProfessorAPI = (courseId, professorId) =>
  api.post(`/courses/${courseId}/allowed-professors`, { professorId })
export const removeAllowedProfessorAPI = (courseId, professorId) =>
  api.delete(`/courses/${courseId}/allowed-professors/${professorId}`)
