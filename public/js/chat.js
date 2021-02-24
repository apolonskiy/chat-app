const socket = io();

//Elements
const messageForm = document.querySelector('#message-form');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('#sendMessageButton');
const sendLocationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    // get new message element
    const newMessage = messages.lastElementChild;

    //get height of new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    //VIsible height
    const visibleHeight = messages.offsetHeight

    //Height of messages container
    const contentHeight = messages.scrollHeight;

    //How far I have scroller
    const scrollOffset = messages.scrollTop + visibleHeight;

    if(contentHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight;
    }

}

socket.on('message', ({text, createdAt, username}) => {

    const html = Mustache.render(messageTemplate, {
        username,
        text,
        createdAt: moment(createdAt).format("dddd H:m a")
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll()
})

socket.on('locationMessage', ({url, createdAt, username}) => {
    const html = Mustache.render(locationTemplate, {
        username,
        url,
        createdAt: moment(createdAt).format("dddd H:m a")
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sideBarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();

    messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    if(message){
        socket.emit('sendMessage', message, (error) => {
            messageFormButton.removeAttribute('disabled');
            messageFormInput.value='';
            messageFormInput.focus();
            if(error){
                return console.log(error);
            }
            console.log('Message delievered!'); 
        });
    } else {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.focus();
    }
})

document.querySelector('#send-location').addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.');
    }

    sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        const {coords: {longitude, latitude}} = position;
        socket.emit('sendLocation', {longitude, latitude}, () => {
            console.log('Location Shared');
            sendLocationButton.removeAttribute('disabled')
        });
    })
})
socket.on('sendMessage', (msg) => {
    console.log(msg);
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error);
        location.href='/'
    }
})