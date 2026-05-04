import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class ClockComponent {
    constructor() {
        this.dom = {};
        this.initDOM();
        this.init();
    }
    initDOM() {
        this.dom.realH = document.getElementById('real-h');
        this.dom.realM = document.getElementById('real-m');
        this.dom.realSDesk = document.getElementById('real-s-desktop');
        this.dom.ampmDesk = document.getElementById('real-ampm-desktop');
        this.dom.realHM = document.getElementById('real-h-m');
        this.dom.realMM = document.getElementById('real-m-m');
        this.dom.realSM = document.getElementById('real-s-m');
        this.dom.mobileAmpm = document.getElementById('mobile-ampm');
        this.dom.cdHubModal = document.getElementById('cd-hub-modal');
    }
    init() {
        window.addEventListener('timeFormatChanged', () => this.update());
        const workerCode = `let t=null;self.onmessage=e=>{if(e.data==='start')t=setInterval(()=>self.postMessage('tick'),1000);else if(e.data==='stop')clearInterval(t)}`;
        this.worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' })));
        this.worker.onmessage = e => { if (e.data === 'tick') this.tick() };
        this.worker.postMessage('start');
        this.update();
    }
    tick() {
        const now = new Date(), h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        this.checkAlarms(h, m, s);
        this.update();
        if (this.dom.cdHubModal && !this.dom.cdHubModal.classList.contains('hidden') && app.eventComp) app.eventComp.updateCDTimes();
    }
    update() {
        if (document.body.getAttribute('data-active-tab') !== 'clock') return;
        const now = new Date(), h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        let dH = h, ap = ''; if (!app.globalCtrl.is24Hour) { ap = h >= 12 ? 'PM' : 'AM'; dH = h % 12 || 12 }
        const sH = dH.toString().padStart(2, '0'), sM = m.toString().padStart(2, '0'), sS = s.toString().padStart(2, '0');
        
        if (this.dom.realH) this.dom.realH.innerText = sH;
        if (this.dom.realM) this.dom.realM.innerText = sM;
        if (this.dom.realSDesk) this.dom.realSDesk.innerText = sS;
        if (this.dom.ampmDesk) this.dom.ampmDesk.innerText = ap;
        if (this.dom.realHM) this.dom.realHM.innerText = sH;
        if (this.dom.realMM) this.dom.realMM.innerText = sM;
        if (this.dom.realSM) this.dom.realSM.innerText = sS;
        if (this.dom.mobileAmpm) this.dom.mobileAmpm.innerText = ap;
    }
    checkAlarms(h, m, s) {
        const cur = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        state.data.alarms.forEach(a => {
            if (a.active && a.time24 === cur) { if (!a.triggeredToday) { app.globalCtrl.startAlert("ALARM!", `It is ${this.formatTime(a.time24)}.`, false, 'alarm', a.id); a.triggeredToday = true } }
            else a.triggeredToday = false;
        });
    }
    formatTime(t24) { if (app.globalCtrl.is24Hour) return t24; let [h, m] = t24.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ap}` }
}
