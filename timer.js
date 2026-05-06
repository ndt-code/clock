import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class TimerComponent {
    constructor() {
        this.isRunning = false; this.endMs = 0; this.remainingMs = 0; this.totalMs = 0;
        this.dom = {};
        
        this.togglePlayHandler = (e) => {
            if (e.detail.tab === 'timer') {
                if (this.isRunning) {
                    this.pause();
                } else if (this.remainingMs > 0 || (this.dom.hInp.value > 0 || this.dom.mInp.value > 0 || this.dom.sInp.value > 0)) {
                    this.start();
                }
            }
        };

        this.initDOM();
        this.init();
    }
    initDOM() {
        this.dom = UIUtils.bindDOM({
            hInp: 'timer-h',
            mInp: 'timer-m',
            sInp: 'timer-s',
            hDisp: 'timer-h-disp',
            mDisp: 'timer-m-disp',
            sDisp: 'timer-s-disp',
            msDisp: 'timer-display-ms',
            prog: 'timer-progress',
            inputWrap: 'timer-input-wrapper',
            dispWrap: 'timer-display-wrapper',
            startD: 'btn-timer-start-d',
            startM: 'btn-timer-start-m',
            pauseD: 'btn-timer-pause-d',
            pauseM: 'btn-timer-pause-m',
            presetsCont: 'timer-presets-container',
            presetList: 'preset-edit-list',
            presetModal: 'preset-modal'
        });
    }
    init() {
        this.worker = new Worker('./worker.js');
        this.worker.onmessage = () => { if(this.isRunning) this.render() };
        
        [this.dom.hInp, this.dom.mInp, this.dom.sInp].forEach(el => UIUtils.setupNum(el));
        this.dom.startD?.addEventListener('click', () => this.start()); 
        this.dom.startM?.addEventListener('click', () => this.start());
        this.dom.pauseD?.addEventListener('click', () => this.pause()); 
        this.dom.pauseM?.addEventListener('click', () => this.pause());
        document.getElementById('btn-timer-reset-d')?.addEventListener('click', () => this.reset()); 
        document.getElementById('btn-timer-reset-m')?.addEventListener('click', () => this.reset());
        this.dom.presetsCont?.addEventListener('click', e => { 
            const b = e.target.closest('.preset-btn'); 
            if (b) { 
                this.dom.hInp.value = b.dataset.h; 
                this.dom.mInp.value = b.dataset.m; 
                this.dom.sInp.value = 0; 
                return;
            } 
            if (e.target.closest('.edit-preset-btn')) this.openEditPresets();
        });
        document.getElementById('btn-close-presets')?.addEventListener('click', () => { UIUtils.closeModal(this.dom.presetModal); this.renderPresets() });
        document.getElementById('btn-save-presets')?.addEventListener('click', () => { UIUtils.closeModal(this.dom.presetModal); this.renderPresets() });
        document.getElementById('btn-add-preset')?.addEventListener('click', () => this.addPreset());
        this.dom.presetList?.addEventListener('click', e => { 
            if (e.target.closest('.btn-delete-preset')) { 
                e.target.closest('.preset-row').remove(); 
                this.savePresetsFromUI();
            } 
        });
        state.subscribe('timerPresets', () => this.renderPresets());
        window.addEventListener('app:togglePlay', this.togglePlayHandler);
        this.renderPresets();
    }
    start() {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
            document.activeElement.blur();
        }   
        if (this.remainingMs === 0) {
            const h = Math.max(0, parseInt(this.dom.hInp.value) || 0),
                m = Math.max(0, parseInt(this.dom.mInp.value) || 0),
                s = Math.max(0, parseInt(this.dom.sInp.value) || 0);
            this.remainingMs = (h * 3600 + m * 60 + s) * 1000;
            this.totalMs = this.remainingMs;
        }
        if (this.remainingMs > 0) {
            this.endMs = Date.now() + this.remainingMs;
            this.isRunning = true;
            this.worker.postMessage({ action: 'start', interval: 100 });
            if (app.startLoopIfNeeded) app.startLoopIfNeeded();
            this.dom.inputWrap.classList.add('hidden');
            this.dom.dispWrap.classList.replace('hidden', 'flex');
            this.toggleBtns(true);
        }
    }
    pause() { 
        this.worker.postMessage({ action: 'stop' });
        this.isRunning = false; 
        this.remainingMs = Math.max(0, this.endMs - Date.now()); 
        this.toggleBtns(false); 
        if(this.dom.startD) this.dom.startD.innerText = "Resume"; 
        if(this.dom.startM) this.dom.startM.innerText = "Resume";
    }
    reset() { 
        this.worker.postMessage({ action: 'stop' });
        this.isRunning = false; 
        this.remainingMs = 0; 
        this.totalMs = 0; 
        this.endMs = 0; 
        if (this.dom.prog) { 
            this.dom.prog.style.transition = 'none'; 
            this.dom.prog.style.strokeDashoffset = 0;
        } 
        this.dom.inputWrap.classList.remove('hidden'); 
        this.dom.dispWrap.classList.replace('flex', 'hidden'); 
        this.toggleBtns(false); 
        if(this.dom.startD) this.dom.startD.innerText = "Start"; 
        if(this.dom.startM) this.dom.startM.innerText = "Start"; 
        this.render();
    }
    finish() {
        this.worker.postMessage({ action: 'stop' });
        this.isRunning = false;
        window.dispatchEvent(new CustomEvent('app:triggerAlert', {
            detail: { title: "TIME'S UP!", msg: "Your timer has finished.", type: 'timer' }
        }));
        this.reset();
    }
    toggleBtns(run) { 
        if(this.dom.startD) this.dom.startD.classList.toggle('hidden', run); 
        if(this.dom.pauseD) this.dom.pauseD.classList.toggle('hidden', !run); 
        if(this.dom.startM) this.dom.startM.classList.toggle('hidden', run); 
        if(this.dom.pauseM) this.dom.pauseM.classList.toggle('hidden', !run);
    }
    render() {
        let rem = this.isRunning ? (this.endMs - Date.now()) : this.remainingMs;
        if (rem <= 0) { rem = 0; if (this.isRunning) this.finish(); }
        const sec = Math.floor(rem / 1000), 
              h = Math.floor(sec / 3600), 
              m = Math.floor((sec % 3600) / 60), 
              s = sec % 60, 
              ms = Math.floor((rem % 1000) / 10);
              
        if(this.dom.hDisp) this.dom.hDisp.innerText = h.toString().padStart(2, '0'); 
        if(this.dom.mDisp) this.dom.mDisp.innerText = m.toString().padStart(2, '0'); 
        if(this.dom.sDisp) this.dom.sDisp.innerText = s.toString().padStart(2, '0'); 
        if(this.dom.msDisp) this.dom.msDisp.innerText = `.${ms.toString().padStart(2, '0')}`;
        
        if (this.totalMs > 0 && this.dom.prog) { 
            this.dom.prog.style.strokeDashoffset = 301.59 * (1 - (rem / this.totalMs)); 
            if (this.isRunning) this.dom.prog.style.transition = 'stroke-dashoffset 0.1s linear';
        }
    }
    renderPresets() { 
        if(!this.dom.presetsCont) return; 
        this.dom.presetsCont.innerHTML = ''; 
        state.data.timerPresets.forEach(p => { 
            const t = document.getElementById('tpl-preset-btn').content.cloneNode(true), 
                  b = t.querySelector('.preset-btn'); 
            b.dataset.h = p.h; 
            b.dataset.m = p.m; 
            b.innerText = `${p.h > 0 ? p.h + 'h ' : ''}${p.m}m`.trim(); 
            this.dom.presetsCont.appendChild(t);
        }); 
        this.dom.presetsCont.appendChild(document.getElementById('tpl-preset-edit-btn').content.cloneNode(true));
    }
    openEditPresets() { 
        if(!this.dom.presetList) return; 
        this.dom.presetList.innerHTML = ''; 
        state.data.timerPresets.forEach(p => { 
            const r = document.getElementById('tpl-preset-row').content.cloneNode(true); 
            const ins = r.querySelectorAll('input'); 
            ins[0].value = p.h; 
            ins[1].value = p.m; 
            ins.forEach(i => UIUtils.setupNum(i, () => this.savePresetsFromUI())); 
            this.dom.presetList.appendChild(r);
        }); 
        UIUtils.openModal(this.dom.presetModal);
    }
    addPreset() { 
        state.data.timerPresets.push({ h: 0, m: 5 }); 
        state.notify('timerPresets'); 
        this.openEditPresets();
    }
    savePresetsFromUI() { 
        state.data.timerPresets = Array.from(this.dom.presetList.querySelectorAll('.preset-row')).map(r => ({ 
            h: parseInt(r.querySelectorAll('input')[0].value) || 0, 
            m: parseInt(r.querySelectorAll('input')[1].value) || 0 
        })); 
        state.notify('timerPresets');
    }
    destroy() {
        window.removeEventListener('app:togglePlay', this.togglePlayHandler);
        if (this.worker) {
            this.worker.postMessage({ action: 'stop' });
            this.worker.terminate();
        }
    }
}