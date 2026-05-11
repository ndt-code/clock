import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class FocusComponent {
    constructor() {
        this.prepDuration = 15000; this.isRunning = false; this.state = 'idle'; this.target = 0; this.total = 0; this.break = 0; this.reps = 0; this.currRep = 0; this.cycleMs = 0; this.remMs = 0; this.wasRunningBeforeQuit = false; this.wasPausedBeforeQuit = false;
        this.lastPhase = null; this.alertInterval = null;
        this.activeVidMode = false;
        this.pendingVid = null;
        this.currentFocVid = null;
        this.focusVideos = [
            { id: 'vrpRVo-ij0k', title: 'Soft Rain - 60/10/3 (34s)', icon: '🌦️' },
            { id: 'FieGvAL4WAk', title: 'Soft Rain (No BGM) - 60/10/2 (33s)', icon: '🎧' },
            { id: 'eNXPoaD_Tgc', title: 'Stormy Day - 50/10/1 (50s)', icon: '⛈️' },
            { id: 'xtgC9z4RO8M', title: 'Gentle Rain - 50/10/3 (35s)', icon: '🎹' },
            { id: 'JHF4MPoADSs', title: 'Morning Ambience - 50/10/3 (40s)', icon: '⛅' },
            { id: 'LsOPhIEFTbo', title: 'Cafe - 50/10/4 (44s)', icon: '🍵' }
        ];
        this.dom = {};
        this.togglePlayHandler = (e) => {
            if (e.detail.tab === 'focus' && this.isRunning && this.state === 'focus') {
                this.pause();
            }
        };
        this.initDOM();
        this.init();
    }
    initDOM() {
        this.dom = UIUtils.bindDOM({
            hInp: 'focus-h',
            mInp: 'focus-m',
            bmInp: 'focus-bm',
            repInp: 'focus-rep',
            inputWrap: 'focus-input-wrapper',
            dispWrap: 'focus-display-wrapper',
            dotBreak: 'focus-dot-break',
            timeDisp: 'focus-time-disp',
            statText: 'focus-status-text',
            sBtn: 'btn-focus-skip',
            psBtn: 'btn-focus-pause',
            prog: 'focus-progress',
            repDisp: 'focus-rep-disp',
            presetsCont: 'focus-presets-container',
            presetList: 'focus-preset-edit-list',
            presetModal: 'focus-preset-modal',
            pauseModal: 'pause-modal',
            quitModal: 'quit-modal',
            congratsModal: 'congrats-modal',
            alertModal: 'focus-alert-modal',
            alertTitle: 'focus-alert-title',
            alertMsg: 'focus-alert-msg',
            mainActions: 'focus-alert-main-actions',
            btnAddShow: 'btn-focus-show-add',
            addPanel: 'alert-focus-add-panel',
            addM: 'foc-add-m',
            addS: 'foc-add-s',
            addApply: 'btn-focus-add-apply',
            btnAddEnd: 'btn-focus-add-end',
            btnManual: 'btn-focus-mode-manual',
            btnVideo: 'btn-focus-mode-video',
            manSec: 'focus-manual-section',
            vidSec: 'focus-video-section',
            vidList: 'focus-video-list',
            fvcModal: 'focus-video-confirm-modal',
            fvcTitle: 'fvc-title',
            fvcF: 'fvc-f',
            fvcB: 'fvc-b',
            fvcR: 'fvc-r',
            fvcP: 'fvc-p',
            btnFvcCancel: 'btn-fvc-cancel',
            btnFvcStart: 'btn-fvc-start',
            focVolWrap: 'focus-video-vol-container',
            focVol: 'focus-video-vol'
        });
    }
    init() {
        this.worker = new Worker('./worker.js');
        this.worker.onmessage = () => {if(this.isRunning&&(this.target-Date.now()<= 0)) {this.transition();}};
        document.getElementById('btn-start-focus')?.addEventListener('click', () => { this.currentFocVid = null; this.start(); });
        document.getElementById('btn-show-quit-modal')?.addEventListener('click', () => this.showQuit());
        this.dom.sBtn?.addEventListener('click', () => this.skip());
        document.getElementById('btn-focus-skip-modal')?.addEventListener('click', () => { UIUtils.closeModal(this.dom.quitModal); this.skip() });
        this.dom.psBtn?.addEventListener('click', () => this.pause());
        document.getElementById('btn-focus-resume')?.addEventListener('click', () => this.resume());
        document.getElementById('btn-focus-quit-all')?.addEventListener('click', () => this.quitAll());
        document.getElementById('btn-focus-quit-pause')?.addEventListener('click', () => { UIUtils.closeModal(this.dom.pauseModal); this.showQuit() });
        document.getElementById('alert-focus-confirm')?.addEventListener('click', () => this.confirm());
        document.getElementById('btn-close-congrats')?.addEventListener('click', () => { UIUtils.closeModal(this.dom.congratsModal); this.reset() });        
        [this.dom.hInp, this.dom.mInp, this.dom.bmInp, this.dom.repInp].forEach(el => UIUtils.setupNum(el));
        UIUtils.setupNum(this.dom.addM);
        UIUtils.setupNum(this.dom.addS);
        this.dom.btnAddShow?.addEventListener('click', () => {
            this.dom.mainActions.classList.replace('flex', 'hidden');
            this.dom.addPanel.classList.replace('hidden', 'flex');
        });
        this.dom.btnAddEnd?.addEventListener('click', () => this.confirm());
        this.dom.addApply?.addEventListener('click', () => this.applyAddTime());
        this.dom.presetsCont?.addEventListener('click', e => { 
            const b = e.target.closest('.focus-preset-btn'); 
            if (b) { ['h', 'm', 'bm', 'r'].forEach(k => { if (b.dataset[k] != null) document.getElementById('focus-' + (k === 'r' ? 'rep' : k)).value = b.dataset[k] }); return; } 
            if (e.target.closest('.edit-focus-preset-btn')) { this.renderPresetEditList(); UIUtils.openModal(this.dom.presetModal); } 
        });
        this.dom.presetList?.addEventListener('click', e => { 
            const btn = e.target.closest('.btn-del-focus'); 
            if (btn) { btn.closest('.focus-row').remove(); this.savePresets(); } 
        });
        document.getElementById('btn-add-focus-preset')?.addEventListener('click', () => { state.data.focusPresets.push({ h: 0, m: 25, bm: 5, r: 1 }); this.renderPresetEditList(); this.savePresets(); });
        document.getElementById('btn-close-focus-preset-1')?.addEventListener('click', () => this.closePresets());
        document.getElementById('btn-close-focus-preset-2')?.addEventListener('click', () => this.closePresets());
        this.dom.quitModal?.addEventListener('click', (e) => { if (e.target === this.dom.quitModal) this.cancelQuit(); });
        document.addEventListener('keydown', e => {
            if (document.body.getAttribute('data-active-tab') !== 'focus') return;
            if (e.key === 'Escape') {
                if (!this.dom.quitModal.classList.contains('hidden')) this.cancelQuit();
                else if (!this.dom.congratsModal.classList.contains('hidden')) { this.reset(); UIUtils.closeModal(this.dom.congratsModal); }
            }
            if (e.key === 'Enter') {
                if (!this.dom.alertModal.classList.contains('hidden')) this.confirm();
                else if (!this.dom.congratsModal.classList.contains('hidden')) { this.reset(); UIUtils.closeModal(this.dom.congratsModal); }
            }
        });
        this.dom.btnManual?.addEventListener('click', () => {
            this.activeVidMode = false;
            this.dom.btnManual.classList.add('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black'); this.dom.btnManual.classList.remove('text-gray-500');
            this.dom.btnVideo?.classList.remove('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black'); this.dom.btnVideo?.classList.add('text-gray-500');
            this.dom.manSec?.classList.remove('hidden'); this.dom.manSec?.classList.add('flex');
            this.dom.vidSec?.classList.add('hidden'); this.dom.vidSec?.classList.remove('flex');
        });
        this.dom.btnVideo?.addEventListener('click', () => {
            this.activeVidMode = true;
            this.dom.btnVideo.classList.add('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black'); this.dom.btnVideo.classList.remove('text-gray-500');
            this.dom.btnManual?.classList.remove('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black'); this.dom.btnManual?.classList.add('text-gray-500');
            this.dom.vidSec?.classList.remove('hidden'); this.dom.vidSec?.classList.add('flex');
            this.dom.manSec?.classList.add('hidden'); this.dom.manSec?.classList.remove('flex');
            if(app.musicPlayer && app.musicPlayer.injectAPI) app.musicPlayer.injectAPI();
        });     
        this.dom.vidList?.addEventListener('click', e => {
            const item = e.target.closest('.foc-vid-item');
            if (item) this.showVideoConfirm(this.focusVideos[parseInt(item.dataset.index)]);
        });
        this.dom.btnFvcCancel?.addEventListener('click', () => UIUtils.closeModal(this.dom.fvcModal));
        this.dom.btnFvcStart?.addEventListener('click', () => {
            UIUtils.closeModal(this.dom.fvcModal);
            let h = Math.floor(this.pendingVid.m / 60);
            let m = this.pendingVid.m % 60;
            this.total = (h * 3600 + m * 60) * 1000;
            this.break = this.pendingVid.bm * 60000;
            this.reps = this.pendingVid.r;
            this.prepDuration = this.pendingVid.hasPrep ? this.pendingVid.p : 15000;
            this.currentFocVid = this.pendingVid;
            this.dom.focVolWrap?.classList.remove('hidden');
            if(this.dom.focVol) {
                this.dom.focVol.value = app.musicPlayer ? app.musicPlayer.mediaVol : 100;
                this.dom.focVol.style.setProperty('--percent', this.dom.focVol.value + '%');
            }
            this._executeStart();
        });        
        this.dom.focVol?.addEventListener('input', e => {
            e.target.style.setProperty('--percent', e.target.value + '%');
            if (app.musicPlayer && app.musicPlayer.focPlayer && app.musicPlayer.focPlayer.setVolume) app.musicPlayer.focPlayer.setVolume(e.target.value);
        });
        state.subscribe('focusPresets', () => this.renderPresets());
        this.renderPresets();
        this.renderVideoList();
        window.addEventListener('app:togglePlay', this.togglePlayHandler);
    }
    runAnimationLoop() {
        if (!this.isRunning) return;
        this.render();
        requestAnimationFrame(() => this.runAnimationLoop());
    }
    renderVideoList() {
        if (!this.dom.vidList) return;
        this.dom.vidList.innerHTML = '';
        const tpl = document.getElementById('tpl-focus-vid-item');
        const frag = document.createDocumentFragment();
        this.focusVideos.forEach((vid, i) => {
            const c = tpl.content.cloneNode(true);
            const li = c.querySelector('li');
            li.dataset.index = i;
            c.querySelector('.foc-vid-icon').textContent = vid.icon;
            c.querySelector('.foc-vid-title').textContent = vid.title;
            frag.appendChild(c);
        });
        this.dom.vidList.appendChild(frag);
    }
    showVideoConfirm(vid) {
        const match = vid.title.match(/-\s*(\d+)\/(\d+)\/(\d+)(?:\s*\((\d+)s\))?/);
        let m=0, bm=0, r=1, p=15000;
        let hasPrep = false;
        if(match) {
            m = parseInt(match[1]) || 0;
            bm = parseInt(match[2]) || 0;
            r = parseInt(match[3]) || 1;
            if(match[4]) {
                p = parseInt(match[4]) * 1000;
                hasPrep = true;
            }
        }
        this.pendingVid = { id: vid.id, m, bm, r, p, hasPrep };
        this.dom.fvcTitle.innerText = vid.title;
        this.dom.fvcF.innerText = m + 'm';
        this.dom.fvcB.innerText = bm + 'm';
        this.dom.fvcR.innerText = r;
        this.dom.fvcP.innerText = (p/1000) + 's';
        UIUtils.openModal(this.dom.fvcModal);
    }
    triggerAlert(t, m) {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        if(app.globalCtrl) app.globalCtrl.initAudio();
        this.dom.alertTitle.innerText = t;
        this.dom.alertMsg.innerText = m;
        this.dom.mainActions.classList.replace('hidden', 'flex');
        this.dom.addPanel.classList.replace('flex', 'hidden');
        UIUtils.openModal(this.dom.alertModal);
        if(app.globalCtrl) {
            app.globalCtrl.playBeep();
            this.alertInterval = UIUtils.clearTask(this.alertInterval);
            this.alertInterval = setInterval(() => app.globalCtrl.playBeep(), 1000);
        }
        if ("Notification" in window && Notification.permission === "granted") {
            try { new Notification(t, { body: m, icon: 'study-clock.png' }); } 
            catch (e) { if (navigator.serviceWorker) navigator.serviceWorker.ready.then(r => r.showNotification(t, { body: m, icon: 'study-clock.png', vibrate: [200, 100, 200], tag: 'study-alert' })).catch(()=>{}); }
        }
        if (app.musicPlayer) {
            if (app.musicPlayer.ytPlayer && typeof app.musicPlayer.ytPlayer.setVolume === 'function') app.musicPlayer.ytPlayer.setVolume(Math.max(5, Math.floor(app.musicPlayer.mediaVol * 0.2)));
            if (app.musicPlayer.wnPlayer && typeof app.musicPlayer.wnPlayer.setVolume === 'function') app.musicPlayer.wnPlayer.setVolume(Math.max(5, Math.floor(app.musicPlayer.mediaVol * 0.2)));
            if (app.musicPlayer.focPlayer && typeof app.musicPlayer.focPlayer.setVolume === 'function') app.musicPlayer.focPlayer.setVolume(Math.max(5, Math.floor((this.dom.focVol ? this.dom.focVol.value : 100) * 0.2)));
        }
    }
    stopAlert() {
        this.alertInterval = UIUtils.clearTask(this.alertInterval);
        UIUtils.closeModal(this.dom.alertModal);
        if (app.musicPlayer) {
            if (app.musicPlayer.ytPlayer && typeof app.musicPlayer.ytPlayer.setVolume === 'function') app.musicPlayer.ytPlayer.setVolume(app.musicPlayer.mediaVol);
            if (app.musicPlayer.wnPlayer && typeof app.musicPlayer.wnPlayer.setVolume === 'function') app.musicPlayer.wnPlayer.setVolume(app.musicPlayer.mediaVol);
            if (app.musicPlayer.focPlayer && typeof app.musicPlayer.focPlayer.setVolume === 'function') app.musicPlayer.focPlayer.setVolume(this.dom.focVol ? this.dom.focVol.value : 100);
        }
    }
    syncVideoTime() {
        if (!this.currentFocVid || !app.musicPlayer) return;
        const focusSec = this.total / 1000;
        const breakSec = this.break / 1000;
        const prepSec = this.currentFocVid.hasPrep ? this.currentFocVid.p / 1000 : 0;
        const repIdx = this.currRep - 1;
        let remSec = Math.max(0, this.target - Date.now()) / 1000;
        let targetVideoSec = 0;
        let shouldPlay = false;
        let phasesPassed = 0;
        if (this.state === 'focus') {
            phasesPassed = repIdx * 2; 
        } else if (this.state === 'break') {
            phasesPassed = repIdx * 2 + 1;
        }
        const offset = phasesPassed * 3;
        if (this.state === 'prep') {
            targetVideoSec = Math.max(0, prepSec - remSec);
            shouldPlay = true;
        } else if (this.state === 'focus') {
            targetVideoSec = Math.max(0, prepSec + repIdx * (focusSec + breakSec) + (focusSec - remSec) + offset);
            shouldPlay = true;
        } else if (this.state === 'break') {
            targetVideoSec = Math.max(0, prepSec + repIdx * (focusSec + breakSec) + focusSec + (breakSec - remSec) + offset);
            shouldPlay = true;
        }        
        if (shouldPlay && this.isRunning) {
            app.musicPlayer.seekAndPlayFocusVideo(targetVideoSec, this.currentFocVid.id);
        } else {
            app.musicPlayer.pauseFocusVideo();
        }
    }
    start() {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
        const h = parseInt(this.dom.hInp.value) || 0, m = parseInt(this.dom.mInp.value) || 0, bm = parseInt(this.dom.bmInp.value) || 0, rep = parseInt(this.dom.repInp.value) || 1;
        this.total = (h * 3600 + m * 60) * 1000; this.break = bm * 60000; this.reps = rep; this.prepDuration = 30000;
        this._executeStart();
    }
    _executeStart() {
        this.currRep = 1; this.cycleMs = this.total + this.break; 
        if (this.total === 0) return;
        this.dom.inputWrap.classList.add('hidden'); this.dom.dispWrap.classList.remove('hidden');
        const rad = (this.total / this.cycleMs) * 2 * Math.PI;
        if(this.dom.dotBreak) { this.dom.dotBreak.setAttribute('cx', 50 - 48 * Math.sin(rad)); this.dom.dotBreak.setAttribute('cy', 50 - 48 * Math.cos(rad)); }
        this.state = 'prep'; this.target = Date.now() + this.prepDuration; this.isRunning = true;
        this.syncVideoTime();
        this.worker.postMessage({ action: 'start', interval: 100 });
        this.runAnimationLoop();
    }
    render() {
        if (!this.isRunning) return;
        let rem = this.target - Date.now();
        if (rem <= 0) { rem = 0; this.transition() }
        const ms = Math.floor(rem / 1000), min = Math.floor(ms / 60), sec = ms % 60;
        if(this.dom.timeDisp) this.dom.timeDisp.innerText = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        let p = 1;
        if (this.state === 'prep') {
            if(this.dom.statText) this.dom.statText.innerText = "PREPARING"; p = rem / this.prepDuration;
            if(this.dom.sBtn) this.dom.sBtn.classList.remove('hidden'); if(this.dom.psBtn) this.dom.psBtn.classList.add('hidden');
        }
        else if (this.state === 'focus') {
            if(this.dom.statText) this.dom.statText.innerText = "FOCUS"; p = (rem + this.break) / this.cycleMs;
            if(this.dom.sBtn) this.dom.sBtn.classList.add('hidden'); if(this.dom.psBtn) this.dom.psBtn.classList.remove('hidden');
        }
        else if (this.state === 'break') {
            if(this.dom.statText) this.dom.statText.innerText = "BREAK"; p = rem / this.cycleMs;
            if(this.dom.sBtn) this.dom.sBtn.classList.remove('hidden'); if(this.dom.psBtn) this.dom.psBtn.classList.add('hidden');
        }
        p = Math.max(0, Math.min(1, p));
        if(this.dom.prog) this.dom.prog.style.strokeDashoffset = 301.59 * (1 - p);
        if(this.dom.repDisp) this.dom.repDisp.innerText = `Rep: ${this.currRep}/${this.reps}`;
    }
    transition() {
        this.isRunning = false;
        if (this.currentFocVid && app.musicPlayer) app.musicPlayer.pauseFocusVideo();
        if (this.state === 'break') { if (this.currRep >= this.reps) { UIUtils.openModal(this.dom.congratsModal); return } this.currRep++ }
        this.lastPhase = this.state;
        this.triggerAlert("FOCUS ALERT!", "Phase completed.");
        if (this.state === 'prep' || this.state === 'break') { this.state = 'wait_focus'; if(this.dom.statText) this.dom.statText.innerText = "READY?" }
        else { this.state = 'wait_break'; if(this.dom.statText) this.dom.statText.innerText = "TAKE A BREAK?" }
    }
    applyAddTime() {
        const m = parseInt(this.dom.addM.value) || 0; const s = parseInt(this.dom.addS.value) || 0;
        const addMs = (m * 60 + s) * 1000; if (addMs <= 0) return;
        this.stopAlert(); this.state = this.lastPhase;
        if (this.state === 'break') this.currRep--;
        this.target = Date.now() + addMs; this.isRunning = true;
        this.syncVideoTime();
        this.worker.postMessage({ action: 'start', interval: 100 });
        this.runAnimationLoop();
        this.dom.addPanel.classList.add('hidden'); this.dom.addPanel.classList.remove('flex');
    }
    confirm() {
        this.stopAlert();
        if (this.state === 'wait_focus') { this.state = 'focus'; this.target = Date.now() + this.total }
        else { this.state = 'break'; this.target = Date.now() + this.break }
        this.isRunning = true;
        this.syncVideoTime();
        this.worker.postMessage({ action: 'start', interval: 100 });
        this.runAnimationLoop();
        this.lastPhase = null;
    }
    pause() { if (!this.isRunning) return; this.worker.postMessage({ action: 'stop' }); this.isRunning = false; this.remMs = this.target - Date.now(); if (this.currentFocVid && app.musicPlayer) app.musicPlayer.pauseFocusVideo(); UIUtils.openModal(this.dom.pauseModal) }
    resume() { 
        UIUtils.closeModal(this.dom.pauseModal); 
        if (this.isRunning) return; 
        this.target = Date.now() + this.remMs; 
        this.isRunning = true; 
        this.syncVideoTime();
        this.worker.postMessage({ action: 'start', interval: 100 }); 
        this.runAnimationLoop(); 
    }
    showQuit() { 
        if (this.isRunning) { this.worker.postMessage({ action: 'stop' }); this.isRunning = false; this.remMs = this.target - Date.now(); this.wasRunningBeforeQuit = true; this.wasPausedBeforeQuit = false; } 
        else { this.wasRunningBeforeQuit = false; this.wasPausedBeforeQuit = true; } 
        UIUtils.openModal(this.dom.quitModal);
    }
    cancelQuit() { UIUtils.closeModal(this.dom.quitModal); if (this.wasRunningBeforeQuit) this.resume(); else if (this.wasPausedBeforeQuit) UIUtils.openModal(this.dom.pauseModal); }
    quitAll() { UIUtils.closeModal(this.dom.quitModal); this.reset() }
    reset() { this.worker.postMessage({ action: 'stop' }); this.isRunning = false; this.state = 'idle'; if(this.dom.inputWrap) this.dom.inputWrap.classList.remove('hidden'); if(this.dom.dispWrap) this.dom.dispWrap.classList.add('hidden'); if(this.dom.focVolWrap) this.dom.focVolWrap.classList.add('hidden'); if(this.currentFocVid && app.musicPlayer) app.musicPlayer.stopFocusVideo(); this.currentFocVid = null; this.stopAlert() }
    skip() { this.worker.postMessage({ action: 'stop' }); this.isRunning = false; this.transition() }
    renderPresets() { 
        if(!this.dom.presetsCont) return; 
        this.dom.presetsCont.innerHTML = ''; 
        state.data.focusPresets.forEach(p => { 
            const t = document.getElementById('tpl-focus-preset-btn').content.cloneNode(true), b = t.querySelector('.focus-preset-btn'); 
            b.dataset.h = p.h; b.dataset.m = p.m; b.dataset.bm = p.bm; b.dataset.r = p.r; 
            b.innerText = `${p.h > 0 ? p.h + 'h ' : ''}${p.m}m / ${p.bm}m`; 
            this.dom.presetsCont.appendChild(t) 
        }); 
        this.dom.presetsCont.appendChild(document.getElementById('tpl-focus-preset-edit-btn').content.cloneNode(true)) 
    }
    renderPresetEditList() { 
        if(!this.dom.presetList) return; 
        this.dom.presetList.innerHTML = ''; 
        const tpl = document.getElementById('tpl-focus-preset-row'); 
        state.data.focusPresets.forEach(p => { 
            const c = tpl.content.cloneNode(true), inputs = c.querySelectorAll('input'); 
            inputs[0].value = p.h; inputs[1].value = p.m; inputs[2].value = p.bm; inputs[3].value = p.r; 
            inputs.forEach(i => UIUtils.setupNum(i, () => this.savePresets())); 
            this.dom.presetList.appendChild(c) 
        }) 
    }
    savePresets() { 
        state.data.focusPresets = Array.from(this.dom.presetList.children).map(r => ({ 
            h: parseInt(r.querySelector('.fh').value) || 0, m: parseInt(r.querySelector('.fm').value) || 0, bm: parseInt(r.querySelector('.bm').value) || 0, r: parseInt(r.querySelector('.fr').value) || 1 
        })); 
        state.notify('focusPresets') 
    }
    closePresets() { UIUtils.closeModal(this.dom.presetModal); this.renderPresets() }
    destroy() { window.removeEventListener('app:togglePlay', this.togglePlayHandler); if (this.worker) { this.worker.postMessage({ action: 'stop' }); this.worker.terminate(); } this.stopAlert(); }
}