import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class FocusComponent {
    constructor() {
        this.prepDuration = 15000; this.isRunning = false; this.state = 'idle'; this.target = 0; this.total = 0; this.break = 0; this.reps = 0; this.currRep = 0; this.cycleMs = 0; this.remMs = 0; this.wasRunningBeforeQuit = false; this.wasPausedBeforeQuit = false;
        this.lastPhase = null; this.alertInterval = null;
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
            btnAddEnd: 'btn-focus-add-end'
        });
    }
    init() {
        this.worker = new Worker('./worker.js');
        this.worker.onmessage = () => { if(this.isRunning) this.render() };
        document.getElementById('btn-start-focus')?.addEventListener('click', () => this.start());
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
            if (b) { 
                ['h', 'm', 'bm', 'r'].forEach(k => { 
                    if (b.dataset[k] != null) document.getElementById('focus-' + (k === 'r' ? 'rep' : k)).value = b.dataset[k] 
                }); 
                return;
            } 
            if (e.target.closest('.edit-focus-preset-btn')) { 
                this.renderPresetEditList(); 
                UIUtils.openModal(this.dom.presetModal);
            } 
        });
        this.dom.presetList?.addEventListener('click', e => { 
            const btn = e.target.closest('.btn-del-focus'); 
            if (btn) { 
                btn.closest('.focus-row').remove(); 
                this.savePresets();
            } 
        });
        document.getElementById('btn-add-focus-preset')?.addEventListener('click', () => { 
            state.data.focusPresets.push({ h: 0, m: 25, bm: 5, r: 1 }); 
            this.renderPresetEditList(); 
            this.savePresets();
        });
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
        state.subscribe('focusPresets', () => this.renderPresets());
        this.renderPresets();
        window.addEventListener('app:togglePlay', this.togglePlayHandler);
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
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(r => r.showNotification(t, { body: m, icon: 'study-clock.png', vibrate: [200, 100, 200], tag: 'study-alert' })).catch(() => new Notification(t, { body: m }))
            } else {
                new Notification(t, { body: m })
            }
        }
        if (app.musicPlayer) {
            if (app.musicPlayer.ytPlayer && typeof app.musicPlayer.ytPlayer.setVolume === 'function') app.musicPlayer.ytPlayer.setVolume(Math.max(5, Math.floor(app.musicPlayer.mediaVol * 0.2)));
            if (app.musicPlayer.wnPlayer && typeof app.musicPlayer.wnPlayer.setVolume === 'function') app.musicPlayer.wnPlayer.setVolume(Math.max(5, Math.floor(app.musicPlayer.mediaVol * 0.2)));
        }
    }
    stopAlert() {
        this.alertInterval = UIUtils.clearTask(this.alertInterval);
        UIUtils.closeModal(this.dom.alertModal);
        if (app.musicPlayer) {
            if (app.musicPlayer.ytPlayer && typeof app.musicPlayer.ytPlayer.setVolume === 'function') app.musicPlayer.ytPlayer.setVolume(app.musicPlayer.mediaVol);
            if (app.musicPlayer.wnPlayer && typeof app.musicPlayer.wnPlayer.setVolume === 'function') app.musicPlayer.wnPlayer.setVolume(app.musicPlayer.mediaVol);
        }
    }
    start() {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
            document.activeElement.blur();
        }

        const h = parseInt(this.dom.hInp.value) || 0, 
            m = parseInt(this.dom.mInp.value) || 0, 
            bm = parseInt(this.dom.bmInp.value) || 0, 
            rep = parseInt(this.dom.repInp.value) || 1;
            
        this.total = (h * 3600 + m * 60) * 1000; 
        this.break = bm * 60000; 
        this.reps = rep; 
        this.currRep = 1; 
        this.cycleMs = this.total + this.break; 
        
        if (this.total === 0) return;
        
        this.dom.inputWrap.classList.add('hidden'); 
        this.dom.dispWrap.classList.remove('hidden');
        const rad = (this.total / this.cycleMs) * 2 * Math.PI;
        
        if(this.dom.dotBreak) { 
            this.dom.dotBreak.setAttribute('cx', 50 - 48 * Math.sin(rad)); 
            this.dom.dotBreak.setAttribute('cy', 50 - 48 * Math.cos(rad)); 
        }
        
        this.prepDuration = 15000; 
        this.state = 'prep'; 
        this.target = Date.now() + this.prepDuration; 
        this.isRunning = true;
        this.worker.postMessage({ action: 'start', interval: 100 });
        if(app.startLoopIfNeeded) app.startLoopIfNeeded();
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
        if (this.state === 'break') { if (this.currRep >= this.reps) { UIUtils.openModal(this.dom.congratsModal); return } this.currRep++ }
        this.lastPhase = this.state;
        this.triggerAlert("FOCUS ALERT!", "Phase completed.");
        if (this.state === 'prep' || this.state === 'break') { this.state = 'wait_focus'; if(this.dom.statText) this.dom.statText.innerText = "READY?" }
        else { this.state = 'wait_break'; if(this.dom.statText) this.dom.statText.innerText = "TAKE A BREAK?" }
    }
    applyAddTime() {
        const m = parseInt(this.dom.addM.value) || 0; const s = parseInt(this.dom.addS.value) || 0;
        const addMs = (m * 60 + s) * 1000; if (addMs <= 0) return;
        this.stopAlert();
        this.state = this.lastPhase;
        if (this.state === 'break') this.currRep--;
        this.target = Date.now() + addMs;
        this.isRunning = true;
        this.worker.postMessage({ action: 'start', interval: 100 });
        if(app.startLoopIfNeeded) app.startLoopIfNeeded();
        this.dom.addPanel.classList.add('hidden'); this.dom.addPanel.classList.remove('flex');
    }
    confirm() {
        this.stopAlert();
        if (this.state === 'wait_focus') { this.state = 'focus'; this.target = Date.now() + this.total }
        else { this.state = 'break'; this.target = Date.now() + this.break }
        this.isRunning = true;
        this.worker.postMessage({ action: 'start', interval: 100 });
        if(app.startLoopIfNeeded) app.startLoopIfNeeded();
        this.lastPhase = null;
    }
    pause() { if (!this.isRunning) return; this.worker.postMessage({ action: 'stop' }); this.isRunning = false; this.remMs = this.target - Date.now(); UIUtils.openModal(this.dom.pauseModal) }
    resume() { 
        UIUtils.closeModal(this.dom.pauseModal); 
        if (this.isRunning) return; 
        this.target = Date.now() + this.remMs; 
        this.isRunning = true; 
        this.worker.postMessage({ action: 'start', interval: 100 }); 
        if(app.startLoopIfNeeded) app.startLoopIfNeeded();
    }
    showQuit() { 
        if (this.isRunning) { 
            this.worker.postMessage({ action: 'stop' }); 
            this.isRunning = false; 
            this.remMs = this.target - Date.now(); 
            this.wasRunningBeforeQuit = true; 
            this.wasPausedBeforeQuit = false;
        } else { 
            this.wasRunningBeforeQuit = false; 
            this.wasPausedBeforeQuit = true;
        } 
        UIUtils.openModal(this.dom.quitModal);
    }
    cancelQuit() { UIUtils.closeModal(this.dom.quitModal); if (this.wasRunningBeforeQuit) this.resume(); else if (this.wasPausedBeforeQuit) UIUtils.openModal(this.dom.pauseModal); }
    quitAll() { UIUtils.closeModal(this.dom.quitModal); this.reset() }
    reset() { this.worker.postMessage({ action: 'stop' }); this.isRunning = false; this.state = 'idle'; if(this.dom.inputWrap) this.dom.inputWrap.classList.remove('hidden'); if(this.dom.dispWrap) this.dom.dispWrap.classList.add('hidden'); this.stopAlert() }
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
            h: parseInt(r.querySelector('.fh').value) || 0, 
            m: parseInt(r.querySelector('.fm').value) || 0, 
            bm: parseInt(r.querySelector('.bm').value) || 0, 
            r: parseInt(r.querySelector('.fr').value) || 1 
        })); 
        state.notify('focusPresets') 
    }
    closePresets() { UIUtils.closeModal(this.dom.presetModal); this.renderPresets() }
    destroy() {
        window.removeEventListener('app:togglePlay', this.togglePlayHandler);
        if (this.worker) {
            this.worker.postMessage({ action: 'stop' });
            this.worker.terminate();
        }
        this.stopAlert();
    }
}