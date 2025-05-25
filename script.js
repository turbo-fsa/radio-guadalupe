let isPlaying = false;
let isMuted = false;
let deferredPrompt;
let audioContext;
let analyser;
let currentSongIndex = 0;
let songStartTime = Date.now();
const STREAM_URL = "https://masstreaming.online/8146/stream ";
const songDatabase = [
    { title: 'Soy Sabalero', artist: 'Los Palmeras', duration: 245 },
    { title: 'La Mano de Dios', artist: 'Rodrigo', duration: 198 },
    { title: 'Lagrimas de Amor', artist: 'Los Tekis', duration: 213 },
    { title: 'Enamorado de Ti', artist: 'Cuarteto Leo', duration: 187 },
    { title: 'Que Tire la Primera Piedra', artist: 'Antonio Ríos', duration: 234 },
];

const playBtn = document.getElementById('playBtn');
const muteBtn = document.getElementById('muteBtn');
const refreshBtn = document.getElementById('refreshBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const listeningIndicator = document.getElementById('listeningIndicator');
const listenerCount = document.getElementById('listenerCount');
const audioVisualizer = document.getElementById('audioVisualizer');
const radioPlayer = document.getElementById('radioPlayer');
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');

function togglePlay() {
    if (isPlaying) {
        radioPlayer.pause();
        playBtn.innerHTML = '▶️';
        isPlaying = false;
        hidePlayingIndicators();
    } else {
        updateStatus('Conectando a Radio Guadalupe...', false);
        radioPlayer.src = STREAM_URL;
        radioPlayer.play()
            .then(() => {
                playBtn.innerHTML = '⏸️';
                isPlaying = true;
                updateStatus('🎵 Al aire - En vivo', true);
                showPlayingIndicators();
                selectRandomSong();
            })
            .catch(handleError);
    }
}

function toggleMute() {
    if (isMuted) {
        radioPlayer.muted = false;
        muteBtn.innerHTML = '🔊';
        isMuted = false;
    } else {
        radioPlayer.muted = true;
        muteBtn.innerHTML = '🔇';
        isMuted = true;
    }
}

function refreshStream() {
    updateStatus('Reconectando...', false);
    radioPlayer.load();
    if (isPlaying) {
        setTimeout(() => {
            radioPlayer.play().catch(handleError);
        }, 1000);
    }
}

function updateVolume() {
    const volume = volumeSlider.value / 100;
    radioPlayer.volume = volume;
    volumeValue.textContent = volumeSlider.value;

    if (volume === 0) {
        muteBtn.innerHTML = '🔇';
    } else if (volume < 0.5) {
        muteBtn.innerHTML = '🔉';
    } else {
        muteBtn.innerHTML = '🔊';
    }
}

function updateStatus(text, playing) {
    statusText.textContent = text;
    if (playing) {
        statusDot.classList.add('playing');
    } else {
        statusDot.classList.remove('playing');
    }
}

function selectRandomSong() {
    currentSongIndex = Math.floor(Math.random() * songDatabase.length);
    songStartTime = Date.now();
    updateCurrentSong();
}

function updateCurrentSong() {
    if (isPlaying && songDatabase[currentSongIndex]) {
        const song = songDatabase[currentSongIndex];
        songTitle.textContent = song.title;
        songArtist.textContent = `${song.artist} • Música Tropical`;
        listenerCount.textContent = Math.floor(Math.random() * 150) + 25;
    } else {
        songTitle.textContent = '¡Escuchá la mejor música tropical!';
        songArtist.textContent = 'Radio Guadalupe 105.3 FM - Formosa';
    }
}

function showPlayingIndicators() {
    listeningIndicator.style.opacity = '1';
    audioVisualizer.style.opacity = '1';
}

function hidePlayingIndicators() {
    listeningIndicator.style.opacity = '0';
    audioVisualizer.style.opacity = '0';
}

function handleError() {
    console.error('Error al reproducir');
    updateStatus('Error de conexión - Verificando señal...', false);
    playBtn.innerHTML = '▶️';
    isPlaying = false;
    hidePlayingIndicators();

    setTimeout(() => {
        if (!isPlaying) {
            radioPlayer.load();
            updateStatus('Listo para reproducir', false);
        }
    }, 3000);
}

function initializeAudioAnalysis() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(radioPlayer);
            analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 16;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function drawVisualizer() {
                requestAnimationFrame(drawVisualizer);
                analyser.getByteFrequencyData(dataArray);
                const bars = document.querySelectorAll('.bar');
                bars.forEach((bar, i) => {
                    const height = dataArray[i] / 2;
                    bar.style.height = Math.max(height, 4) + 'px';
                });
            }
            drawVisualizer();
        }
    } catch (error) {
        console.log("Web Audio API no disponible");
    }
}

function checkSongProgress() {
    if (isPlaying && songDatabase[currentSongIndex]) {
        const elapsed = (Date.now() - songStartTime) / 1000;
        const duration = songDatabase[currentSongIndex].duration;
        const variation = (Math.random() - 0.5) * 60;
        if (elapsed >= duration + variation) {
            selectRandomSong();
        }
    }
}

// Event listeners
playBtn.addEventListener('click', togglePlay);
muteBtn.addEventListener('click', toggleMute);
refreshBtn.addEventListener('click', refreshStream);
volumeSlider.addEventListener('input', updateVolume);

radioPlayer.addEventListener('loadstart', () => updateStatus('Conectando...', false));
radioPlayer.addEventListener('loadeddata', () => updateStatus('Señal recibida', false));
radioPlayer.addEventListener('canplay', () => updateStatus('Listo para reproducir', false));
radioPlayer.addEventListener('playing', () => {
    updateStatus('🎵 Al aire - En vivo', true);
    initializeAudioAnalysis();
});
radioPlayer.addEventListener('pause', () => updateStatus('Pausado', false));
radioPlayer.addEventListener('error', handleError);
radioPlayer.addEventListener('stalled', () => updateStatus('Reconectando...', false));
radioPlayer.addEventListener('waiting', () => updateStatus('Cargando audio...', false));

setInterval(() => {
    checkSongProgress();
    if (isPlaying) {
        const current = parseInt(listenerCount.textContent);
        const variation = Math.floor(Math.random() * 10) - 5;
        listenerCount.textContent = Math.max(15, Math.min(200, current + variation));
    }
}, 5000);

function selectRandomSong() {
    currentSongIndex = Math.floor(Math.random() * songDatabase.length);
    songStartTime = Date.now();
    updateCurrentSong();
}

updateCurrentSong();

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.style.display = 'block';
});

installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                installPrompt.style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
});

window.addEventListener('appinstalled', () => {
    installPrompt.style.display = 'none';
});