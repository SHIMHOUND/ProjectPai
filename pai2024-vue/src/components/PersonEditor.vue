<script>

    const personEndpoint = '/api/person'

    export default {
        data() {
            return {
                isValid: false,
                input: {},
                rules: {
                    startsWithLetter: value => {
                        const pattern = /^\p{L}/u
                        return pattern.test(value) || 'Wymagane zaczynanie się od litery'
                    },
                    validDate: value => {
                        const date = new Date(value)
                        return date <= new Date() || `Wymagana data z przeszłości`
                    }
                }
            }
        },
        props: [ 'person' ],
        emits: [ 'close', 'listChanged' ],
        methods: {
           send() {
              fetch(personEndpoint, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(this.input)
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.input = {}
                        this.$emit('close', `${data.firstName} ${data.lastName} - dodano`)
                        this.$emit('listChanged')
                    }
                }).catch(err => {
                    this.$emit('close', 'Dane odrzucone', 'error')
                })
              })
           },
           update() {
              fetch(personEndpoint, {
                method: 'PUT',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(this.input)
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.input = {}
                        this.$emit('close', `${data.firstName} ${data.lastName} - zaktualizowano`)
                        this.$emit('listChanged')
                    }
                }).catch(err => {
                    this.$emit('close', 'Dane odrzucone', 'error')
                })
              })
           },
           remove() {
              fetch(personEndpoint + '?' + new URLSearchParams({ _id: this.input._id }), {
                method: 'DELETE'
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.input = {}
                        this.$emit('close', `${data.firstName} ${data.lastName} - usunięto`)
                        this.$emit('listChanged')
                    }
                }).catch(err => {
                    this.$emit('close', 'Dane odrzucone', 'error')
                })
              })
           },
           setData(data) {
              this.input = {}
              Object.assign(this.input, data)
           },
           clear() {
                this.input = { _id: this.input._id }
                this.isValid = false
           },
           close() {
                this.$emit('close')
           }
        },
        mounted() {
            Object.assign(this.input, this.person)
        }
    }
</script>

<template>
    <v-form v-model="isValid">
        <v-card>
            <v-card-title>{{ input._id ? 'Edytuj dane' : 'Wprowadź dane nowej osoby' }}</v-card-title>
            <v-card-subtitle>
                Dane muszą spełniać odpowiednie reguły, zarówno w tym formularzu, jak i w backendzie.
            </v-card-subtitle>
            <v-card-text>
                <v-text-field variant="outlined" label="Imię" v-model="input.firstName" :rules="[ rules.startsWithLetter ]">
                </v-text-field>
                <v-text-field variant="outlined" label="Nazwisko" v-model="input.lastName" :rules="[ rules.startsWithLetter ]">
                </v-text-field>
                <v-text-field type="date" variant="outlined" label="Data urodzenia" v-model="input.birthDate" :rules="[ rules.validDate ]">
                </v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="elevated" @click="clear">Zeruj</v-btn>
                <v-btn color="primary" variant="elevated" @click="send" :disabled="!isValid" v-if="!input._id">Wyślij</v-btn>
                <v-btn color="secondary" variant="elevated" @click="update" :disabled="!isValid" v-if="input._id">Aktualizuj</v-btn>
                <v-btn color="error" variant="elevated" @click="remove" v-if="input._id">Usuń</v-btn>
                <v-btn variant="elevated" @click="close">Zamknij</v-btn>
            </v-card-actions>
        </v-card>
    </v-form>

</template>

<style scoped>
</style>