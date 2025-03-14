<script>
import common from '../mixins/common'
import ProjectEditor from './ProjectEditor.vue'
import TaskEditor from './TaskEditor.vue' // Импортируем компонент TaskEditor

const projectEndpoint = '/api/project'

export default {
  components: { ProjectEditor, TaskEditor }, // Добавляем TaskEditor в компоненты
  mixins: [common],
  props: ['user'],
  emits: ['popup'],
  data() {
    return {
      projects: {},
      project: {},
      editor: false,
      taskEditor: false, // Добавляем состояние для модального окна задач
      itemsPerPage: 10,
      headers: [
        { title: 'Nazwa', key: 'name', align: 'start', sortable: true },
        { title: 'Data startu', key: 'startDate', align: 'end', sortable: true },
        { title: 'Data końca', key: 'endDate', align: 'end', sortable: true },
        { title: 'Wykonawcy', key: 'contractors', align: 'start', sortable: false },
        { title: 'Akcje', key: 'actions', align: 'end', sortable: false } // Добавляем колонку для действий
      ],
      loading: false,
      search: '',
      itemsLength: 0,
      serverItems: [],
      tableKey: 0
    }
  },
  methods: {
    loadItems({ page, itemsPerPage, sortBy }) {
      this.loading = true
      const skip = (page - 1) * itemsPerPage
      let queryString = { skip, limit: itemsPerPage, search: this.search }
      if (sortBy && sortBy[0]) {
        queryString.sort = sortBy[0].key
        queryString.order = sortBy[0].order
      } else {
        queryString.sort = 'name'
        queryString.order = 'asc'
      }
      fetch(projectEndpoint + '?' +
          new URLSearchParams(queryString).toString())
          .then(res => res.json().then(facet => {
            if (!facet.error) {
              this.itemsLength = +facet.total
              this.serverItems = facet.data
              this.loading = false
            }
          }))
    },
    clickItem(item, event) {
      this.project = event.item
      this.editor = true
    },
    add() {
      this.project = {}
      this.editor = true
    },
    editTasks(project) {
      this.project = { ...project } // Глубокое копирование проекта
      this.taskEditor = true // Открываем модальное окно задач
    },
    editorClose(text, color) {
      this.editor = false
      if (text) {
        this.$emit('popup', text, color)
      }
      this.loadItems({ page: 1, itemsPerPage: 10 }) // Обновляем список проектов
    },
    taskEditorClose(text, color) {
      this.taskEditor = false
      if (text) {
        this.$emit('popup', text, color)
      }
      this.loadItems({ page: 1, itemsPerPage: 10 }) // Обновляем список проектов
    }
  }
}
</script>

<template>
  <v-card variant="outlined" v-if="checkIfInRole(user, [0, 1])">
    <v-card-title class="d-flex">
      Projekty
      <v-spacer></v-spacer>
      <v-btn @click="add" v-if="checkIfInRole(user, [0])">Dodaj</v-btn>
    </v-card-title>
    <v-card-text>
      <v-data-table-server
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="serverItems"
          :items-length="itemsLength"
          :loading="loading"
          :search="search"
          :key="tableKey"
          @update:options="loadItems"
          @click:row="clickItem"
          itemsPerPageText="# elementów na stronie"
          pageText="{0}-{1} z {2}"
      >
        <template #item.contractors="{ item }">
          {{ item.contractors.join(' ') }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
              @click.stop="editTasks(item)"
              color="secondary"
              variant="tonal"
          >
            Zadania
          </v-btn>
        </template>
        <template #footer.prepend>
          <v-text-field
              v-model="search"
              class="mr-5"
              variant="outlined"
              density="compact"
              placeholder="szukaj..."
              hide-details
              prepend-icon="mdi-magnify"
          ></v-text-field>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <!-- Модальное окно для редактирования проекта -->
  <v-dialog v-model="editor" width="50%" v-if="checkIfInRole(user, [0])">
    <ProjectEditor :project="project" @close="editorClose" @list-changed="tableKey++" />
  </v-dialog>

  <!-- Модальное окно для управления задачами -->
  <v-dialog v-model="taskEditor" width="800" v-if="checkIfInRole(user, [0])">
    <TaskEditor
        :project="project"
        @close="taskEditorClose"
        @tasks-updated="taskEditorClose"
    />
  </v-dialog>
</template>

<style scoped>
.v-card-title {
  padding: 16px 24px;
}
</style>