import { app } from './context.js';

export class StopwatchComponent {
    constructor() { 
        this.startTime = 0; this.elapsedTime = 0; this.isRunning = false;
        this.dom = {};
        this.initDOM();
        this.init(); 
    }
    initDOM() {
        this.dom.hDisp = document.getElementById('sw-h-disp');
        this.dom.mDisp = document.getElementById('sw-m-disp');
        this.dom.sDisp = document.getElementById('sw-s-disp');
        this.dom.msDisp = document.getElementById('sw-display-ms');
        this.dom.lapListD = document.getElementById('lap-list');
        this.dom.lapListM = document.getElementById('lap-list-mobile');
        this.dom.startD = document.getElementById('btn-sw-start-d');
        this.dom.startM = document.getElementById('btn-sw-start-m');
        this.dom.pauseD = document.getElementById('btn-sw-pause-d');
        this.dom.pauseM = document.getElementById('btn-sw-pause-m');
        this.dom.lapD = document.getElementById('btn-sw-lap-d');
        this.dom.lapM = document.getElementById('btn-sw-lap-m');
    }
    init() {
        this.dom.startD?.addEventListener('click', () => this.start()); this.dom.startM?.addEventListener('click', () => this.start());
        this.dom.pauseD?.addEventListener('click', () => this.pause()); this.dom.pauseM?.addEventListener('click', () => this.pause());
        this.dom.lapD?.addEventListener('click', () => this.lap()); this.dom.lapM?.addEventListener('click', () => this.lap());
        document.getElementById('btn-sw-reset-d')?.addEventListener('click', () => this.reset()); document.getElementById('btn-sw-reset-m')?.addEventListener('click', () => this.reset());
        
        window.addEventListener('app:togglePlay', e => { 
            if (e.detail.tab === 'stopwatch') { 
                if (this.isRunning) this.pause();
                else this.start();
            } 
        });
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
}
