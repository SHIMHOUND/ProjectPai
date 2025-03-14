<script>
export default {
  props: [ 'user' ],
  data() {
    return {
      websocket: null,
      recipient: '',
      message: '',
      posts: [],
      users: []
    }
  },
  methods: {
    send() {
      const data = { from: this.user.username, to: this.recipient, message: this.message }
      if(data.to !== this.user.username) {  // Use !== instead of !=
        this.websocket.send(JSON.stringify(data))
      }
      this.posts.push({ time: Date.now(), ...data })
      this.message = ''
    },
    loadUsers() {
      fetch('/api/control/who').then(res => res.json().then(users => {
        this.users = Object.keys(users).map(key => (
            { username: key, status: users[key].websocket ? 2 : (users[key].sessions > 0 ? 1 : 0 ) }
        ))}))
    }
  },
  mounted() {
    this.websocket = new WebSocket('ws://' + window.location.host + '/ws')
    this.websocket.onopen = () => {
      console.log('Websocket połączony')
    }
    this.websocket.onmessage = event => {
      let data = {}
      try {
        data = JSON.parse(event.data)
      } catch(err) {
        console.error('Oczekiwano JSONa, a jest', event.data)
        return
      }
      this.posts.push({ time: Date.now(), ...data })
    }
  }
}
</script>

<template>
  <v-card variant="text">
    <v-card-title>Chat</v-card-title>
    <v-card-text>
      <v-list>
        <v-list-item v-for="post in posts" variant="elevated" rounded="pill"
                     :class="post.from === user.username ? 'right-msg' : 'left-msg'">  <!-- Use === instead of == -->
          <v-list-item-title>{{ post.message }}</v-list-item-title>
          <v-list-item-subtitle>{{ new Date(post.time).toLocaleTimeString() }} @{{ post.from }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-form style="width: 100%;">
        <v-row>
          <v-col cols="4">
            <v-select variant="solo" v-model="recipient" label="Odbiorca"
                      :items="users" item-title="username" item-value="username" @update:menu="loadUsers">
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :style="{ color: ['gray', 'orange', 'green'][item.raw.status] }">
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col>
            <v-text-field variant="solo" label="Wiadomość" v-model="message">
              <template #append-inner>
                <v-btn variant="elevated" color="success" @click="send" type="submit" :disabled="!recipient || !message">Wyślij</v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-form>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.left-msg { color: black; text-align: left; }
.right-msg { color: green; text-align: right; }
</style>