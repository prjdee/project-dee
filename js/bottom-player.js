/**
 * Persistent Global Bottom Audio Player Controller
 * Seamlessly interfaces with SoundCloud Widget API and site playlist catalog
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
    const iframeEl = document.getElementById('pjd-hidden-sc-iframe');
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

    function formatTime(ms) {
        if (!ms || isNaN(ms)) return '0:00';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function initSCWidget() {
        if (!iframeEl || typeof SC === 'undefined' || typeof SC.Widget === 'undefined') {
            return;
        }

        try {
            scWidget = SC.Widget(iframeEl);

            scWidget.bind(SC.Widget.Events.READY, function() {
                isWidgetReady = true;
                scWidget.getDuration(function(duration) {
                    currentDuration = duration || 0;
                    if (totalTimeEl) totalTimeEl.textContent = formatTime(currentDuration);
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
                // Auto play next track in catalog!
                playNextTrack();
            });

            scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(data) {
                if (!currentDuration && data.currentPosition) {
                    scWidget.getDuration(function(d) {
                        currentDuration = d;
                        if (totalTimeEl) totalTimeEl.textContent = formatTime(d);
                    });
                }
                const currentPos = data.currentPosition || 0;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(currentPos);
                if (currentDuration > 0 && progressFill) {
                    const percent = Math.min(100, (currentPos / currentDuration) * 100);
                    progressFill.style.width = `${percent}%`;
                }
            });

        } catch (e) {
            console.warn('[Bottom Player] SoundCloud Widget Init Notice:', e);
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
                        const percent = Math.min(100, (pos / currentDuration) * 100);
                        progressFill.style.width = `${percent}%`;
                    }
                });
            }
        }, 1000);
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

    // Public method to play any track from anywhere on the site
    window.playTrackInBottomPlayer = function(trackData, index) {
        if (!trackData || !playerEl) return;

        currentTrackIndex = typeof index === 'number' ? index : 0;
        
        // Show the floating player
        playerEl.classList.add('active');

        // Update Meta UI
        if (titleEl) titleEl.textContent = trackData.title || 'Project Dee Track';
        if (thumbEl && trackData.thumb) thumbEl.src = trackData.thumb;
        if (scLink && trackData.sc_url) scLink.href = trackData.sc_url;

        // Reset progress UI
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (totalTimeEl) totalTimeEl.textContent = '...';
        if (progressFill) progressFill.style.width = '0%';

        // Load audio stream via widget
        if (trackData.sc_url) {
            const scUrl = trackData.sc_url;
            if (scWidget && isWidgetReady) {
                scWidget.load(scUrl, {
                    auto_play: true,
                    show_artwork: false,
                    callback: function() {
                        scWidget.play();
                        scWidget.getDuration(function(d) {
                            currentDuration = d;
                            if (totalTimeEl) totalTimeEl.textContent = formatTime(d);
                        });
                    }
                });
            } else if (iframeEl) {
                // If widget not initialized yet, re-target iframe src directly
                const encoded = encodeURIComponent(scUrl);
                iframeEl.src = `https://w.soundcloud.com/player/?url=${encoded}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
                setTimeout(initSCWidget, 1000);
            }
        }
    };

    function playPrevTrack() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + cat.length) % cat.length;
        window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
    }

    function playNextTrack() {
        const cat = getCatalog();
        if (cat.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % cat.length;
        window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
    }

    // Event Listeners
    if (playBtn) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (scWidget && isWidgetReady) {
                scWidget.toggle();
            } else {
                // If first click without active track, load first track
                const cat = getCatalog();
                if (cat.length > 0) {
                    window.playTrackInBottomPlayer(cat[0], 0);
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

    // Seeking on timeline
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

    // Initialize when DOM and SC API script are ready
    window.addEventListener('DOMContentLoaded', function() {
        // Wait briefly for SoundCloud Widget script to initialize
        if (typeof SC !== 'undefined' && typeof SC.Widget !== 'undefined') {
            initSCWidget();
        } else {
            const checkScInterval = setInterval(function() {
                if (typeof SC !== 'undefined' && typeof SC.Widget !== 'undefined') {
                    clearInterval(checkScInterval);
                    initSCWidget();
                }
            }, 300);
            setTimeout(function() { clearInterval(checkScInterval); }, 5000);
        }
    });

})();
