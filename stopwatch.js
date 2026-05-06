import { app } from './context.js';
import { UIUtils } from './utils.js';

export class StopwatchComponent {
    constructor() {
        this.startTime = 0; this.elapsedTime = 0; this.isRunning = false;
        this.dom = {}; 
        this.togglePlayHandler = (e) => {
            if (e.detail.tab === 'stopwatch') {
                if (this.isRunning) this.pause();
                else this.start();
            }
        };
        this.initDOM();
        this.init();
    }
    initDOM() {
        this.dom = UIUtils.bindDOM({
            hDisp: 'sw-h-disp',
            mDisp: 'sw-m-disp',
            sDisp: 'sw-s-disp',
            msDisp: 'sw-display-ms',
            lapListD: 'lap-list',
            lapListM: 'lap-list-mobile',
            startD: 'btn-sw-start-d',
            startM: 'btn-sw-start-m',
            pauseD: 'btn-sw-pause-d',
            pauseM: 'btn-sw-pause-m',
            lapD: 'btn-sw-lap-d',
            lapM: 'btn-sw-lap-m',
            resetD: 'btn-sw-reset-d',
            resetM: 'btn-sw-reset-m'
        });
    }
    init() {
        this.dom.startD?.addEventListener('click', () => this.start()); this.dom.startM?.addEventListener('click', () => this.start());
        this.dom.pauseD?.addEventListener('click', () => this.pause()); this.dom.pauseM?.addEventListener('click', () => this.pause());
        this.dom.lapD?.addEventListener('click', () => this.lap()); this.dom.lapM?.addEventListener('click', () => this.lap());
        this.dom.resetD?.addEventListener('click', () => this.reset()); this.dom.resetM?.addEventListener('click', () => this.reset());
        window.addEventListener('app:togglePlay', this.togglePlayHandler);
    }
    start() { this.startTime = Date.now(); this.isRunning = true; app.startLoopIfNeeded(); this.toggleBtns(true) }
    pause() { this.isRunning = false; this.elapsedTime += Date.now() - this.startTime; this.toggleBtns(false); if(this.dom.startD) this.dom.startD.innerText = "Resume"; if(this.dom.startM) this.dom.startM.innerText = "Resume" }
    reset() { this.isRunning = false; this.elapsedTime = 0; this.startTime = 0; this.render(); if(this.dom.lapListD) this.dom.lapListD.innerHTML = ''; if(this.dom.lapListM) this.dom.lapListM.innerHTML = ''; this.toggleBtns(false); if(this.dom.startD) this.dom.startD.innerText = "Start"; if(this.dom.startM) this.dom.startM.innerText = "Start" }
    lap() {
        const total = this.elapsedTime + (this.isRunning ? Date.now() - this.startTime : 0), h = Math.floor(total / 3600000), m = Math.floor((total % 3600000) / 60000), s = Math.floor((total % 60000) / 1000), ms = Math.floor((total % 1000) / 10);
        const cur = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        const t = document.getElementById('tpl-lap-item'), c = t.content.cloneNode(true); c.querySelector('.lap-num').textContent = `Lap ${this.dom.lapListD ? this.dom.lapListD.children.length + 1 : 1}`; c.querySelector('.lap-time').textContent = cur;
        const c2 = c.cloneNode(true); if(this.dom.lapListD) this.dom.lapListD.prepend(c); if(this.dom.lapListM) this.dom.lapListM.prepend(c2);
    }
    toggleBtns(run) {
        if(this.dom.startD) this.dom.startD.classList.toggle('hidden', run); if(this.dom.pauseD) this.dom.pauseD.classList.toggle('hidden', !run); if(this.dom.lapD) this.dom.lapD.classList.toggle('hidden', !run);
        if(this.dom.startM) this.dom.startM.classList.toggle('hidden', run); if(this.dom.pauseM) this.dom.pauseM.classList.toggle('hidden', !run); if(this.dom.lapM) this.dom.lapM.classList.toggle('hidden', !run);
    }
    render() {
        const total = this.elapsedTime + (this.isRunning ? Date.now() - this.startTime : 0), h = Math.floor(total / 3600000), m = Math.floor((total % 3600000) / 60000), s = Math.floor((total % 60000) / 1000), ms = Math.floor((total % 1000) / 10);
        if(this.dom.hDisp) this.dom.hDisp.innerText = h.toString().padStart(2, '0'); if(this.dom.mDisp) this.dom.mDisp.innerText = m.toString().padStart(2, '0'); if(this.dom.sDisp) this.dom.sDisp.innerText = s.toString().padStart(2, '0'); if(this.dom.msDisp) this.dom.msDisp.innerText = `.${ms.toString().padStart(2, '0')}`;
    }
    destroy() {
        window.removeEventListener('app:togglePlay', this.togglePlayHandler);
    }
}