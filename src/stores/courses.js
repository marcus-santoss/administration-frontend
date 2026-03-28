import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useCourseStore = defineStore('courses', () => {
  const courses = ref([])
  const currentCourse = ref(null)
  const loading = ref(false)

  async function fetchCourses() {
    loading.value = true
    try {
      const response = await api.get('/cursos')
      courses.value = response.data
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    try {
      const response = await api.get(`/cursos/${id}`)
      currentCourse.value = response.data
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function createCourse(data) {
    const response = await api.post('/cursos', data)
    courses.value.push(response.data)
    return response.data
  }

  async function updateCourse(id, data) {
    const response = await api.put(`/cursos/${id}`, data)
    const index = courses.value.findIndex(c => c.id === id)
    if (index !== -1) {
      courses.value[index] = response.data
    }
    return response.data
  }

  async function deleteCourse(id) {
    await api.delete(`/cursos/${id}`)
    courses.value = courses.value.filter(c => c.id !== id)
  }

  async function enrollStudent(scheduleId, studentId) {
    const response = await api.post(`/agendamentos/${scheduleId}/matricular`, { student_id: studentId })
    return response.data
  }

  async function getCourseStudents(courseId) {
    const response = await api.get(`/cursos/${courseId}/alunos`)
    return response.data
  }

  return {
    courses,
    currentCourse,
    loading,
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollStudent,
    getCourseStudents
  }
})
