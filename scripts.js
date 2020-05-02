let client = prompt('Whats your name?')
let blob = null
$('h3 > span').html(client)
let calls = []
let socket = null
let peer = null


document.getElementById('play-recording').disabled = true
document.getElementById('stop-recording').disabled = true
document.getElementById('send-room').disabled = true
document.getElementById('broadcast').disabled = true
document.getElementById('stop-broadcast').disabled = true
document.getElementById('add-room').disabled = true


function connectToServer() {
    let address = prompt('Enter server address:')
    let port = prompt('Enter port:')
    let protocol = port === '443' ? 'https' : 'http'
    const server = `${protocol}://${address}:${port}`
    socket = io(server)
    document.getElementById('add-room').disabled = false
    $('h5 > span').html(server)
    peer = new Peer()

    peer.on('open', (id) => {
        console.log('My peer id is: ' + id)
        peer.on('call', call => {
            call.on('stream', stream => {
                let player = document.getElementById('speaker')
                if ("srcObject" in player) {
                    player.srcObject = stream;
                } else {
                    player.src = window.URL.createObjURL(stream);
                }
            })
            call.answer(null)
        })
    })

    socket.on('loadRooms', rooms => {
        $('#rooms').html('')
        Object.keys(rooms).forEach(room => {
            drawRoom(room, Object.keys(rooms[room]).length)
        })
    })

    socket.on('newRoom', room => {
        drawRoom(room, 0)
    })

    socket.on('updateRoomSize', room => {
        $(`#${room.name}-size`).html(room.size)
    })

    socket.on('audio', incoming => {
        let incoming_blob = new Blob([incoming.audio], { 'type': 'audio/ogg; codecs=opus' });
        var audioURL = URL.createObjectURL(incoming_blob);
        var audio = document.createElement('audio');
        audio.controls = true;
        audio.src = audioURL;
        let new_audio_div = document.createElement('div')
        $(new_audio_div).addClass('incoming-audio')
        const txt = document.createTextNode(`• ${(new Date()).toLocaleString()} | ${incoming.from}`)
        $(new_audio_div).append(txt)
        new_audio_div.onclick = () => audio.play()
        $('#incoming-audios').append(new_audio_div)
    })
}

function drawRoom(roomName, size) {
    $('#rooms').append(
        `
            <div id="${roomName}" onclick="joinRoom(this)" class="room">
                <span id="${roomName}-join-leave">Join</span> ${roomName}
                <div>
                    Users: <span id="${roomName}-size">${size}</span>
                </div>
            </div>
        `
    )
}

function createRoom(room) {
    roomName = room || prompt("What is the room name?")
    if (roomName) {
        socket.emit('createRoom', roomName)
    }
}

function leaveRoom(room) {
    if (room) {
        socket.emit('leaveRoom', room, () => {
            document.getElementById('send-room').disabled = true
            $(`#${room}-join-leave`).html('Join');
            $(`#${room}`).css('background', 'white')
            $('#joined-room').html('')
        })
    }
}

function joinRoom(self) {
    const roomName = $(self).attr('id')
    const prevRoom = $('#joined-room').html()
    leaveRoom(prevRoom)
    if (prevRoom !== roomName) {
        socket.emit('joinRoom', {
            peer_id: peer.id,
            room: roomName
        }, () => {
            document.getElementById('send-room').disabled = false
            document.getElementById('broadcast').disabled = false
            $('#joined-room').html(roomName)
            $(`#${roomName}`).css('background', '#ef9a9a')
            $(`#${roomName}-join-leave`).html('Leave');
        })
    }
}

function sendAudioToCurrentRoom() {
    const room = $('#joined-room').html()
    socket.emit('audio', {
        room, client, blob
    })
}

//ATTEMPT USING PEERJS
function broadcastAudio() {
    const room = $('#joined-room').html();
    socket.emit('broadcast', room,
        remote_peers => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (stream) {
                    document.getElementById('broadcast').disabled = true
                    document.getElementById('stop-broadcast').disabled = false
                    remote_peers.forEach(remote_peer_id => {
                        let call = peer.call(remote_peer_id, stream)
                        calls.push(call)
                    })
                })
        })
}

function stopBroadcast() {
    calls.forEach(call => {
        call.close()
    })
    calls = []
}