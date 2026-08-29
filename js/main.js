/* --------------------------------------------------
   PROJECT DEE - INTERACTIVE LOGIC (main.js)
-------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    initLanguageSelector();
    initHeroLogoScroll(); // Logo parallax background scroll
    initMobileMenu();
    initHeaderScroll();
    initScrollSpy();
    initCustomWaveformPlayer(); // Master Waveform Audio Deck
    initMusicCatalog(); // Dynamic Track Catalog
    initVideoPlaylist(); // Dynamic YouTube Catalog
    initCommunityReviews(); // Dynamic SoundCloud Fan Reviews & Community Vibes
    initNewsFeed();
    initBioAccordion(); // Expandable Bio Drawer
    initContactForms();
    initCookieBanner();
    initSpotlightModal(); // New Release Pop-up Modal
});

/* --------------------------------------------------
   Mobile Menu Toggle
-------------------------------------------------- */
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('open');
        navMenu.classList.toggle('open');
        // Prevent body scrolling when menu is open
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            navMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* --------------------------------------------------
   Sticky Header on Scroll
-------------------------------------------------- */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* --------------------------------------------------
   Scroll Spy (Active Navigation Links)
-------------------------------------------------- */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 100; // Offset for sticky header

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

/* --------------------------------------------------
   YouTube Video Playlist & Dynamic Catalog
-------------------------------------------------- */
function initVideoPlaylist() {
    const ytPlayer = document.getElementById('main-yt-player');
    const scrollContainer = document.querySelector('.video-playlist-scroll');
    const watchBtn = document.getElementById('watch-on-yt-btn');

    if (!ytPlayer) return;

    // Use YouTube channel catalog (youtubeCatalog) in strict publication order
    const videosList = (typeof youtubeCatalog !== 'undefined' && youtubeCatalog.length > 0) 
        ? youtubeCatalog 
        : (typeof catalogVideos !== 'undefined' ? catalogVideos : []);

    if (videosList.length > 0) {
        const latestVideo = videosList[0];
        
        // Preload latest YouTube video into main player at startup
        if (latestVideo.id) {
            ytPlayer.src = `https://www.youtube-nocookie.com/embed/${latestVideo.id}`;
            if (watchBtn) {
                watchBtn.href = `https://www.youtube.com/watch?v=${latestVideo.id}`;
            }
        }

        if (scrollContainer) {
            let html = '';
            videosList.forEach((video, index) => {
                const isActive = index === 0 ? 'active' : '';
                const badgeType = video.genre || (index === 0 ? 'OFFICIAL' : (video.title.toLowerCase().includes('mix') ? 'MIX' : 'RELEASE'));
                const badgeClass = index === 0 ? 'badge-red' : (index % 3 === 1 ? 'badge-cyan' : (index % 3 === 2 ? 'badge-gold' : 'badge-orange'));
                const thumbSrc = video.thumb || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                
                html += `
                    <div class="video-thumb-card ${isActive}" data-video-id="${video.id}">
                        <div class="video-thumb-img" style="background-image: url('${thumbSrc}')">
                            <span class="play-overlay"><i class="fa-solid fa-play"></i></span>
                        </div>
                        <div class="video-thumb-info">
                            <div class="video-card-header">
                                <h4>${video.title}</h4>
                                <span class="video-type-badge ${badgeClass}">${badgeType}</span>
                            </div>
                            <p>${video.published}</p>
                        </div>
                    </div>
                `;
            });
            scrollContainer.innerHTML = html;
        }
    }

    const thumbCards = document.querySelectorAll('.video-thumb-card');
    if (thumbCards.length === 0) return;

    thumbCards.forEach(card => {
        card.addEventListener('click', () => {
            // Set active class
            thumbCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Switch Video
            const videoId = card.getAttribute('data-video-id');
            if (videoId) {
                ytPlayer.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
                
                // Update direct link
                if (watchBtn) {
                    watchBtn.href = `https://www.youtube.com/watch?v=${videoId}`;
                }
                
                // Smooth auto-scroll to the main video player
                const mainVideoContainer = document.querySelector('.main-video-container');
                if (mainVideoContainer) {
                    const headerOffset = 90;
                    const elementPosition = mainVideoContainer.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Initialize Collapsible Video Accordion Toggle
    const toggleVideoBtn = document.getElementById('btn-toggle-videos');
    const txtVideoLabel = document.getElementById('txt-expand-videos');
    
    if (toggleVideoBtn && scrollContainer) {
        toggleVideoBtn.addEventListener('click', () => {
            scrollContainer.classList.toggle('expanded');
            toggleVideoBtn.classList.toggle('active');
            
            const isExpanded = scrollContainer.classList.contains('expanded');
            const lang = currentLang || 'it';
            
            if (txtVideoLabel) {
                if (isExpanded) {
                    txtVideoLabel.textContent = (translations[lang] && translations[lang].video_collapse_catalog) || "MOSTRA MENO";
                } else {
                    txtVideoLabel.textContent = (translations[lang] && translations[lang].video_expand_catalog) || "MOSTRA TOP 20 VIDEO";
                }
            }
        });
    }
}

/* --------------------------------------------------
   Dynamic Music Track Catalog Rendering
-------------------------------------------------- */
function initMusicCatalog() {
    const tracksContainer = document.querySelector('.tracks-list');
    if (!tracksContainer) return;

    const tracksList = (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) 
        ? soundCloudCatalog 
        : (typeof catalogVideos !== 'undefined' ? catalogVideos : []);

    if (tracksList.length > 0) {
        let html = '';
        tracksList.forEach((track, index) => {
            const num = (index + 1).toString().padStart(2, '0');
            const badgeClass = index % 3 === 0 ? 'sc-badge' : (index % 3 === 1 ? 'yt-badge' : 'cyan-badge');
            
            // Build dynamic platform icons based on actual availability
            let iconsHtml = '';
            if (track.sc_url) {
                iconsHtml += `<a href="${track.sc_url}" target="_blank" class="track-icon sc-hover" title="Ascolta su SoundCloud" onclick="event.stopPropagation();"><i class="fa-brands fa-soundcloud"></i></a>`;
            }
            if (track.yt_url) {
                iconsHtml += `<a href="${track.yt_url}" target="_blank" class="track-icon yt-hover" title="Guarda su YouTube" onclick="event.stopPropagation();"><i class="fa-brands fa-youtube"></i></a>`;
            }

            html += `
                <div class="track-card" data-track-index="${index}" style="cursor: pointer;">
                    <div class="track-info">
                        <span class="track-number">${num}</span>
                        <img src="${track.thumb}" alt="${track.title}" class="track-thumb-img">
                        <div>
                            <h4>${track.title}</h4>
                            <p><span class="genre-badge ${badgeClass}">${track.genre || 'Official'}</span> • ${track.published}</p>
                        </div>
                    </div>
                    <div class="track-links">
                        ${iconsHtml}
                    </div>
                </div>
            `;
        });
        tracksContainer.innerHTML = html;

        // Add click listener to load into Waveform Deck
        const cards = tracksContainer.querySelectorAll('.track-card');
        cards.forEach((card, idx) => {
            card.addEventListener('click', () => {
                if (typeof window.loadTrackIntoWaveform === 'function') {
                    window.loadTrackIntoWaveform(tracksList[idx], idx);
                }
            });
        });

        // Initialize Collapsible Astuccio / Accordion Toggle
        const toggleBtn = document.getElementById('btn-toggle-catalog');
        const txtLabel = document.getElementById('txt-expand-catalog');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                tracksContainer.classList.toggle('expanded');
                toggleBtn.classList.toggle('active');
                
                const isExpanded = tracksContainer.classList.contains('expanded');
                const lang = currentLang || 'it';
                
                if (txtLabel) {
                    if (isExpanded) {
                        txtLabel.textContent = (translations[lang] && translations[lang].music_collapse_catalog) || "MOSTRA MENO";
                    } else {
                        txtLabel.textContent = (translations[lang] && translations[lang].music_expand_catalog) || "MOSTRA TOP 20";
                    }
                }
            });
        }
    }
}

/* --------------------------------------------------
   Interactive Custom Waveform Master Deck Player (Official YouTube Engine)
-------------------------------------------------- */
function initCustomWaveformPlayer() {
    const deck = document.getElementById('waveform-master-deck');
    const barsGrid = document.getElementById('waveform-bars-grid');
    const container = document.getElementById('waveform-container');
    const scrubber = document.getElementById('waveform-scrubber');
    const hoverInfo = document.getElementById('waveform-hover-info');
    const ytAudioIframe = document.getElementById('waveform-yt-audio');
    const volSlider = document.getElementById('wf-vol-range');

    if (!deck || !barsGrid) return;

    const playIcon = document.getElementById('wf-play-icon');
    const btnPlay = document.getElementById('wf-btn-play');
    const btnPrev = document.getElementById('wf-btn-prev');
    const btnNext = document.getElementById('wf-btn-next');
    const discGlow = document.querySelector('.deck-thumb-box');
    const beacon = document.getElementById('wf-pulse-beacon');
    const statusText = document.getElementById('wf-status-text');
    const currentTimeEl = document.getElementById('wf-current-time');
    const totalTimeEl = document.getElementById('wf-total-time');

    let isPlaying = false;
    let progressPercent = 0;
    let activeTrackIndex = 0;
    let playInterval = null;
    let durationSeconds = 320; // 5m 20s
    let currentSeconds = 0;

    function sendYtCommand(func, args) {
        if (ytAudioIframe && ytAudioIframe.contentWindow) {
            ytAudioIframe.contentWindow.postMessage(JSON.stringify({
                'event': 'command',
                'func': func,
                'args': args || []
            }), '*');
        }
    }

    if (volSlider) {
        volSlider.addEventListener('input', (e) => {
            const volVal = parseInt(e.target.value);
            sendYtCommand('setVolume', [volVal]);
        });
    }

    // Generate 56 frequency bars
    const totalBars = 56;
    let barsData = [];
    barsGrid.innerHTML = '';

    for (let i = 0; i < totalBars; i++) {
        const height = Math.floor(18 + Math.sin(i * 0.45) * 35 + Math.cos(i * 0.2) * 25 + (i % 5) * 4);
        const clampedHeight = Math.max(15, Math.min(95, height));
        barsData.push(clampedHeight);

        const bar = document.createElement('div');
        bar.className = 'wf-bar';
        bar.style.height = clampedHeight + '%';
        barsGrid.appendChild(bar);
    }

    const barEls = barsGrid.querySelectorAll('.wf-bar');

    function updateWaveformDisplay() {
        const activeCount = Math.floor((progressPercent / 100) * totalBars);
        barEls.forEach((bar, idx) => {
            if (idx <= activeCount) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
        if (scrubber) scrubber.style.left = progressPercent + '%';

        currentSeconds = Math.floor(durationSeconds * (progressPercent / 100));
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentSeconds);
        if (totalTimeEl) totalTimeEl.textContent = formatTime(durationSeconds);
    }

    function formatTime(sec) {
        if (isNaN(sec)) return "00:00";
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function togglePlay(forceState) {
        isPlaying = forceState !== undefined ? forceState : !isPlaying;

        if (isPlaying) {
            if (playIcon) playIcon.className = 'fa-solid fa-pause';
            if (discGlow) discGlow.classList.add('playing');
            if (beacon) beacon.classList.add('active');
            if (statusText) statusText.textContent = 'PLAYING';

            // Send command to play Project Dee's official video audio
            sendYtCommand('playVideo');

            // Start smooth frequency bar animation and progress timer
            if (playInterval) clearInterval(playInterval);
            playInterval = setInterval(() => {
                progressPercent += 0.2;
                if (progressPercent >= 100) {
                    progressPercent = 0;
                    togglePlay(false);
                }
                barEls.forEach((bar, i) => {
                    if (Math.random() > 0.6) {
                        const newH = Math.max(15, Math.min(98, barsData[i] + (Math.random() * 20 - 10)));
                        bar.style.height = newH + '%';
                    }
                });
                updateWaveformDisplay();
            }, 200);

        } else {
            if (playIcon) playIcon.className = 'fa-solid fa-play';
            if (discGlow) discGlow.classList.remove('playing');
            if (beacon) beacon.classList.remove('active');
            if (statusText) statusText.textContent = 'PAUSED';
            
            // Send command to pause Project Dee's video audio
            sendYtCommand('pauseVideo');
            if (playInterval) clearInterval(playInterval);
        }
    }

    if (btnPlay) {
        btnPlay.addEventListener('click', () => togglePlay());
    }

    // Scrubber click & hover
    if (container) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const posX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const hoverPct = posX / rect.width;
            const targetSec = durationSeconds * hoverPct;
            
            if (hoverInfo) {
                hoverInfo.style.left = (hoverPct * 100) + '%';
                hoverInfo.textContent = formatTime(targetSec);
            }
        });

        container.addEventListener('click', (e) => {
            const rect = container.getBoundingClientRect();
            const posX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            progressPercent = (posX / rect.width) * 100;
            const targetSec = Math.floor(durationSeconds * (progressPercent / 100));
            
            sendYtCommand('seekTo', [targetSec, true]);
            updateWaveformDisplay();
            if (!isPlaying) togglePlay(true);
        });
    }

    // Track Selection linkage from Track Catalog Cards
    window.loadTrackIntoWaveform = function(trackData, index) {
        activeTrackIndex = index;
        const titleEl = document.getElementById('wf-track-title');
        const coverEl = document.getElementById('wf-cover-img');
        const scLink = document.getElementById('wf-link-sc');
        const ytLink = document.getElementById('wf-link-yt');
        const genreBadge = document.getElementById('wf-genre-badge');
        const customDeck = document.getElementById('waveform-master-deck');
        const scDeck = document.getElementById('sc-embed-deck');
        const scIframe = document.getElementById('sc-widget-iframe');
        const ytAudioIframe = document.getElementById('waveform-yt-audio');

        if (titleEl) titleEl.textContent = trackData.title;
        if (coverEl && trackData.thumb) coverEl.src = trackData.thumb;
        
        if (scLink) {
            if (trackData.sc_url) {
                scLink.href = trackData.sc_url;
                scLink.style.display = 'inline-flex';
            } else {
                scLink.style.display = 'none';
            }
        }
        
        if (ytLink) {
            if (trackData.yt_url) {
                ytLink.href = trackData.yt_url;
                ytLink.style.display = 'inline-flex';
            } else {
                ytLink.style.display = 'none';
            }
        }
        
        if (genreBadge) genreBadge.textContent = trackData.genre || 'Official Release';

        // Check if this is a SoundCloud track or YouTube track
        if (trackData.sc_url) {
            // Use Official SoundCloud Player Deck for 100% true audio & volume
            if (customDeck) customDeck.style.display = 'none';
            if (scDeck) {
                scDeck.style.display = 'block';
                if (scIframe) {
                    const encodedUrl = encodeURIComponent(trackData.sc_url);
                    scIframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
                }
            }
        } else if (trackData.id) {
            // Use Master Custom Waveform Deck with YouTube Engine
            if (scDeck) scDeck.style.display = 'none';
            if (customDeck) customDeck.style.display = 'block';
            if (ytAudioIframe) {
                ytAudioIframe.src = `https://www.youtube-nocookie.com/embed/${trackData.id}?enablejsapi=1&autoplay=1`;
            }
            progressPercent = 0;
            updateWaveformDisplay();
            togglePlay(true);
        }

        const musicSection = document.getElementById('music');
        if (musicSection) {
            musicSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Prev / Next Buttons
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            const trackList = (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) ? soundCloudCatalog : catalogVideos;
            if (trackList && trackList.length > 0) {
                activeTrackIndex = (activeTrackIndex - 1 + trackList.length) % trackList.length;
                window.loadTrackIntoWaveform(trackList[activeTrackIndex], activeTrackIndex);
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const trackList = (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) ? soundCloudCatalog : catalogVideos;
            if (trackList && trackList.length > 0) {
                activeTrackIndex = (activeTrackIndex + 1) % trackList.length;
                window.loadTrackIntoWaveform(trackList[activeTrackIndex], activeTrackIndex);
            }
        });
    }

    // Preload latest track from SoundCloud catalog automatically at startup
    if (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) {
        const latestTrack = soundCloudCatalog[0];
        activeTrackIndex = 0;
        const titleEl = document.getElementById('wf-track-title');
        const coverEl = document.getElementById('wf-cover-img');
        const scLink = document.getElementById('wf-link-sc');
        const ytLink = document.getElementById('wf-link-yt');
        const genreBadge = document.getElementById('wf-genre-badge');

        if (titleEl) titleEl.textContent = latestTrack.title;
        if (coverEl && latestTrack.thumb) coverEl.src = latestTrack.thumb;
        if (scLink) scLink.href = latestTrack.sc_url || 'https://soundcloud.com/project_d2025';
        if (ytLink && latestTrack.yt_url) ytLink.href = latestTrack.yt_url;
        if (genreBadge) genreBadge.textContent = latestTrack.genre || 'Official Release';

        // Preload track stream into visible SoundCloud Player Deck without forced autoplay
        const scIframe = document.getElementById('sc-widget-iframe');
        if (scIframe && latestTrack.sc_url) {
            const encodedUrl = encodeURIComponent(latestTrack.sc_url);
            scIframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
        }
        if (ytAudioIframe && latestTrack.sc_url) {
            const encodedUrl = encodeURIComponent(latestTrack.sc_url);
            ytAudioIframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
        }
    }

    // Initial display
    updateWaveformDisplay();
}

/* --------------------------------------------------
   Community Vibes & SoundCloud Fan Reviews Rendering
-------------------------------------------------- */
function initCommunityReviews() {
    const reviewsContainer = document.getElementById('reviews-grid');
    const filtersContainer = document.getElementById('community-filters');
    if (!reviewsContainer || typeof communityReviews === 'undefined' || communityReviews.length === 0) return;

    // Expose render trigger for language changes
    window.triggerCommunityRender = () => {
        const activeBtn = filtersContainer ? filtersContainer.querySelector('.comm-filter-btn.active') : null;
        const currentFilter = activeBtn ? activeBtn.getAttribute('data-track') : 'ALL';
        renderReviews(currentFilter);
    };

    // Build dynamic track filter pills
    if (filtersContainer) {
        const uniqueTracks = [];
        communityReviews.forEach(r => {
            if (r.trackTitle && !uniqueTracks.includes(r.trackTitle)) {
                uniqueTracks.push(r.trackTitle);
            }
        });

        // Top 8 tracks for filter pills
        const topFilterTracks = uniqueTracks.slice(0, 8);
        const lang = (typeof currentLang !== 'undefined' ? currentLang : 'it');
        let filtersHtml = `<button class="comm-filter-btn active" data-track="ALL" data-translate="community_filter_all">${(translations[lang] && translations[lang].community_filter_all) || "Tutte le Recensioni"}</button>`;
        
        topFilterTracks.forEach(t => {
            const shortName = t.split(' - ')[0].replace(' (Original Mix)', '').replace(' (Mix)', '');
            filtersHtml += `<button class="comm-filter-btn" data-track="${encodeURIComponent(t)}">${shortName}</button>`;
        });
        filtersContainer.innerHTML = filtersHtml;

        const filterBtns = filtersContainer.querySelectorAll('.comm-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-track');
                renderReviews(filterValue);
            });
        });
    }

    function renderReviews(filterTrack) {
        const lang = (typeof currentLang !== 'undefined' ? currentLang : 'it');
        const listenText = (translations[lang] && translations[lang].community_listen_track) || "Ascolta Traccia";

        let filtered = communityReviews;
        if (filterTrack && filterTrack !== 'ALL') {
            const decoded = decodeURIComponent(filterTrack);
            filtered = communityReviews.filter(r => r.trackTitle === decoded);
        }

        if (filtered.length === 0) {
            reviewsContainer.innerHTML = `<p style="color:#a0a5b5; text-align:center; grid-column: 1/-1; padding: 2rem 0;">Nessuna recensione trovata per questa traccia.</p>`;
            return;
        }

        let html = '';
        filtered.forEach(rev => {
            const avatarUrl = rev.avatar || 'https://a-v2.sndcdn.com/assets/images/default/avatar.png';
            const shortTrackName = rev.trackTitle ? rev.trackTitle.split(' - ')[0] : 'Project Dee Track';
            const safeComment = rev.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            html += `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-avatar-box">
                            <img src="${avatarUrl}" alt="${rev.author}" class="review-avatar-img" loading="lazy" onerror="this.src='https://a-v2.sndcdn.com/assets/images/default/avatar.png'">
                            <span class="review-sc-badge-icon"><i class="fa-brands fa-soundcloud"></i></span>
                        </div>
                        <div class="review-user-info">
                            <h4 class="review-author-name" title="${rev.author}">${rev.author}</h4>
                            <span class="review-date">${rev.date || 'SoundCloud Fan'}</span>
                        </div>
                        <div class="review-quote-mark"><i class="fa-solid fa-quote-right"></i></div>
                    </div>
                    <div class="review-body">
                        "${safeComment}"
                    </div>
                    <div class="review-footer">
                        <a href="${rev.trackUrl}" target="_blank" rel="noopener noreferrer" class="review-track-badge" title="Ascolta ${rev.trackTitle} su SoundCloud">
                            <i class="fa-solid fa-music"></i>
                            <span>${shortTrackName}</span>
                        </a>
                        <a href="${rev.trackUrl}" target="_blank" rel="noopener noreferrer" class="review-sc-link-btn" title="Apri su SoundCloud">
                            <span>${listenText}</span>
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        reviewsContainer.innerHTML = html;
    }

    // Initial render all
    renderReviews('ALL');
}

/* --------------------------------------------------
   Dynamic News Feed & Category Filter
-------------------------------------------------- */
function initNewsFeed() {
    const newsGrid = document.getElementById('news-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!newsGrid) return;

    // Use global newsData from js/news-data.js (avoids CORS issues on file:// protocol)
    let feedData = [];
    if (typeof newsData !== 'undefined') {
        feedData = newsData;
    } else {
        console.error('newsData is not defined. Ensure js/news-data.js is loaded.');
        const errMsg = translations[activeLang] ? translations[activeLang].news_error : 'Impossibile caricare le notizie.';
        newsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--yt-red); margin-bottom: 1rem;"></i>
            <p>${errMsg}</p>
        </div>`;
        return;
    }

    // Expose local reference for global language switching trigger
    window.triggerNewsRender = (filter, lang) => {
        renderNews(filter, lang);
    };

    // Render Function
    function renderNews(filter = 'ALL', lang = activeLang) {
        newsGrid.innerHTML = '';
        
        const filteredNews = filter === 'ALL' 
            ? feedData 
            : feedData.filter(item => item.category.toUpperCase() === filter.toUpperCase());

        if (filteredNews.length === 0) {
            const emptyMsg = translations[lang] ? translations[lang].news_empty : 'Nessuna notizia.';
            newsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">
                <p>${emptyMsg}</p>
            </div>`;
            return;
        }

        filteredNews.forEach(news => {
            const card = document.createElement('article');
            card.className = 'news-card';
            
            // Get proper badge class based on category
            const badgeClass = `cat-${news.category.toLowerCase()}`;
            
            // Translated title, summary and readmore
            const newsTitle = news['title_' + lang] || news.title_en || news.title;
            const newsSummary = news['summary_' + lang] || news.summary_en || news.summary;
            const readMoreText = translations[lang] ? translations[lang].news_readmore : 'Leggi di più';
            
            card.innerHTML = `
                <div class="news-img-box">
                    <img src="${news.image}" alt="${newsTitle}" class="news-img" loading="lazy">
                    <span class="news-cat-badge ${badgeClass}">${news.category}</span>
                </div>
                <div class="news-body">
                    <span class="news-date">${news.date}</span>
                    <h3>${newsTitle}</h3>
                    <p>${newsSummary}</p>
                    <a href="#" class="news-readmore" data-id="${news.id}">${readMoreText} <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            `;
            
            newsGrid.appendChild(card);
        });

        // Add event listeners to "Leggi di più" links
        const readMoreBtns = newsGrid.querySelectorAll('.news-readmore');
        readMoreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const newsId = parseInt(btn.getAttribute('data-id'));
                const article = feedData.find(item => item.id === newsId);
                if (article) {
                    openNewsModal(article);
                }
            });
        });
    }

    // Event listener for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const category = button.getAttribute('data-category');
            renderNews(category, activeLang);
        });
    });

    // Initial render
    renderNews(document.querySelector('.filter-btn.active').getAttribute('data-category') || 'ALL', activeLang);
}

/* --------------------------------------------------
   News Detailed Modal Popup (Minimal Design)
-------------------------------------------------- */
function openNewsModal(article) {
    // Get translated modal title/summary/content
    const modalTitle = article['title_' + activeLang] || article.title_en || article.title;
    const modalSummary = article['summary_' + activeLang] || article.summary_en || article.summary;
    const modalContent = article['content_' + activeLang] || article.content_en || article.content;

    // Create modal element
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(3, 3, 5, 0.9)';
    modal.style.backdropFilter = 'blur(15px)';
    modal.style.webkitBackdropFilter = 'blur(15px)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.padding = '1.5rem';
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';

    const modalBody = `
        <div style="background-color: var(--bg-base); border: 1px solid var(--border-color); border-radius: 8px; max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.8); position: relative;">
            <button id="modal-close" style="position: absolute; top: 1.25rem; right: 1.25rem; background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 1.1rem; transition: var(--transition-quick);">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div style="width: 100%; height: 260px; background-image: url('${article.image}'); background-size: cover; background-position: center; position: relative;">
                <div style="position: absolute; bottom: 1.5rem; left: 1.5rem; z-index: 2;">
                    <span class="news-cat-badge cat-${article.category.toLowerCase()}" style="position: static; display: inline-block;">${article.category}</span>
                </div>
                <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(180deg, transparent 40%, rgba(6,6,10,0.95) 100%);"></div>
            </div>
            <div style="padding: 2rem;">
                <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">${article.date}</span>
                <h2 style="font-family: var(--font-titles); font-size: 1.7rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.3;">${modalTitle}</h2>
                <div style="font-family: var(--font-body); font-size: 1rem; color: var(--text-secondary); line-height: 1.7; font-weight: 300;">
                    <p style="margin-bottom: 1rem; font-weight: 400; color: #fff;">${modalSummary}</p>
                    <p>${modalContent}</p>
                    ${article.link ? `
                    <p style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: flex-end;">
                        <a href="${article.link}" target="_blank" style="color: var(--cyber-cyan); text-decoration: none; font-weight: 500; font-family: var(--font-titles); font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: var(--transition-quick);" onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color='var(--cyber-cyan)'">
                            ${translations[activeLang] ? translations[activeLang].news_readoriginal : 'Read original article'} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    modal.innerHTML = modalBody;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Fade in
    setTimeout(() => { modal.style.opacity = '1'; }, 50);

    // Close logic
    const closeBtn = modal.querySelector('#modal-close');
    
    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close button hover
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.borderColor = 'var(--cyber-cyan)';
        closeBtn.style.color = 'var(--cyber-cyan)';
        closeBtn.style.transform = 'scale(1.05)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.borderColor = 'var(--border-color)';
        closeBtn.style.color = '#fff';
        closeBtn.style.transform = 'scale(1)';
    });
}

/* --------------------------------------------------
   Contact Form Simulation
-------------------------------------------------- */
function initContactForms() {
    const contactForm = document.getElementById('contact-form');

    // Booking & Contact Form
    if (contactForm) {
        const feedback = document.getElementById('contact-message');
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulation feedback visual spinner
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            
            const sendingText = (activeLang === 'it') ? 'Invio in corso...' : 'Sending...';
            submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${sendingText}`;
            
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
                feedback.className = 'form-feedback success';
                
                const successMsg = translations[activeLang] 
                    ? translations[activeLang].feedback_contact_success 
                    : 'Messaggio inviato con successo!';
                feedback.innerHTML = successMsg;
                
                // Clear inputs
                contactForm.reset();
                
                // Hide message after 5 seconds
                setTimeout(() => { feedback.style.display = 'none'; }, 5000);
            }, 1200);
        });
    }
}

/* --------------------------------------------------
   GDPR Cookie Consent Management
-------------------------------------------------- */
function initCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');
    const openSettings = document.getElementById('open-cookie-settings');

    if (!banner || !acceptBtn || !rejectBtn) return;

    // Check storage state
    const consent = localStorage.getItem('prjdee_cookie_consent');

    if (!consent) {
        // Show banner after 1.5 seconds delay
        setTimeout(() => {
            banner.classList.add('show');
        }, 1500);
    }

    // Accept Action
    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('prjdee_cookie_consent', 'accepted');
        banner.classList.remove('show');
    });

    // Reject Action
    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('prjdee_cookie_consent', 'rejected');
        banner.classList.remove('show');
    });

    // Open/Reset Settings from Footer
    if (openSettings) {
        openSettings.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('prjdee_cookie_consent');
            banner.classList.add('show');
            // Scroll to bottom helper
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
    }
}

/* --------------------------------------------------
   Multilingual Language Selection & Translations
-------------------------------------------------- */
let activeLang = localStorage.getItem('prjdee_lang') || 'it';

function initLanguageSelector() {
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const langOpts = document.querySelectorAll('.lang-opt');

    if (!langBtn || !langDropdown) return;

    // Toggle Dropdown
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });

    // Close on click outside
    document.addEventListener('click', () => {
        langDropdown.classList.remove('show');
    });

    // Option clicks
    langOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = opt.getAttribute('data-lang');
            setLanguage(lang);
            langDropdown.classList.remove('show');
        });
    });

    // Apply activeLang initially
    setLanguage(activeLang);
}

function setLanguage(lang) {
    activeLang = lang;
    localStorage.setItem('prjdee_lang', lang);
    
    // Update active lang code text in button
    const activeLangSpan = document.getElementById('active-lang');
    if (activeLangSpan) activeLangSpan.textContent = lang.toUpperCase();

    // Toggle active classes on options
    const langOpts = document.querySelectorAll('.lang-opt');
    langOpts.forEach(opt => {
        if (opt.getAttribute('data-lang') === lang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // Translate DOM elements
    const translateElements = document.querySelectorAll('[data-translate]');
    translateElements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Translate placeholders
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Notify News feed to re-render in the new language
    if (typeof window.triggerNewsRender === 'function') {
        const activeCat = document.querySelector('.filter-btn.active');
        window.triggerNewsRender(activeCat ? activeCat.getAttribute('data-category') : 'ALL', lang);
    }

    // Notify Community feed to re-render in the new language
    if (typeof window.triggerCommunityRender === 'function') {
        window.triggerCommunityRender();
    }
}

/* --------------------------------------------------
   Hero Logo Interactive Scroll Effect
-------------------------------------------------- */
function initHeroLogoScroll() {
    const logoContainer = document.getElementById('scrolling-logo');
    if (!logoContainer) return;

    // Apply scroll listener
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const fadeStart = 0;
        const fadeEnd = window.innerHeight * 0.7; // Transition over 70% of viewport height
        
        let ratio = (scrollY - fadeStart) / (fadeEnd - fadeStart);
        ratio = Math.max(0, Math.min(1, ratio)); // Clamp between 0 and 1
        
        // Target values: fade to 12% opacity, scale down to 68%
        const opacity = 1.0 - (ratio * 0.88);
        const scale = 1.0 - (ratio * 0.32);
        
        // Update styling
        logoContainer.style.opacity = opacity;
        logoContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        // Interactivity handling based on overlay visibility
        if (ratio > 0.15) {
            logoContainer.style.pointerEvents = 'none';
            logoContainer.style.zIndex = '0'; // Sinks into background
        } else {
            logoContainer.style.pointerEvents = 'auto';
            logoContainer.style.zIndex = '1'; // Re-emerges in foreground
        }
    });
}

/* --------------------------------------------------
   Collapsible Bio Accordion Logic
-------------------------------------------------- */
function initBioAccordion() {
    const bioToggle = document.getElementById('bio-toggle-btn');
    const bioContent = document.getElementById('bio-collapse-content');
    const bioChevron = document.getElementById('bio-toggle-chevron');

    if (!bioToggle || !bioContent) return;

    bioToggle.addEventListener('click', () => {
        const isExpanded = bioToggle.classList.contains('expanded');
        
        if (isExpanded) {
            bioToggle.classList.remove('expanded');
            bioContent.style.maxHeight = '0px';
            bioContent.style.opacity = '0';
            if (bioChevron) {
                bioChevron.style.transform = 'rotate(0deg)';
            }
        } else {
            bioToggle.classList.add('expanded');
            // Calculate actual height dynamically to handle translations and responsiveness
            bioContent.style.maxHeight = bioContent.scrollHeight + 'px';
            bioContent.style.opacity = '1';
            if (bioChevron) {
                bioChevron.style.transform = 'rotate(180deg)';
            }
            
            // Smooth scroll to align the bio section header nicely in the viewport
            setTimeout(() => {
                bioToggle.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    });

    // Recalculate max-height on window resize if expanded
    window.addEventListener('resize', () => {
        if (bioToggle.classList.contains('expanded')) {
            bioContent.style.maxHeight = bioContent.scrollHeight + 'px';
        }
    });
}

/* --------------------------------------------------
   New Release Spotlight Pop-up Modal (With 3s Auto-Close Timer)
-------------------------------------------------- */
function initSpotlightModal() {
    const modal = document.getElementById('spotlight-modal');
    const closeBtn = document.getElementById('spotlight-close');
    const playSiteBtn = document.getElementById('spotlight-play-site');
    const scLinkEl = document.getElementById('spotlight-sc-link');
    const timerBar = document.getElementById('spotlight-timer-bar');
    
    if (!modal) return;
    
    // Check if session storage already dismissed
    if (sessionStorage.getItem('prj_dee_spotlight_dismissed') === 'true') {
        return;
    }
    
    // Populate latest track info automatically from soundCloudCatalog[0]
    if (typeof soundCloudCatalog !== 'undefined' && soundCloudCatalog.length > 0) {
        const latest = soundCloudCatalog[0];
        const titleEl = document.getElementById('spotlight-title');
        const coverEl = document.getElementById('spotlight-cover-img');
        const genreEl = document.getElementById('spotlight-genre');
        const dateEl = document.getElementById('spotlight-date');
        
        if (titleEl) titleEl.textContent = latest.title;
        if (coverEl && latest.thumb) coverEl.src = latest.thumb;
        if (scLinkEl && latest.sc_url) scLinkEl.href = latest.sc_url;
        if (genreEl) genreEl.textContent = latest.genre || 'Melodic Techno';
        if (dateEl) dateEl.textContent = latest.published || '';
    }
    
    let autoCloseTimer = null;

    const closeModal = () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        modal.classList.remove('active');
        sessionStorage.setItem('prj_dee_spotlight_dismissed', 'true');
    };

    // Show modal after 1.2s delay for maximum impact
    setTimeout(() => {
        modal.classList.add('active');
        
        // Start 3-second visual progress bar animation
        if (timerBar) {
            setTimeout(() => {
                timerBar.style.width = '100%';
            }, 50);
        }

        // Start 3-second auto-close timer
        autoCloseTimer = setTimeout(() => {
            closeModal();
        }, 3050);
    }, 1200);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (scLinkEl) {
        scLinkEl.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    if (playSiteBtn) {
        playSiteBtn.addEventListener('click', () => {
            closeModal();
            if (typeof window.loadTrackIntoWaveform === 'function' && typeof soundCloudCatalog !== 'undefined') {
                window.loadTrackIntoWaveform(soundCloudCatalog[0], 0);
            }
        });
    }
}
