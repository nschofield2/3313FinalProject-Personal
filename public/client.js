const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const rooms = document.getElementById('roomList')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

//Makes sure we are in a room
if (messageForm != null) {
  const name = prompt('What is your name?') //prompting user for name
  appendMessage('You joined') //adding message to chat history
  socket.emit('new-user', roomName, name)

  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', roomName, message) //keeps messages private to each room
    messageInput.value = ''
  })
}

//Handling the room generation
socket.on('roomGenerated', room => {
  const roomElement = document.createElement('div') //name of room
  roomElement.innerText = room  //text of the div
  const roomLink = document.createElement('a') //creating a link to join the room
  roomLink.href = `/${room}`  //link takes user to the name of the page with the room
  roomLink.innerText = 'Join' //Text of link
  rooms.append(roomElement) //adding name of room to main page
  rooms.append(roomLink)  //adding link to join the room to main page
})

//Sends a message to all others in the room saying that a new person has joined the room, and who that person is
socket.on('userJoin', name => {
  appendMessage(`${name} has joined the room`)
})

//Sends the message and sender to all others in chat room
socket.on('messageContent', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

//Sends a message to all others in the room saying that someone has left (and who that person is)
socket.on('userLeave', name => {
  appendMessage(`${name} has left the room`)
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}