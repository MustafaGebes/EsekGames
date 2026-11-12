var SoundEngine = (function () {
    var ctx = null;
    var isMuted = false;
    var musicTimer = null;
    var currentMusicAudio = null;
    var currentMode = "none";
    var noteStep = 0;
    var pendingTones = [];
    var isResuming = false;
    var hasPlayedAudio = false;
    var lastUnlockAt = 0;
    var lastUnlockHadAudio = false;

    var MENU_MELODY = [261.63, 392.00, 329.63, 392.00, 293.66, 440.00, 349.23, 392.00];
    var GAME_MELODY = [220.00, 261.63, 329.63, 293.66, 196.00, 246.94, 293.66, 261.63];
    var MENU_CHORDS = [
        [130.81, 196.00, 261.63],
        [146.83, 220.00, 293.66],
        [110.00, 164.81, 220.00],
        [130.81, 196.00, 261.63]
    ];
    var GAME_CHORDS = [
        [110.00, 164.81, 220.00],
        [130.81, 196.00, 261.63],
        [98.00, 146.83, 196.00],
        [116.54, 174.61, 233.08]
    ];

    function flushPendingTones() {
        if (!ctx || ctx.state !== "running") return;
        var queued = pendingTones.slice();
        pendingTones.length = 0;
        queued.forEach(function (tone) {
            scheduleTone(tone.freq, tone.type, tone.duration, tone.volume, tone.delay);
        });
    }

    function initAudio(fromGesture) {
        if (!ctx) {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) ctx = new AudioCtx();
        }
        if (ctx && ctx.state !== "running") {
            if (!isResuming || fromGesture) {
                isResuming = true;
                var resumeResult = ctx.resume();
                if (resumeResult && resumeResult.then) {
                    resumeResult.then(function () {
                        isResuming = false;
                        flushPendingTones();
                        if (currentMode !== "none" && !musicTimer) startMusic(currentMode);
                    }, function () {
                        isResuming = false;
                    });
                } else {
                    isResuming = false;
                }
            }
        }
        return ctx;
    }

    function playTone(freq, type, duration, volume, delay) {
        if (isMuted) return;
        var audioContext = initAudio();
        if (!ctx) return;
        if (audioContext.state !== "running") {
            pendingTones.push({ freq: freq, type: type, duration: duration, volume: volume, delay: delay || 0 });
            return;
        }

        scheduleTone(freq, type, duration, volume, delay);
    }

    function scheduleTone(freq, type, duration, volume, delay) {
        if (isMuted || !ctx || ctx.state !== "running") return;
        hasPlayedAudio = true;
        var startTime = ctx.currentTime + (delay || 0);
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var peak = Math.max(0.0001, Math.min((volume || 0.14) * 1.12, 0.24));
        var length = Math.max(0.04, duration || 0.12);

        osc.type = type || "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + length);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = function () {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start(startTime);
        osc.stop(startTime + length + 0.025);
    }

    function unlockAudio() {
        var now = Date.now();
        if (now - lastUnlockAt > 500) lastUnlockHadAudio = hasPlayedAudio;
        lastUnlockAt = now;
        var audioContext = initAudio(true);
        if (audioContext && audioContext.state === "running") {
            flushPendingTones();
            if (currentMode !== "none" && !musicTimer) startMusic(currentMode);
        }
    }

    function startSynthFallback(mode) {
        if (isMuted || mode === "none" || musicTimer) return;
        var melody = mode === "menu" ? MENU_MELODY : GAME_MELODY;
        var chords = mode === "menu" ? MENU_CHORDS : GAME_CHORDS;
        var tempo = mode === "menu" ? 1450 : 1650;
        var volume = mode === "menu" ? 0.20 : 0.18;

        function playMusicStep() {
            var step = noteStep % melody.length;
            playTone(melody[step], "sine", 1.35, volume);
            if (step % 4 === 0) {
                var chord = chords[Math.floor(noteStep / 4) % chords.length];
                chord.forEach(function (freq) {
                    playTone(freq, "sine", 5.2, 0.07);
                });
            }
            noteStep++;
        }

        playMusicStep();
        musicTimer = setInterval(function () {
            if (isMuted) return;
            playMusicStep();
        }, tempo);
    }

    function startMusic(mode) {
        if (mode === "none") {
            currentMode = "none";
            stopMusic();
            return;
        }
        if (isMuted) {
            currentMode = mode;
            return;
        }
        if (currentMode === mode && musicTimer) return;
        if (currentMode === mode && currentMusicAudio) {
            if (currentMusicAudio.paused) {
                var resumedPlayback = currentMusicAudio.play();
                if (resumedPlayback && resumedPlayback.then) {
                    resumedPlayback.then(function () { hasPlayedAudio = true; }, function () {});
                }
            }
            return;
        }

        stopMusic();
        currentMode = mode;
        noteStep = 0;
        var source = mode === "menu"
            ? "https://cdn.pixabay.com/download/audio/2026/08/04/audio_2191116a36.mp3?filename=atlasaudio-ambient-piano-580084.mp3"
            : "https://cdn.pixabay.com/download/audio/2025/11/18/audio_2ba5a53997.mp3?filename=clavier-music-ambient-video-game-music-438767.mp3";
        var audio = new Audio(source);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = mode === "menu" ? 0.20 : 0.18;
        currentMusicAudio = audio;
        audio.addEventListener("error", function () {
            if (currentMusicAudio !== audio || isMuted) return;
            currentMusicAudio = null;
            startSynthFallback(mode);
        });
        var playback = audio.play();
        if (playback && playback.then) {
            playback.then(function () {
                hasPlayedAudio = true;
            }, function (error) {
                if (currentMusicAudio !== audio || !error || error.name === "NotAllowedError" || error.name === "AbortError") return;
                currentMusicAudio = null;
                startSynthFallback(mode);
            });
        }
    }

    function stopMusic() {
        if (musicTimer) {
            clearInterval(musicTimer);
            musicTimer = null;
        }
        if (currentMusicAudio) {
            currentMusicAudio.pause();
            currentMusicAudio.currentTime = 0;
            currentMusicAudio = null;
        }
    }

    function setButtonState(muted) {
        var btn = document.getElementById("sound-toggle-btn");
        if (!btn) return;
        btn.textContent = muted ? "🔇" : "🔊";
        btn.title = muted ? "Sesi Aç" : "Sesi Kapat";
        btn.setAttribute("aria-label", muted ? "Sesi aç" : "Sesi kapat");
        if (muted) btn.classList.add("muted");
        else btn.classList.remove("muted");
    }

    return {
        unlock: unlockAudio,
        toggle: function () {
            var hadAudioBeforeToggle = Date.now() - lastUnlockAt < 500 ? lastUnlockHadAudio : hasPlayedAudio;
            var audioContext = initAudio(true);
            if (!isMuted && !hadAudioBeforeToggle) {
                setButtonState(false);
                if (currentMode === "none") currentMode = "menu";
                playTone(440, "sine", 0.16, 0.20, 0);
                if (currentMode !== "none" && !musicTimer) startMusic(currentMode);
                return;
            }
            if (!isMuted) {
                playTone(560, "triangle", 0.11, 0.18, 0);
                playTone(360, "sine", 0.16, 0.16, 0.06);
                isMuted = true;
                stopMusic();
                setButtonState(true);
            } else {
                isMuted = false;
                playTone(440, "triangle", 0.10, 0.19, 0);
                playTone(660, "sine", 0.18, 0.20, 0.08);
                setButtonState(false);
                if (currentMode !== "none") {
                    var savedMode = currentMode;
                    currentMode = "none";
                    startMusic(savedMode);
                }
            }
        },

        playMenuMusic: function () { startMusic("menu"); },
        playGameMusic: function () { startMusic("game"); },
        stopAllMusic: function () {
            currentMode = "none";
            stopMusic();
        },

        playStartClick: function () {
            playTone(523.25, "triangle", 0.16, 0.20, 0);
            playTone(659.25, "triangle", 0.18, 0.21, 0.08);
            playTone(783.99, "sine", 0.30, 0.22, 0.17);
        },
        playButton: function () {
            playTone(660, "triangle", 0.09, 0.17, 0);
            playTone(880, "sine", 0.12, 0.15, 0.035);
        },
        playType: function () {
            playTone(740, "triangle", 0.075, 0.19, 0);
            playTone(1110, "sine", 0.055, 0.09, 0.008);
        },
        playDelete: function () {
            playTone(510, "triangle", 0.075, 0.17, 0);
            playTone(330, "sine", 0.12, 0.17, 0.035);
        },
        playEnter: function () {
            playTone(520, "square", 0.10, 0.14, 0);
            playTone(780, "triangle", 0.15, 0.19, 0.06);
        },
        playGreen: function (delay) {
            var d = delay || 0;
            playTone(740, "triangle", 0.17, 0.20, d);
            playTone(988, "sine", 0.20, 0.16, d + 0.035);
        },
        playYellow: function (delay) {
            playTone(587.33, "triangle", 0.19, 0.18, delay || 0);
        },
        playAbsent: function (delay) {
            playTone(246.94, "triangle", 0.14, 0.15, delay || 0);
        },
        playError: function () {
            playTone(240, "sawtooth", 0.14, 0.15, 0);
            playTone(185, "sawtooth", 0.18, 0.15, 0.10);
        },
        playLevelUp: function () {
            playTone(523.25, "triangle", 0.16, 0.19, 0);
            playTone(659.25, "triangle", 0.16, 0.20, 0.11);
            playTone(783.99, "triangle", 0.16, 0.21, 0.22);
            playTone(1046.50, "sine", 0.30, 0.22, 0.33);
        },
        playWin: function () {
            stopMusic();
            playTone(523.25, "triangle", 0.20, 0.21, 0);
            playTone(659.25, "triangle", 0.20, 0.21, 0.13);
            playTone(783.99, "triangle", 0.22, 0.22, 0.26);
            playTone(1046.50, "sine", 0.42, 0.24, 0.40);
        },
        playLose: function () {
            stopMusic();
            playTone(392.00, "triangle", 0.25, 0.19, 0);
            playTone(329.63, "triangle", 0.25, 0.18, 0.19);
            playTone(261.63, "sine", 0.44, 0.20, 0.38);
        }
    };
})();

function toggleSound() {
    SoundEngine.toggle();
}

// Tarayıcılar sesi kullanıcı hareketi dışında başlatmayı engeller.
// capture aşaması, oyun düğmesinin onclick kodundan önce AudioContext'i uyandırır.
document.addEventListener("pointerdown", function () {
    SoundEngine.unlock();
}, true);
document.addEventListener("click", function () {
    SoundEngine.unlock();
}, true);
document.addEventListener("touchstart", function () {
    SoundEngine.unlock();
}, true);
document.addEventListener("keydown", function () {
    SoundEngine.unlock();
}, true);

function attemptInitialMusic() {
    SoundEngine.playMenuMusic();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attemptInitialMusic);
} else {
    attemptInitialMusic();
}

document.addEventListener("click", function firstInteract() {
    if (document.getElementById("menu-screen").classList.contains("active")) {
        SoundEngine.playMenuMusic();
    }
    document.removeEventListener("click", firstInteract);
});
