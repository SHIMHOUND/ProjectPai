import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'

const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi'
    }
})

// Router
import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from './components/Dashboard.vue'
import PersonList from './components/PersonList.vue'
import ProjectList from './components/ProjectList.vue'
import Charts from './components/Charts.vue'
import Chat from './components/Chat.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', component: Dashboard, title: 'Pulpit', icon: 'mdi-home' },
        { path: '/persons', component: PersonList, title: 'Osoby', icon: 'mdi-account-tie-woman', roles: [0, 1] },
        { path: '/projects', component: ProjectList, title: 'Projekty', icon: 'mdi-projector', roles: [0, 1] },
        { path: '/charts', component: Charts, title: 'Wykresy', icon: 'mdi-chart-bar', roles: [0, 1] },
        { path: '/chat', component: Chat, title: 'Czat', icon: 'mdi-chat-outline', roles: [0, 1] }
    ]
})

createApp(App).use(vuetify).use(router).mount('#app')
