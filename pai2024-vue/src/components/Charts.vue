<script>
import common from '../mixins/common'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

export default {
  mixins: [common],
  props: ['session'],
  data() {
    return {
      projects: [], // Список всех проектов
      selectedProject: null, // Выбранный проект
      tasks: [], // Задачи выбранного проекта
      websocket: null,
      projectsGanttData: { data: [] }, // Данные для Ганта проектов
      tasksGanttData: { data: [] }, // Данные для Ганта задач
    }
  },
  computed: {
    selectedProjectName() {
      const project = this.projects.find(p => p._id === this.selectedProject)
      return project ? project.name : ''
    }
  },
  watch: {
    selectedProject(newVal) {
      if (newVal) {
        this.loadTasks(newVal) // Загрузить задачи при выборе проекта
      } else {
        this.updateTasksGantt([]) // Очистить задачи, если проект не выбран
      }
    }
  },
  mounted() {
    if (!this.checkIfInRole(this.session, [0])) {
      this.$router.push('/')
    }

    this.loadProjects() // Загрузить проекты при монтировании компонента
    this.initGantt()

    // Инициализация WebSocket для автоматического обновления
    this.websocket = new WebSocket('ws://' + window.location.host + '/ws')
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'TASKS_UPDATED' || data.type === 'PROJECT_UPDATED') {
        this.loadProjects() // Перезагрузить проекты при изменении
        if (this.selectedProject) this.loadTasks(this.selectedProject)
      }
    }
  },
  beforeUnmount() {
    if (this.websocket) {
      this.websocket.close()
    }
  },
  methods: {
    initGantt() {
      gantt.config.date_format = '%Y-%m-%d'
      gantt.config.scale_unit = 'day'
      gantt.config.subscales = [
        { unit: 'week', step: 1, date: '%W' }
      ]
      gantt.init(this.$refs.gantt)
    },
    async loadProjects() {
      try {
        const res = await fetch('/api/project') // Загрузить проекты из базы данных
        const data = await res.json()
        this.projects = data.data.map(p => ({
          ...p,
          id: p._id, // Используем _id как идентификатор
          startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : null,
          endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : null,
          progress: p.endDate ? 1 : 0.5,
          color: !p.endDate ? '#FF9999' : '' // Подсветка активных проектов
        }))
        this.updateProjectsGantt(this.projects)
      } catch (err) {
        console.error('Error loading projects:', err)
      }
    },
    async loadTasks(projectId) {
      try {
        const res = await fetch(`/api/analysis/projects/${projectId}/tasks`)
        const tasks = await res.json()
        this.tasks = tasks.map(t => ({
          ...t,
          id: t._id,
          startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : null,
          endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : null,
          progress: t.endDate ? 1 : 0.5,
          color: !t.endDate ? '#FFCC99' : '' // Подсветка активных задач
        }))
        this.updateTasksGantt(this.tasks)
      } catch (err) {
        console.error('Error loading tasks:', err)
      }
    },
    updateProjectsGantt(projects) {
      const ganttData = projects.map(p => ({
        id: p._id,
        text: p.name,
        start_date: p.startDate,
        end_date: p.endDate,
        progress: p.progress,
        color: p.color,
        type: 'project'
      }))
      gantt.clearAll()
      gantt.parse({ data: ganttData })
    },
    updateTasksGantt(tasks) {
      const ganttData = tasks.map(t => ({
        id: t._id,
        text: t.name,
        start_date: t.startDate,
        end_date: t.endDate,
        progress: t.progress,
        color: t.color,
        parent: this.selectedProject,
        type: 'task'
      }))
      gantt.clearAll()
      gantt.parse({ data: ganttData })
    }
  }
}
</script>

<template>
  <div>
    <h1>Analysis</h1>
    <v-select
        v-model="selectedProject"
        :items="projects"
        item-title="name"
        item-value="_id"
        label="Wybierz projekt"
        :loading="!projects.length"
    />
    <div ref="gantt" class="gantt-container"></div>
  </div>
</template>

<style scoped>
.gantt-container {
  width: 100%;
  height: 500px;
}
</style>