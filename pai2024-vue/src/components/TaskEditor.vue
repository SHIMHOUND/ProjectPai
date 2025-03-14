<script>
const projectEndpoint = '/api/project'

export default {
  props: ['project'],
  data() {
    return {
      tasks: [],
      newTask: {
        name: '',
        startDate: new Date().toISOString().substr(0, 10),
        endDate: '',
        assignedPeople: []
      },
      editedTaskIndex: null,
      dialogVisible: true
    }
  },
  methods: {
    async loadTasks() {
      try {
        const res = await fetch(`${projectEndpoint}/${this.project._id}`)
        const project = await res.json()
        this.tasks = project.tasks || []
      } catch (err) {
        console.error('Błąd ładowania zadań:', err)
      }
    },

    async saveTasks() {
      try {
        const res = await fetch(`${projectEndpoint}/tasks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: this.project._id,
            tasks: this.tasks.map(t => ({
              ...t,
              startDate: new Date(t.startDate).toISOString(),
              endDate: t.endDate ? new Date(t.endDate).toISOString() : null
            }))
          })
        })

        if (!res.ok) throw new Error('Błąd zapisywania zadań')
        this.$emit('tasks-updated')
        this.closeDialog()
      } catch (err) {
        console.error('Błąd:', err)
      }
    },

    editTask(index) {
      this.newTask = { ...this.tasks[index] }
      this.editedTaskIndex = index
    },

    addOrUpdateTask() {
      if (!this.newTask.name) return

      if (this.editedTaskIndex !== null) {
        // Aktualizacja istniejącego zadania
        this.tasks.splice(this.editedTaskIndex, 1, { ...this.newTask })
      } else {
        // Dodawanie nowego zadania
        this.tasks.push({ ...this.newTask })
      }

      this.resetTaskForm()
    },

    resetTaskForm() {
      this.newTask = {
        name: '',
        startDate: new Date().toISOString().substr(0, 10),
        endDate: '',
        assignedPeople: []
      }
      this.editedTaskIndex = null
    },

    removeTask(index) {
      this.tasks.splice(index, 1)
    },

    closeDialog() {
      this.dialogVisible = false
      this.$emit('close')
    }
  },
  mounted() {
    this.loadTasks()
  }
}
</script>

<template>
  <v-dialog v-model="dialogVisible" persistent width="800">
    <v-card>
      <v-card-title class="d-flex align-center">
        Zarządzanie zadaniami
        <v-spacer />
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="8">
            <v-text-field
                v-model="newTask.name"
                label="Nazwa zadania"
                :rules="[v => !!v || 'Wymagane pole']"
            />
          </v-col>
          <v-col cols="4" class="d-flex gap-2">
            <v-btn color="primary" @click="addOrUpdateTask">
              {{ editedTaskIndex !== null ? 'Zapisz zmiany' : 'Dodaj nowe' }}
            </v-btn>
            <v-btn v-if="editedTaskIndex !== null" @click="resetTaskForm">
              Anuluj
            </v-btn>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-text-field
                type="date"
                v-model="newTask.startDate"
                label="Data startu"
                :max="newTask.endDate"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
                type="date"
                v-model="newTask.endDate"
                label="Data końca"
                :min="newTask.startDate"
            />
          </v-col>
        </v-row>

        <v-autocomplete
            v-model="newTask.assignedPeople"
            :items="project.contractors"
            item-title="firstName"
            item-value="id"
            label="Przypisani wykonawcy"
            multiple
            chips
        />

        <v-list>
          <v-list-item
              v-for="(task, index) in tasks"
              :key="index"
              class="mb-2"
          >
            <v-card class="pa-3" width="100%">
              <v-row align="center">
                <v-col cols="4">{{ task.name }}</v-col>
                <v-col cols="3">{{ task.startDate }}</v-col>
                <v-col cols="3">{{ task.endDate || 'Brak' }}</v-col>
                <v-col cols="2" class="d-flex gap-1">
                  <v-btn
                      icon
                      color="info"
                      @click="editTask(index)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                      icon
                      color="error"
                      @click="removeTask(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="success" @click="saveTasks">Zapisz zmiany</v-btn>
        <v-btn @click="closeDialog">Zamknij</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-card-title {
  padding: 16px 24px;
}
.v-list-item {
  padding: 0;
}
.gap-2 {
  gap: 8px;
}
</style>