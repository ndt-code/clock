import { UIUtils } from './utils.js';
import { app } from './context.js';

export class MusicPlayer {
    constructor() {
        this.ytPlayer = null;
        this.isOpen = false;
        this.currentVol = parseInt(localStorage.getItem('ytVol') || 100);
        this.queue = [];
        this.currIdx = -1;
        this.loopMode = 0;
        this.fetching = false;
        this.isVid = false;
        this.isDragging = false;
        this.ytTracker = null;
        this.titleQueue = [];
        this.isFetchingTitles = false;
        this.playerReady = false;
        this.apiInjecting = false;
        this.isShuffle = false;
        this.originalQueue = [];

        this.icL = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
        this.icLa = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
        this.icL1a = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.5 12.5L12 11v5"></path></svg>`;
        this.icV0 = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>`;
        this.icV1 = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;

        this.dom = {};
        this.initDOM();
        this.init();
    }

    initDOM() {
        this.dom.pnl = document.getElementById('music-panel');
        this.dom.bd = document.getElementById('music-backdrop');
        this.dom.url = document.getElementById('music-url');
        this.dom.bVid = document.getElementById('btn-toggle-yt-vid');
        this.dom.bLoop = document.getElementById('btn-loop-mode');
        this.dom.bClear = document.getElementById('btn-clear-queue');
        this.dom.bShuffle = document.getElementById('btn-shuffle-mode');
        this.dom.vol = document.getElementById('yt-volume');
        this.dom.tl = document.getElementById('yt-timeline');
        this.dom.pl = document.getElementById('yt-playlist-ui');
        this.dom.tCur = document.getElementById('yt-time-current');
        this.dom.tTot = document.getElementById('yt-time-total');
        this.dom.stat = document.getElementById('yt-status');
        this.dom.iPlay = document.getElementById('icon-play');
        this.dom.iPause = document.getElementById('icon-pause');
        this.dom.qCnt = document.getElementById('queue-count');
        this.dom.warn = document.getElementById('playlist-warning');
        this.dom.gCon = document.getElementById('yt-global-container');
        this.dom.mVid = document.getElementById('mobile-vid-placeholder');
        this.dom.mTop = document.getElementById('media-top-section');
    }

    init() {
        if (this.dom.bClear) {
            this.dom.bClear.onclick = () => {
                this.queue = [];
                this.titleQueue = [];
                this.currIdx = -1;
                this.isShuffle = false;
                this.originalQueue = [];
                if (this.dom.warn) this.dom.warn.classList.add('hidden');
                if (this.ytPlayer && this.ytPlayer.stopVideo) this.ytPlayer.stopVideo();
                if (this.isVid) { this.isVid = false; this.updateVidUI(); }
                if (this.dom.tl) { this.dom.tl.value = 0; this.dom.tl.style.setProperty('--percent', '0%'); this.dom.tl.classList.add('pointer-events-none'); }
                if (this.dom.tCur) this.dom.tCur.innerText = "0:00";
                if (this.dom.tTot) this.dom.tTot.innerText = "0:00";
                if (this.dom.iPlay) this.dom.iPlay.classList.remove('hidden');
                if (this.dom.iPause) this.dom.iPause.classList.add('hidden');
                if (this.dom.stat) this.dom.stat.innerText = "";
                this.stopTrk();
                this.render();
            };
        }

        document.getElementById('btn-toggle-music')?.addEventListener('click', e => { e.stopPropagation(); this.togglePanel(true); });
        document.getElementById('btn-music-mobile')?.addEventListener('click', e => { e.stopPropagation(); this.togglePanel(true); });
        document.getElementById('btn-close-music')?.addEventListener('click', () => this.togglePanel(false));
        document.getElementById('btn-load-music')?.addEventListener('click', () => this.load());
        document.getElementById('btn-yt-play')?.addEventListener('click', () => { if (this.queue.length > 0) this.playPause(); });
        document.getElementById('btn-yt-prev')?.addEventListener('click', () => { if (this.queue.length > 0 && this.currIdx > 0) this.playTrack(this.currIdx - 1); });
        document.getElementById('btn-yt-next')?.addEventListener('click', () => { if (this.queue.length > 0 && this.currIdx < this.queue.length - 1) this.playTrack(this.currIdx + 1); });
        document.getElementById('btn-yt-skip-b10')?.addEventListener('click', () => this.skip(-10));
        document.getElementById('btn-yt-skip-b5')?.addEventListener('click', () => this.skip(-5));
        document.getElementById('btn-yt-skip-f5')?.addEventListener('click', () => this.skip(5));
        document.getElementById('btn-yt-skip-f10')?.addEventListener('click', () => this.skip(10));

        if (this.dom.bShuffle) { this.dom.bShuffle.onclick = () => this.toggleShuffle(); }

        if (this.dom.vol) {
            this.dom.vol.value = this.currentVol;
            this.dom.vol.style.setProperty('--percent', this.currentVol + '%');
            this.dom.vol.oninput = e => { e.target.style.setProperty('--percent', e.target.value + '%'); if (this.ytPlayer) this.ytPlayer.setVolume(e.target.value); };
            this.dom.vol.onchange = e => { localStorage.setItem('ytVol', e.target.value); this.currentVol = e.target.value; };
        }

        if (this.dom.bLoop) {
            this.dom.bLoop.innerHTML = this.icL;
            this.dom.bLoop.onclick = () => {
                if (!this.queue.length) return;
                this.loopMode = (this.loopMode + 1) % 3;
                this.dom.bLoop.innerHTML = this.loopMode === 0 ? this.icL : (this.loopMode === 1 ? this.icLa : this.icL1a);
                this.dom.bLoop.classList.toggle('opacity-50', this.loopMode === 0);
                this.dom.bLoop.classList.toggle('opacity-100', this.loopMode !== 0);
            };
        }

        if (this.dom.bVid) {
            this.dom.bVid.innerHTML = this.icV0;
            this.dom.bVid.onclick = () => { if (!this.queue.length) return; this.isVid = !this.isVid; this.updateVidUI(); };
        }

        if (this.dom.tl) {
            this.dom.tl.onmousedown = () => this.isDragging = true;
            this.dom.tl.addEventListener('touchstart', () => this.isDragging = true, { passive: true });
            this.dom.tl.onchange = e => { this.isDragging = false; if (this.ytPlayer && this.ytPlayer.getDuration) this.ytPlayer.seekTo((e.target.value / 100) * this.ytPlayer.getDuration(), true); };
            this.dom.tl.oninput = e => { e.target.style.setProperty('--percent', e.target.value + '%'); if (this.ytPlayer && this.ytPlayer.getDuration && this.dom.tCur) this.dom.tCur.innerText = this.fmtTime((e.target.value / 100) * this.ytPlayer.getDuration()); };
        }

        document.addEventListener('click', e => {
            const p = e.composedPath(), act = (!this.dom.pnl.classList.contains('translate-y-[120%]') && window.innerWidth < 1000) || (!this.dom.pnl.classList.contains('md:translate-x-[120%]') && window.innerWidth >= 1000);
            if (!p.includes(this.dom.pnl) && !p.includes(document.getElementById('btn-toggle-music')) && !p.includes(document.getElementById('btn-music-mobile')) && act) {
                if (this.isVid && p.includes(this.dom.gCon)) return;
                if (this.isVid && window.innerWidth >= 1000) this.dom.bVid.click(); else this.togglePanel(false);
            }
        });

        if (this.dom.mVid) new ResizeObserver(() => { if (this.isVid) this.syncVid(); }).observe(this.dom.mVid);
        window.addEventListener('resize', () => { if (this.isVid) this.syncVid(); });
        window.addEventListener('orientationchange', () => { setTimeout(() => { if (this.isVid) this.syncVid(); }, 150); });

        if (this.dom.pl) {
            this.dom.pl.onclick = e => {
                const r = e.target.closest('.btn-remove-track');
                if (r) {
                    const i = parseInt(r.closest('li').dataset.index);
                    const removedTrack = this.queue.splice(i, 1)[0];
                    if (this.isShuffle) {
                        this.originalQueue = this.originalQueue.filter(t => t !== removedTrack);
                    }
                    if (this.currIdx === i) {
                        if (this.queue.length) {
                            this.currIdx = Math.min(this.currIdx, this.queue.length - 1);
                            this.syncAndPlay();
                        } else {
                            this.dom.bClear.click();
                        }
                    } else if (this.currIdx > i) {
                        this.currIdx--;
                    }
                    this.render(); return;
                }
                const t = e.target.closest('.track-info'); if (t) this.playTrack(parseInt(t.closest('li').dataset.index));
            };
            if (typeof Sortable !== 'undefined') {
                Sortable.create(this.dom.pl, {
                    animation: 150, delay: window.innerWidth < 1000 ? 200 : 0, delayOnTouchOnly: true, onEnd: (evt) => {
                        if (evt.oldIndex === evt.newIndex) return;
                        const m = this.queue.splice(evt.oldIndex, 1)[0];
                        this.queue.splice(evt.newIndex, 0, m);
                        if (this.currIdx === evt.oldIndex) this.currIdx = evt.newIndex;
                        else if (this.currIdx > evt.oldIndex && this.currIdx <= evt.newIndex) this.currIdx--;
                        else if (this.currIdx < evt.oldIndex && this.currIdx >= evt.newIndex) this.currIdx++;
                        this.render();
                    }
                });
            }
        }

        window.addEventListener('app:togglePlay', e => { if (this.isOpen && this.queue.length > 0 && this.ytPlayer && this.ytPlayer.getPlayerState() === 1) { this.ytPlayer.pauseVideo(); } });
        this.render();
    }

    initYT() {
        this.ytPlayer = new YT.Player('yt-player-container', {
            height: '100%', width: '100%', videoId: '', playerVars: { 'autoplay': 1, 'controls': 0, 'playsinline': 1, 'origin': window.location.origin },
            events: {
                'onReady': e => { this.playerReady = true; e.target.setVolume(this.currentVol); if (this.dom.tl) this.dom.tl.classList.remove('pointer-events-none'); },
                'onStateChange': e => this.onState(e),
                'onError': e => {
                    if (this.currIdx >= 0 && this.currIdx < this.queue.length) {
                        const badTrack = this.queue.splice(this.currIdx, 1)[0];
                        if (this.isShuffle) {
                            this.originalQueue = this.originalQueue.filter(t => t !== badTrack);
                        }
                        this.render();
                        if (this.queue.length > 0) {
                            if (this.currIdx >= this.queue.length) this.currIdx = 0;
                            setTimeout(() => {
                                this.syncAndPlay();
                            }, 800);
                        } else {
                            if (this.dom.bClear) this.dom.bClear.click();
                        }
                    }
                }
            }
        });
    }

    syncAndPlay() {
        if (!this.queue.length) {
            if (this.ytPlayer && this.ytPlayer.stopVideo) this.ytPlayer.stopVideo();
            return;
        }
        if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
            this.ytPlayer.loadVideoById(this.queue[this.currIdx].id, 0);
        }
        if (this.dom.tl) this.dom.tl.classList.remove('pointer-events-none');
        this.render();
    }

    toggleShuffle() {
        if (!this.queue.length) return;
        this.isShuffle = !this.isShuffle;

        if (this.isShuffle) {
            if (this.currIdx >= 0 && this.currIdx < this.queue.length) {
                let currentTrack = this.queue[this.currIdx];
                let remaining = this.queue.filter((_, idx) => idx !== this.currIdx);
                for (let i = remaining.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
                }
                this.queue = [currentTrack, ...remaining];
                this.currIdx = 0;
            } else {
                let shuffled = [...this.queue];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                this.queue = shuffled;
            }
        } else {
            let currentTrack = this.queue[this.currIdx];
            this.queue = [...this.originalQueue];
            if (currentTrack) {
                this.currIdx = this.queue.findIndex(t => t.id === currentTrack.id);
                if (this.currIdx === -1) this.currIdx = 0;
            }
        }
        this.render();
    }

    enqueueTitles(arr) {
        arr.forEach(q => { if (q.title === 'Loading...' || q.title.startsWith('Track ')) this.titleQueue.push(q); });
        if (!this.isFetchingTitles) this.processTitleQueue();
    }

    async processTitleQueue() {
        this.isFetchingTitles = true;
        while (this.titleQueue.length > 0) {
            let batch = this.titleQueue.splice(0, 5);
            let validBatch = batch.filter(q => this.queue.includes(q) || this.originalQueue.includes(q));

            if (validBatch.length > 0) {
                await Promise.all(validBatch.map(async (q) => {
                    let ok = false;
                    try {
                        let r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${q.id}`);
                        let d = await r.json();
                        if (d.title) { q.title = d.title; ok = true; }
                    } catch (e) { }

                    if (!ok) {
                        try {
                            let r2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + q.id + '&format=json')}`);
                            let d2 = await r2.json();
                            let yt = JSON.parse(d2.contents);
                            if (yt.title) { q.title = yt.title; ok = true; }
                        } catch (e2) { }
                    }
                    if (!ok) {
                        q.title = "Cannot load music title!";
                    }
                }));
                this.render();
            }
            if (this.titleQueue.length > 0) {
                await new Promise(res => setTimeout(res, 300));
            }
        }
        this.isFetchingTitles = false;
    }

    togglePanel(open) {
        this.isOpen = open;
        if (open) {
            if (!this.apiInjecting) {
                this.apiInjecting = true;
                if (typeof YT === 'undefined') {
                    const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
                    document.head.appendChild(tag);
                    window.onYouTubeIframeAPIReady = () => { window.ytApiReady = true; this.initYT(); };
                } else if (window.ytApiReady) { this.initYT(); }
            }
            if (app.globalCtrl) app.globalCtrl.toggleTodoSidebar(false);
            if (this.dom.pnl) this.dom.pnl.classList.remove('translate-y-[120%]', 'md:translate-x-[120%]');
            if (this.dom.bd) this.dom.bd.classList.remove('hidden');
            if (typeof UIUtils !== 'undefined') UIUtils.trapFocus('music-panel');
        }
        else {
            if (this.dom.pnl) this.dom.pnl.classList.add('translate-y-[120%]', 'md:translate-x-[120%]');
            if (this.dom.bd) this.dom.bd.classList.add('hidden');
            if (this.isVid) { this.isVid = false; this.updateVidUI(); }
        }
        this.animSync();
    }

    syncVid() {
        if (!this.isVid || !this.dom.mVid || !this.dom.gCon) return;
        const p = document.getElementById('yt-player-wrapper');
        if (!p) return;

        if (window.innerWidth < 1000) {
            const b = this.dom.mVid.getBoundingClientRect();
            this.dom.gCon.style.top = b.top + 'px';
            this.dom.gCon.style.left = b.left + 'px';
            this.dom.gCon.style.width = b.width + 'px';
            this.dom.gCon.style.height = b.height + 'px';
            this.dom.gCon.className = "fixed z-[210] pointer-events-none";
            p.style.maxWidth = '';
            p.style.maxHeight = '';
            p.className = "w-full h-full bg-black rounded-xl border-2 border-gray-600 shadow-lg overflow-hidden pointer-events-auto transition-none";
        } else {
            this.dom.gCon.style.top = '0px';
            this.dom.gCon.style.bottom = '0px';
            this.dom.gCon.style.left = '0px';
            this.dom.gCon.style.right = '400px';
            this.dom.gCon.style.width = 'auto';
            this.dom.gCon.style.height = 'auto';
            this.dom.gCon.className = "fixed z-[90] flex items-center justify-center p-4 md:p-8 pointer-events-none transition-opacity duration-300";
            p.style.maxWidth = "calc(100vw - 460px)";
            p.style.maxHeight = "85vh";
            p.className = "w-full aspect-video bg-black rounded-xl md:rounded-3xl border-2 md:border-4 border-black dark:border-white shadow-2xl overflow-hidden pointer-events-auto transition-none mx-auto my-auto";
        }
    }

    updateVidUI() {
        if (!this.dom.bVid || !this.dom.gCon || !this.dom.mTop || !this.dom.mVid || !this.dom.pnl) return;
        if (this.isVid) {
            this.dom.bVid.innerHTML = this.icV1;
            this.dom.bVid.classList.replace('opacity-50', 'opacity-100');
            this.dom.gCon.classList.remove('hidden');
            if (window.innerWidth < 1000) {
                this.dom.mTop.style.display = 'none';
                this.dom.mVid.classList.remove('hidden');
                this.dom.pnl.classList.add('music-fullscreen');
                this.dom.gCon.classList.remove('opacity-0');
            }
            else {
                this.dom.mTop.style.display = '';
                this.dom.mVid.classList.add('hidden');
                this.dom.pnl.classList.remove('music-fullscreen');
                setTimeout(() => this.dom.gCon.classList.remove('opacity-0'), 10);
            }
            this.syncVid();
        } else {
            this.dom.bVid.innerHTML = this.icV0;
            this.dom.bVid.classList.replace('opacity-100', 'opacity-50');
            this.dom.mTop.style.display = '';
            this.dom.mVid.classList.add('hidden');
            if (window.innerWidth < 1000) {
                this.dom.pnl.classList.remove('music-fullscreen');
                this.dom.gCon.classList.add('hidden', 'opacity-0');
            }
            else {
                this.dom.gCon.classList.add('opacity-0');
                setTimeout(() => this.dom.gCon.classList.add('hidden'), 300);
            }
        }
    }

    animSync() {
        if (!this.isVid) return;
        let s = Date.now();
        const f = () => {
            this.syncVid();
            if (Date.now() - s < 350) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }

    skip(s) {
        if (!this.queue.length || !this.ytPlayer || !this.ytPlayer.getCurrentTime) return;
        let t = this.ytPlayer.getCurrentTime() + s;
        this.ytPlayer.seekTo(Math.max(0, Math.min(t, this.ytPlayer.getDuration())), true);
    }

    fmtTime(sec) {
        sec = Math.round(sec);
        return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
    }

    load() {
        if (!this.dom.url) return;
        const u = this.dom.url.value.trim();
        if (!u) return;
        const pL = u.match(/[?&]list=([^#\&\?]+)/), pV = u.match(/(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)/);
        const lId = pL ? pL[1] : null, vId = (pV && pV[2].length === 11) ? pV[2] : null;
        if (!lId && !vId) { if (app.globalCtrl) app.globalCtrl.toast("Invalid link"); return; }
        if (!this.playerReady && this.apiInjecting) { if (app.globalCtrl) app.globalCtrl.toast("Player initializing..."); return; }
        this.dom.url.value = '';
        document.activeElement.blur();
        if (this.dom.stat) this.dom.stat.innerText = "Loading...";

        if (lId) {
            this.fetching = true;
            this.queue = [];
            this.titleQueue = [];
            this.currIdx = -1;
            this.isShuffle = false;
            this.originalQueue = [];
            this.render();
            if (this.ytPlayer && this.ytPlayer.loadPlaylist) this.ytPlayer.loadPlaylist({ list: lId });
        } else if (vId) {
            let isNew = this.queue.length === 0;
            let it = { id: vId, title: `Loading...` };
            this.queue.push(it);
            this.enqueueTitles([it]);
            if (this.isShuffle) this.originalQueue.push(it);
            if (isNew) {
                this.playTrack(0);
            } else {
                if (app.globalCtrl) app.globalCtrl.toast("Added to queue");
                if (this.dom.stat) this.dom.stat.innerText = "";
                this.render();
            }
        }
    }

    onState(e) {
        if (this.fetching && this.ytPlayer.getPlaylist && this.ytPlayer.getPlaylist().length > 0) {
            this.fetching = false;
            this.queue = this.ytPlayer.getPlaylist().map((id, i) => ({ id, title: `Track ${i + 1}` }));
            this.originalQueue = [...this.queue];
            this.enqueueTitles(this.queue);
            this.currIdx = 0;
            if (this.dom.stat) this.dom.stat.innerText = "";
            if (this.dom.tl) this.dom.tl.classList.remove('pointer-events-none');
            this.render();
            this.playTrack(0);
            return;
        }
        if (this.fetching) return;

        if (e.data === YT.PlayerState.PLAYING) {
            if (this.dom.iPlay) this.dom.iPlay.classList.add('hidden');
            if (this.dom.iPause) this.dom.iPause.classList.remove('hidden');
            if (this.dom.stat) this.dom.stat.innerText = "";
            if (this.dom.tl) this.dom.tl.classList.remove('pointer-events-none');
            this.startTrk();

            if (this.ytPlayer.getVideoData) {
                const d = this.ytPlayer.getVideoData();
                if (d && d.title && this.currIdx >= 0 && this.currIdx < this.queue.length) {
                    if (!this.queue[this.currIdx].title || this.queue[this.currIdx].title === 'Loading...' || this.queue[this.currIdx].title.startsWith('Track ')) {
                        this.queue[this.currIdx].title = d.title;
                        this.render();
                    }
                }
            }
        } else if (e.data === YT.PlayerState.PAUSED) {
            if (this.dom.iPlay) this.dom.iPlay.classList.remove('hidden');
            if (this.dom.iPause) this.dom.iPause.classList.add('hidden');
            this.stopTrk();
        } else if (e.data === YT.PlayerState.ENDED) {
            if (this.dom.iPlay) this.dom.iPlay.classList.remove('hidden');
            if (this.dom.iPause) this.dom.iPause.classList.add('hidden');
            this.stopTrk();
            if (this.dom.tl) {
                this.dom.tl.value = 0;
                this.dom.tl.style.setProperty('--percent', '0%');
            }

            if (this.loopMode === 2) {
                this.syncAndPlay();
            } else {
                let nextIdx = this.currIdx + 1;
                if (nextIdx >= this.queue.length) {
                    if (this.loopMode === 1) {
                        this.currIdx = 0;
                        this.syncAndPlay();
                    } else {
                        if (this.dom.stat) this.dom.stat.innerText = "Finished";
                    }
                } else {
                    this.currIdx = nextIdx;
                    this.syncAndPlay();
                }
            }
        }
    }

    playTrack(i) {
        if (i < 0 || i >= this.queue.length) return;
        this.currIdx = i;
        this.syncAndPlay();
    }

    playPause() {
        if (!this.queue.length) return;
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            if (this.ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) this.ytPlayer.pauseVideo();
            else this.ytPlayer.playVideo();
        }
    }

    startTrk() {
        clearInterval(this.ytTracker);
        this.ytTracker = setInterval(() => {
            if (this.ytPlayer && this.ytPlayer.getPlayerState && this.ytPlayer.getPlayerState() === 1 && !this.isDragging) {
                const c = this.ytPlayer.getCurrentTime() || 0, d = this.ytPlayer.getDuration() || 0;
                if (d > 0) {
                    const p = (c / d) * 100;
                    if (this.dom.tl) {
                        this.dom.tl.value = p;
                        this.dom.tl.style.setProperty('--percent', p + '%');
                    }
                    if (this.dom.tCur) this.dom.tCur.innerText = this.fmtTime(c);
                    if (this.dom.tTot) this.dom.tTot.innerText = this.fmtTime(d);
                }
            }
        }, 1000);
    }

    stopTrk() { clearInterval(this.ytTracker); }

    render() {
        if (!this.dom.pl) return;
        if (this.dom.qCnt) this.dom.qCnt.innerText = `${this.queue.length} Tracks`;

        if (!this.queue.length) {
            if (this.dom.warn) this.dom.warn.classList.add('hidden');
            this.dom.pl.innerHTML = '<li class="text-xs opacity-50 py-2 text-center">Queue empty</li>';
            if (this.dom.tl) this.dom.tl.classList.add('pointer-events-none');
            if (this.dom.bVid) { this.dom.bVid.classList.add('opacity-20', 'pointer-events-none'); this.dom.bVid.classList.remove('opacity-50', 'hover:opacity-100'); }
            if (this.dom.bLoop) { this.dom.bLoop.classList.add('opacity-20', 'pointer-events-none'); this.dom.bLoop.classList.remove('opacity-50', 'opacity-100', 'hover:opacity-100'); }
            if (this.dom.bShuffle) { this.dom.bShuffle.classList.add('opacity-20', 'pointer-events-none'); this.dom.bShuffle.classList.remove('opacity-50', 'opacity-100', 'hover:opacity-100'); }
            if (this.dom.bClear) { this.dom.bClear.classList.add('opacity-20', 'pointer-events-none'); this.dom.bClear.classList.remove('opacity-50', 'hover:opacity-100'); }
            if (this.isVid) { this.isVid = false; this.updateVidUI(); }
            return;
        }

        if (this.dom.bVid) { this.dom.bVid.classList.remove('opacity-20', 'pointer-events-none'); this.dom.bVid.classList.add('opacity-50', 'hover:opacity-100'); }
        if (this.dom.bLoop) { this.dom.bLoop.classList.remove('opacity-20', 'pointer-events-none'); this.dom.bLoop.classList.add(this.loopMode === 0 ? 'opacity-50' : 'opacity-100', 'hover:opacity-100'); }
        if (this.dom.bShuffle) { this.dom.bShuffle.classList.remove('opacity-20', 'pointer-events-none'); this.dom.bShuffle.classList.add(this.isShuffle ? 'opacity-100' : 'opacity-50', 'hover:opacity-100'); }
        if (this.dom.bClear) { this.dom.bClear.classList.remove('opacity-20', 'pointer-events-none'); this.dom.bClear.classList.add('opacity-50', 'hover:opacity-100'); }

        const tpl = document.getElementById('tpl-yt-item');
        const frag = document.createDocumentFragment();

        this.queue.forEach((item, i) => {
            const c = tpl.content.cloneNode(true), li = c.querySelector('li');
            li.dataset.index = i;
            if (i === this.currIdx) li.classList.add('border-black', 'dark:border-white', 'bg-gray-100', 'dark:bg-gray-800');
            else li.classList.add('border-transparent', 'hover:bg-gray-50', 'dark:hover:bg-gray-900');

            const tSp = c.querySelector('.track-title');
            tSp.title = item.title || 'Track ' + (i + 1);
            tSp.textContent = (i === this.currIdx ? '  ' : '') + (item.title || 'Track ' + (i + 1));

            if (i === this.currIdx) tSp.classList.add('font-bold');
            else if (i < this.currIdx) tSp.classList.add('opacity-50');

            frag.appendChild(c);
        });

        this.dom.pl.innerHTML = '';
        this.dom.pl.appendChild(frag);
    }
}