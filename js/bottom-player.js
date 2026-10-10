/**
 * Persistent Global Bottom Audio Player Controller
 * Direct synchronization with SoundCloud Official Player & Catalog
 */

(function() {
    'use strict';

    let scWidget = null;
    let isWidgetReady = false;
    let currentTrackIndex = 0;
    let isPlaying = false;
    let currentDuration = 0;
    let progressInterval = null;

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

    // We bind to the visible official player iframe: #sc-widget-iframe
    function getTargetIframe() {
        return document.getElementById('sc-widget-iframe');
    }

    function formatTime(ms) {
        if (!ms || isNaN(ms)) return '0:00';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function initWidgetBinding() {
        const iframe = getTargetIframe();
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
                    isPlaying = !paused;
                    updatePlayState(isPlaying);
                });
            });

            scWidget.bind(SC.Widget.Events.PLAY, function() {
                isPlaying = true;
                updatePlayState(true);
                startProgressTracker();
            });

            scWidget.bind(SC.Widget.Events.PAUSE, function() {
                isPlaying = false;
                updatePlayState(false);
                stopProgressTracker();
            });

            scWidget.bind(SC.Widget.Events.FINISH, function() {
                isPlaying = false;
                updatePlayState(false);
                stopProgressTracker();
                playNextTrack();
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
            console.warn('[Bottom Player] Widget binding error:', err);
        }
    }

    function updatePlayState(playing) {
        if (!playerEl || !playIcon) return;
        if (playing) {
            playerEl.classList.add('playing');
            playIcon.className = 'fa-solid fa-pause';
        } else {
            playerEl.classList.remove('playing');
            playIcon.className = 'fa-solid fa-play';
        }
    }

    function startProgressTracker() {
        stopProgressTracker();
        progressInterval = setInterval(function() {
            if (scWidget && isWidgetReady && isPlaying) {
                scWidget.getPosition(function(pos) {
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(pos);
                    if (currentDuration > 0 && progressFill) {
                        const pct = Math.min(100, (pos / currentDuration) * 100);
                        progressFill.style.width = `${pct}%`;
                    }
                });
            }
        }, 800);
    }

    function stopProgressTracker() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function getCatalog() {
        if (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) {
            return soundCloudCatalog;
        }
        return [];
    }

    // Called whenever a track is selected or loaded
    window.playTrackInBottomPlayer = function(trackData, index) {
        if (!trackData) return;
        currentTrackIndex = typeof index === 'number' ? index : 0;

        if (titleEl) titleEl.textContent = trackData.title || 'Project Dee';
        if (thumbEl && trackData.thumb) thumbEl.src = trackData.thumb;
        if (scLink && trackData.sc_url) scLink.href = trackData.sc_url;

        // Reset progress numbers
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (totalTimeEl) totalTimeEl.textContent = '...';
        if (progressFill) progressFill.style.width = '0%';

        // Ensure bottom dock is active
        if (playerEl) playerEl.classList.add('active');

        // Re-bind widget after iframe src update
        setTimeout(initWidgetBinding, 800);
    };

    function playPrevTrack() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + cat.length) % cat.length;
        if (typeof window.loadTrackIntoWaveform === 'function') {
            window.loadTrackIntoWaveform(cat[currentTrackIndex], currentTrackIndex);
        }
    }

    function playNextTrack() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % cat.length;
        if (typeof window.loadTrackIntoWaveform === 'function') {
            window.loadTrackIntoWaveform(cat[currentTrackIndex], currentTrackIndex);
        }
    }

    // Controls
    if (playBtn) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (scWidget && isWidgetReady) {
                scWidget.toggle();
            } else {
                initWidgetBinding();
                if (scWidget) {
                    scWidget.toggle();
                } else {
                    const cat = getCatalog();
                    if (cat.length > 0 && typeof window.loadTrackIntoWaveform === 'function') {
                        window.loadTrackIntoWaveform(cat[0], 0);
                    }
                }
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            playPrevTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            playNextTrack();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (scWidget && isWidgetReady) {
                scWidget.pause();
            }
            if (playerEl) {
                playerEl.classList.remove('active');
            }
        });
    }

    if (progressBarWrap) {
        progressBarWrap.addEventListener('click', function(e) {
            if (!currentDuration || !scWidget || !isWidgetReady) return;
            const rect = progressBarWrap.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekMs = currentDuration * ratio;
            scWidget.seekTo(seekMs);
            if (progressFill) progressFill.style.width = `${ratio * 100}%`;
        });
    }

    // Startup init
    window.addEventListener('DOMContentLoaded', function() {
        const cat = getCatalog();
        if (cat.length > 0) {
            const first = cat[0];
            if (titleEl) titleEl.textContent = first.title;
            if (thumbEl && first.thumb) thumbEl.src = first.thumb;
            if (scLink && first.sc_url) scLink.href = first.sc_url;
        }

        setTimeout(initWidgetBinding, 1000);
    });

})();
