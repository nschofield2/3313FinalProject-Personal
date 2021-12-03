//Requiring express
const express = require('express')
const app = express()

const readline=require("readline");
const rl=readline.createInterface({
    input:process.stdin,
    output: process.stdout
});

rl.question("Enter anything you want to stop the server ",name=>{
    console.log("input received");
   	shutDown();
    rl.close();
});


//Setting up express server
app.set('views', './views') //Views come from view folder
app.set('view engine', 'ejs') //View engine will use ejs
app.use(express.static('public')) //Javascript goes in Public folder (client side code)
app.use(express.urlencoded({ extended: true })) //allows URL encoded parameter

//Creating server that can communicate with socket.io
const server = app.listen(3000)
const io = require('socket.io')(server)

let connections = [];

server.on('connection', connection => {
  connections.push(connection);
  connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
  });

  setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
  }, 10000);

  connections.forEach(curr => curr.end());
  setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}

const rooms = { } //rooms will initially be empty when first client is created

//Main page that will show all the different rooms
app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/createRoom', (req, res) => {
  //Ensures that a room with the name name has not already been created
  if (rooms[req.body.room] != null) {
    return res.redirect('/')  //if room exists, do not allow creation of new room
  }
  rooms[req.body.room] = { users: {} } //adding room the rooms array
  res.redirect(req.body.room) //redirect user to that new room
  io.emit('roomGenerated', req.body.room) //send message to the socket so that new room was created
})

//Room names will be passed to this get request
app.get('/:room', (req, res) => {
  //Redirects to home page if user tries to type in an unknown room in search bar
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room }) //render a room page with the room name
})

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    socket.join(room) //adding user to certain room
    rooms[room].users[socket.id] = name //add user to list of room's users
    socket.to(room).emit('userJoin', name)
  })
  //Send message to everyone in a specific room
  socket.on('send-chat-message', (room, message) => {
    socket.to(room).emit('messageContent', { message: message, name: rooms[room].users[socket.id] })
  })
  socket.on('disconnect', () => {
    app.post('/leaveRoom', (req,res) => {
      res.redirect('/')
    })
    //Loop over every room
    getRoomOfUser(socket).forEach(room => {
      socket.to(room).emit('userLeave', rooms[room].users[socket.id]) 
      delete rooms[room].users[socket.id] //delete user from the list of room's users
    })
  })
})

//Function to get all of the rooms that a user is currently in (which should only be one)
function getRoomOfUser(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) {
      names.push(name)  //push the name of the room into the array
    }
    return names  //return the array
  }, [])
}