const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const {generateMessage, generateLocation} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const port = 3004;
const io = socketio(server);
const Filter = require('bad-words');

const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket) => {
    socket.on('join', ({username, room}, callback) => {
        const {error, user}= addUser({id: socket.id, username, room});
        if( error ) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', `Welcome ${user.username}!`));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            users: getUsersInRoom(user.room),
            room: user.room
        })

        callback()

    })

    socket.on('sendMessage', (msg, cb) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(msg)){
            return cb('Profanity is not allowed')
        }
        io.to(user.room).emit(
            'message',  
            generateMessage(user.username, msg));
        cb()
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit(
                'message',
                generateMessage('Admin', `${user.username} has left`)
            );
            io.to(user.room).emit('roomData', {
                users: getUsersInRoom(user.room),
                room: user.room
            })
        }

    });

    socket.on('sendLocation', ({longitude, latitude}, cb) => {
        const user = getUser(socket.id);

        io.to(user.room).emit(
            'locationMessage', 
            generateLocation(user.username, `https://google.com/maps?q=${latitude},${longitude}`)
        );
        io.to(user.room).emit('roomData', {
            users: getUsersInRoom(user.room),
            room: user.room
        })
        cb();
    });
    
})

server.listen(port, () => {
    console.log(`App running on port ${port}`);
})