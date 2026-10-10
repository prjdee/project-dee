/**
 * Persistent Global Bottom Audio Player Controller (Standalone Audio Engine)
 * Directly plays audio streams and syncs with SoundCloud catalog
 */

(function() {
    'use strict';

    let currentTrackIndex = 0;
    let isPlaying = false;
    let scWidget = null;
    let isWidgetReady = false;
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

    function getCatalog() {
        if (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) {
            return soundCloudCatalog;
        }
        return [];
    }

    function formatTime(ms) {
        if (!ms || isNaN(ms)) return '0:00';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function updatePlayState(playing) {
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
        }, 600);
    }

    function stopProgressTracker() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function bindWidgetToIframe(iframe) {
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
            });

            scWidget.bind(SC.Widget.Events.PLAY, function() {
                updatePlayState(true);
                startProgressTracker();
            });

            scWidget.bind(SC.Widget.Events.PAUSE, function() {
                updatePlayState(false);
                stopProgressTracker();
            });

            scWidget.bind(SC.Widget.Events.FINISH, function() {
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

        } catch (e) {
            console.warn('[Bottom Player] Widget binding warning:', e);
        }
    }

    // Direct playback function
    window.playTrackInBottomPlayer = function(trackData, index) {
        if (!trackData) return;
        currentTrackIndex = typeof index === 'number' ? index : 0;

        // 1. Update UI Elements immediately
        if (titleEl) titleEl.textContent = trackData.title || 'Project Dee';
        if (thumbEl) {
            thumbEl.src = trackData.thumb || 'assets/covers/sc-purepulse.jpg';
        }
        if (scLink && trackData.sc_url) {
            scLink.href = trackData.sc_url;
        }
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (totalTimeEl) totalTimeEl.textContent = '...';
        if (progressFill) progressFill.style.width = '0%';

        // 2. Play audio in official iframe deck
        const scIframe = document.getElementById('sc-widget-iframe');
        if (scIframe && trackData.sc_url) {
            const encodedUrl = encodeURIComponent(trackData.sc_url);
            scIframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
            
            // Re-bind widget after iframe loads
            setTimeout(function() {
                bindWidgetToIframe(scIframe);
            }, 800);
        }

        updatePlayState(true);
    };

    function playPrevTrack() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + cat.length) % cat.length;
        if (typeof window.loadTrackIntoWaveform === 'function') {
            window.loadTrackIntoWaveform(cat[currentTrackIndex], currentTrackIndex);
        } else {
            window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
        }
    }

    function playNextTrack() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % cat.length;
        if (typeof window.loadTrackIntoWaveform === 'function') {
            window.loadTrackIntoWaveform(cat[currentTrackIndex], currentTrackIndex);
        } else {
            window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
        }
    }

    // Play/Pause button
    if (playBtn) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const scIframe = document.getElementById('sc-widget-iframe');
            if (scWidget && isWidgetReady) {
                scWidget.toggle();
            } else if (scIframe) {
                bindWidgetToIframe(scIframe);
                if (scWidget) {
                    scWidget.toggle();
                } else {
                    const cat = getCatalog();
                    if (cat.length > 0) {
                        window.playTrackInBottomPlayer(cat[0], 0);
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
                playerEl.style.transform = 'translateY(105%)';
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

    // Initial setup on page ready
    function initDefaultTrack() {
        const cat = getCatalog();
        if (cat.length > 0) {
            const first = cat[0];
            if (titleEl) titleEl.textContent = first.title;
            if (thumbEl) thumbEl.src = first.thumb || 'assets/covers/sc-purepulse.jpg';
            if (scLink && first.sc_url) scLink.href = first.sc_url;
        }
        const scIframe = document.getElementById('sc-widget-iframe');
        if (scIframe) {
            bindWidgetToIframe(scIframe);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDefaultTrack);
    } else {
        initDefaultTrack();
    }

})();
