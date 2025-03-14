<script>
    import common from '../mixins/common'
    import PersonEditor from './PersonEditor.vue'

    const personEndpoint = '/api/person'

    export default {
        components: { PersonEditor },
        mixins: [ common ],
        props: [ 'user' ],
        emits: [ 'popup' ],
        data() {
            return {
                persons: {},
                person: {},
                editor: false,
                itemsPerPage: 10,
                headers: [
                        { title: 'Imię', key: 'firstName', align: 'start', sortable: true },
                        { title: 'Nazwisko', key: 'lastName', align: 'start', sortable: true },
                        { title: 'Data urodzenia', key: 'birthDate', align: 'end', sortable: true },
                        { title: 'Projektów', key: 'projects', align: 'end', sortable: false }
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
                if(sortBy && sortBy[0]) {
                    queryString.sort = sortBy[0].key
                    queryString.order = sortBy[0].order
                } else {
                    queryString.sort = 'lastName'
                    queryString.order = 'asc'
                }           
                fetch(personEndpoint + '?' + 
                    new URLSearchParams(queryString).toString())
                .then(res => res.json().then(facet => {
                    if(!facet.error) {
                        this.itemsLength = +facet.total
                        this.serverItems = facet.data
                        this.loading = false
                    }
                }))
            },
            clickItem(item, event) {
                this.person = event.item
                this.editor = true
            },
            add() {
                this.person = {}
                this.editor = true
            },
            editorClose(text, color) {
                this.editor = false
                if(text) {
                    this.$emit('popup', text, color)
                }
            }
        }
    }
</script>

<template>
    <v-card variant="outlined" v-if="checkIfInRole(user, [0, 1])">
        <v-card-title class="d-flex">
            Osoby
            <v-spacer></v-spacer>
            <v-btn @click="add" v-if="checkIfInRole(user, [0])">Dodaj</v-btn>
        </v-card-title>
        <v-card-text>
            <v-data-table-server v-model:items-per-page="itemsPerPage" :headers="headers" :items="serverItems"
                :items-length="itemsLength" :loading="loading" :search="search" :key="tableKey"
                @update:options="loadItems" @click:row="clickItem"
                itemsPerPageText="# elementów na stronie" pageText="{0}-{1} z {2}">
                <template #item.birthDate="{ item }">
                    {{ new Date(item.birthDate).toLocaleDateString() }}
                </template>
                <template #footer.prepend>
                    <v-text-field v-model="search" class="mr-5" variant="outlined" density="compact" placeholder="szukaj..."
                        hide-details prepend-icon="mdi-magnify"></v-text-field>                   
                </template>
            </v-data-table-server>
        </v-card-text>
    </v-card>

    <v-dialog v-model="editor" width="50%" v-if="checkIfInRole(user, [0])">
        <PersonEditor :person="person" @close="editorClose" @list-changed="tableKey++"/>
    </v-dialog>
</template>

<style scoped>
</style>