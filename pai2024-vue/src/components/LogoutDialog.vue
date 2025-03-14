<script>

    const authEndpoint = '/api/auth'

    export default {
        emits: [ 'close' ],
        methods: {
           logout() {
              fetch(authEndpoint, {
                method: 'DELETE'
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.$emit('close', 'Wylogowano')
                    }
                }).catch(err => {
                    this.$emit('close', 'Brak połączenia z backendem', 'error')
                })
              })
           },
           close() {
                this.$emit('close')
           }  
        }
    }
</script>

<template>
    <v-card>
        <v-card-title>Wylogowanie</v-card-title>
        <v-card-text>
            Jesteś pewien?
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="elevated" @click="logout">Wylogowanie</v-btn>
            <v-btn variant="elevated" @click="close">Zamknij</v-btn>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
</style>