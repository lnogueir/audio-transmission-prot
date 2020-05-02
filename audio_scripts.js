let mediaRecorder = null
let clock = null
let counter = 0

function startRecording() {
    if (navigator.mediaDevices) {
        var constraints = { audio: true };
        var chunks = [];
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.onstop = e => {
                    blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                    chunks = [];
                    delete mediaRecorder
                    stream.getTracks().forEach(track => {
                        track.stop()
                    })
                }
                mediaRecorder.ondataavailable = e => {
                    chunks.push(e.data)
                }
                mediaRecorder.start()
                document.getElementById('start-recording').disabled = true
                document.getElementById('stop-recording').disabled = false
                $('#record-clock').css('display', 'flex')
                clockInterval = setInterval(() => {
                    $('#record-clock').html(counter + ' s')
                    counter += 100 / 1000
                    counter = Math.round(counter * 100) / 100
                }, 100)
            })
            .catch(err => {
                console.log(err)
            })
    }
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop()
        document.getElementById('start-recording').disabled = false
        document.getElementById('play-recording').disabled = false
        document.getElementById('stop-recording').disabled = true
        clearInterval(clockInterval)
        counter = 0
        $('#record-clock').html('')
        $('#record-clock').css('display', 'none')
    }
}

function playRecording() {
    if (blob) {
        var audioURL = URL.createObjectURL(blob)
        let audio = document.createElement('audio')
        audio.src = audioURL
        audio.play()
        delete audio
    }
}