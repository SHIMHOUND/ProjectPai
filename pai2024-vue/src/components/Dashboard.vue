<script>
import common from '../mixins/common'

    export default {
        props: [ 'user' ],
        emits: [ 'popup' ],
        mixins: [ common ]
    }
</script>

<template>
    <h1>Pulpit</h1>
    <p v-if="user.username">{{ user.username }}</p>
    <i v-if="!user.username">niezalogowany</i>
</template>