/**
 * Persistent Global Bottom Audio Player Controller (Direct Audio Engine)
 * Controls the Official SoundCloud Player Deck with 100% reliability
 */

(function() {
    'use strict';

    let currentTrackIndex = 0;
    let isPlaying = false;
    let scWidget = null;
    let isWidgetReady = false;
    let currentDuration = 0;
    let progressTimer = null;

    // Elements
    const playerEl = document.getElementById('pjd-bottom-player');
    const thumbEl = document.getElementById('pjd-player-thumb');
    const titleEl = document.getElementById('pjd-player-title');
    const playBtn = document.getElementById('pjd-play-main-btn');
    const playIcon = document.getElementById('pjd-play-icon');
    const prevBtn = document.getElementById('pjd-prev-btn');
    const nextBtn = document.getElementById('pjd-next-btn');
    const scLink = document.getElementById('pjd-sc-link');
    const closeBtn = document.getElementById('pjd-close-player');
    const progressBarWrap = document.getElementById('pjd-progress-bar-wrap');
    const progressFill = document.getElementById('pjd-progress-fill');
    const currentTimeEl = document.getElementById('pjd-current-time');
    const totalTimeEl = document.getElementById('pjd-total-time');

    function getCatalog() {
        if (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) {
            return soundCloudCatalog;
        }
        return [];
    }

    function formatTime(ms) {
        if (!ms || isNaN(ms)) return '0:00';
        const totalSec = Math.floor(ms / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function updatePlayUI(playing) {
        isPlaying = playing;
        if (!playerEl || !playIcon) return;
        if (playing) {
            playerEl.classList.add('playing');
            playIcon.className = 'fa-solid fa-pause';
        } else {
            playerEl.classList.remove('playing');
            playIcon.className = 'fa-solid fa-play';
        }
    }

    function startTimer() {
        stopTimer();
        progressTimer = setInterval(function() {
            if (scWidget && isWidgetReady && isPlaying) {
                scWidget.getPosition(function(pos) {
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(pos);
                    if (currentDuration > 0 && progressFill) {
                        const pct = Math.min(100, (pos / currentDuration) * 100);
                        progressFill.style.width = `${pct}%`;
                    }
                });
            }
        }, 500);
    }

    function stopTimer() {
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
    }

    function getScIframe() {
        return document.getElementById('sc-widget-iframe');
    }

    function bindWidget() {
        const iframe = getScIframe();
        if (!iframe || typeof SC === 'undefined' || typeof SC.Widget === 'undefined') {
            return;
        }

        try {
            scWidget = SC.Widget(iframe);

            scWidget.bind(SC.Widget.Events.READY, function() {
                isWidgetReady = true;
                scWidget.getDuration(function(d) {
                    currentDuration = d || 0;
                    if (totalTimeEl) totalTimeEl.textContent = formatTime(currentDuration);
                });
                scWidget.isPaused(function(paused) {
                    updatePlayUI(!paused);
                });
            });

            scWidget.bind(SC.Widget.Events.PLAY, function() {
                updatePlayUI(true);
                startTimer();
            });

            scWidget.bind(SC.Widget.Events.PAUSE, function() {
                updatePlayUI(false);
                stopTimer();
            });

            scWidget.bind(SC.Widget.Events.FINISH, function() {
                updatePlayUI(false);
                stopTimer();
                playNext();
            });

            scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(data) {
                const pos = data.currentPosition || 0;
                if (!currentDuration && data.relativePosition > 0) {
                    currentDuration = Math.round(pos / data.relativePosition);
                    if (totalTimeEl) totalTimeEl.textContent = formatTime(currentDuration);
                }
                if (currentTimeEl) currentTimeEl.textContent = formatTime(pos);
                if (currentDuration > 0 && progressFill) {
                    const pct = Math.min(100, (pos / currentDuration) * 100);
                    progressFill.style.width = `${pct}%`;
                }
            });

        } catch (err) {
            console.warn('[Bottom Player] Widget binding warning:', err);
        }
    }

    // Play a specific track
    window.playTrackInBottomPlayer = function(trackData, index) {
        if (!trackData) return;
        currentTrackIndex = typeof index === 'number' ? index : 0;

        // 1. Update Bottom Bar Info
        if (titleEl) titleEl.textContent = trackData.title || 'Project Dee';
        if (thumbEl) thumbEl.src = trackData.thumb || 'https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-purepulse.jpg';
        if (scLink && trackData.sc_url) scLink.href = trackData.sc_url;
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (totalTimeEl) totalTimeEl.textContent = '...';
        if (progressFill) progressFill.style.width = '0%';

        // 2. Load audio into official player iframe
        const iframe = getScIframe();
        if (iframe && trackData.sc_url) {
            const encodedUrl = encodeURIComponent(trackData.sc_url);
            iframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
            
            // Re-bind widget to listen to events
            setTimeout(bindWidget, 700);
        }

        updatePlayUI(true);
    };

    function playPrev() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + cat.length) % cat.length;
        window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
    }

    function playNext() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % cat.length;
        window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
    }

    // Play/Pause Action
    function togglePlayback() {
        const iframe = getScIframe();
        
        // If widget is bound, try native toggle
        if (scWidget && isWidgetReady) {
            try {
                scWidget.toggle();
                return;
            } catch (e) {
                console.warn('[Bottom Player] Toggle error:', e);
            }
        }

        // Fallback: If not playing yet or widget unready, load track or re-bind
        const cat = getCatalog();
        if (!isPlaying) {
            if (cat.length > 0) {
                window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
            }
        } else {
            if (iframe) {
                // To pause safely if widget fails: stop audio reload
                bindWidget();
                if (scWidget) scWidget.pause();
            }
            updatePlayUI(false);
        }
    }

    // Attach Click Events Directly
    if (playBtn) {
        playBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePlayback();
        };
    }

    if (prevBtn) {
        prevBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            playPrev();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            playNext();
        };
    }

    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (scWidget && isWidgetReady) {
                scWidget.pause();
            }
            updatePlayUI(false);
            if (playerEl) {
                playerEl.style.transform = 'translateY(105%)';
            }
        };
    }

    if (progressBarWrap) {
        progressBarWrap.onclick = function(e) {
            if (!currentDuration || !scWidget || !isWidgetReady) return;
            const rect = progressBarWrap.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekMs = currentDuration * ratio;
            scWidget.seekTo(seekMs);
            if (progressFill) progressFill.style.width = `${ratio * 100}%`;
        };
    }

    // Make track cards in the catalog trigger the bottom player on click
    function attachTrackCardListeners() {
        const cards = document.querySelectorAll('.track-card');
        const cat = getCatalog();
        cards.forEach((card, idx) => {
            card.addEventListener('click', function() {
                if (cat[idx]) {
                    window.playTrackInBottomPlayer(cat[idx], idx);
                }
            });
        });
    }

    // Startup Init
    function init() {
        const cat = getCatalog();
        if (cat.length > 0) {
            const first = cat[0];
            if (titleEl) titleEl.textContent = first.title;
            if (thumbEl) thumbEl.src = first.thumb || 'https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-purepulse.jpg';
            if (scLink && first.sc_url) scLink.href = first.sc_url;
        }
        
        bindWidget();
        setTimeout(bindWidget, 1200);
        setTimeout(attachTrackCardListeners, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
