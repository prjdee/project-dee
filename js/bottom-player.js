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

    // Helper to get elements on demand
    const el = {
        get player() { return document.getElementById('pjd-bottom-player'); },
        get thumb() { return document.getElementById('pjd-player-thumb'); },
        get title() { return document.getElementById('pjd-player-title'); },
        get playBtn() { return document.getElementById('pjd-play-main-btn'); },
        get playIcon() { return document.getElementById('pjd-play-icon'); },
        get prevBtn() { return document.getElementById('pjd-prev-btn'); },
        get nextBtn() { return document.getElementById('pjd-next-btn'); },
        get scLink() { return document.getElementById('pjd-sc-link'); },
        get closeBtn() { return document.getElementById('pjd-close-player'); },
        get progressBarWrap() { return document.getElementById('pjd-progress-bar-wrap'); },
        get progressFill() { return document.getElementById('pjd-progress-fill'); },
        get currentTime() { return document.getElementById('pjd-current-time'); },
        get totalTime() { return document.getElementById('pjd-total-time'); },
        get scIframe() { return document.getElementById('sc-widget-iframe'); }
    };

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
        const player = el.player;
        const icon = el.playIcon;
        if (!player || !icon) return;
        if (playing) {
            player.classList.add('playing');
            icon.className = 'fa-solid fa-pause';
        } else {
            player.classList.remove('playing');
            icon.className = 'fa-solid fa-play';
        }
    }

    function startTimer() {
        stopTimer();
        progressTimer = setInterval(function() {
            if (scWidget && isWidgetReady && isPlaying) {
                scWidget.getPosition(function(pos) {
                    if (el.currentTime) el.currentTime.textContent = formatTime(pos);
                    if (currentDuration > 0 && el.progressFill) {
                        const pct = Math.min(100, (pos / currentDuration) * 100);
                        el.progressFill.style.width = `${pct}%`;
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

    function bindWidget() {
        const iframe = el.scIframe;
        if (!iframe || typeof SC === 'undefined' || typeof SC.Widget === 'undefined') {
            return;
        }

        try {
            scWidget = SC.Widget(iframe);

            scWidget.bind(SC.Widget.Events.READY, function() {
                isWidgetReady = true;
                scWidget.getDuration(function(d) {
                    currentDuration = d || 0;
                    if (el.totalTime) el.totalTime.textContent = formatTime(currentDuration);
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
                    if (el.totalTime) el.totalTime.textContent = formatTime(currentDuration);
                }
                if (el.currentTime) el.currentTime.textContent = formatTime(pos);
                if (currentDuration > 0 && el.progressFill) {
                    const pct = Math.min(100, (pos / currentDuration) * 100);
                    el.progressFill.style.width = `${pct}%`;
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
        if (el.title) el.title.textContent = trackData.title || 'Project Dee';
        if (el.thumb) el.thumb.src = trackData.thumb || 'https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-purepulse.jpg';
        if (el.scLink && trackData.sc_url) el.scLink.href = trackData.sc_url;
        if (el.currentTime) el.currentTime.textContent = '0:00';
        if (el.totalTime) el.totalTime.textContent = '...';
        if (el.progressFill) el.progressFill.style.width = '0%';

        // 2. Load audio into official player iframe
        const iframe = el.scIframe;
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

    function togglePlayback() {
        const iframe = el.scIframe;
        
        if (scWidget && isWidgetReady) {
            try {
                scWidget.toggle();
                return;
            } catch (e) {
                console.warn('[Bottom Player] Toggle error:', e);
            }
        }

        const cat = getCatalog();
        if (!isPlaying) {
            if (cat.length > 0) {
                window.playTrackInBottomPlayer(cat[currentTrackIndex], currentTrackIndex);
            }
        } else {
            if (iframe) {
                bindWidget();
                if (scWidget) scWidget.pause();
            }
            updatePlayUI(false);
        }
    }

    // Attach Click Events
    function attachPlayerEvents() {
        if (el.playBtn) {
            el.playBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePlayback();
            };
        }

        if (el.prevBtn) {
            el.prevBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                playPrev();
            };
        }

        if (el.nextBtn) {
            el.nextBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                playNext();
            };
        }

        if (el.closeBtn) {
            el.closeBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (scWidget && isWidgetReady) {
                    scWidget.pause();
                }
                updatePlayUI(false);
                if (el.player) {
                    el.player.style.transform = 'translateY(105%)';
                }
            };
        }

        if (el.progressBarWrap) {
            el.progressBarWrap.onclick = function(e) {
                if (!currentDuration || !scWidget || !isWidgetReady) return;
                const rect = el.progressBarWrap.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const seekMs = currentDuration * ratio;
                scWidget.seekTo(seekMs);
                if (el.progressFill) el.progressFill.style.width = `${ratio * 100}%`;
            };
        }
    }

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
            if (el.title) el.title.textContent = first.title;
            if (el.thumb) el.thumb.src = first.thumb || 'https://raw.githubusercontent.com/prjdee/project-dee/main/assets/covers/sc-purepulse.jpg';
            if (el.scLink && first.sc_url) el.scLink.href = first.sc_url;
        }
        
        attachPlayerEvents();
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
