import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class AlarmComponent {
    constructor() {
        this.alarmAmpmState = 'AM';
        this.dom = {};
        this.initDOM();
        this.init();
    }

    initDOM() {
        this.dom.hInp = document.getElementById('alarm-h');
        this.dom.mInp = document.getElementById('alarm-m');
        this.dom.btnAddM = document.getElementById('btn-add-alarm-m');
        this.dom.btnAddD = document.getElementById('btn-add-alarm-d');
        this.dom.list = document.getElementById('alarm-list');
    }

    init() {
        const today = new Date().toDateString(), lastReset = localStorage.getItem('lastResetDate');
        if (lastReset !== today) { 
            state.data.alarms.forEach(a => { a.active = false; a.triggeredToday = false; a.snoozeMins = 0 }); 
            state.notify('alarms'); 
            localStorage.setItem('lastResetDate', today) 
        }
        
        UIUtils.setupNum(this.dom.hInp, () => this.validateHourInput());
        UIUtils.setupNum(this.dom.mInp);
        
        this.dom.btnAddM?.addEventListener('click', e => {
            const ampm = e.target.closest('.ampm-label');
            if (ampm) { 
                this.alarmAmpmState = this.alarmAmpmState === 'AM' ? 'PM' : 'AM'; 
                this.updateAlarmTimeMode(); 
                return 
            }
            this.add();
        });
        
        this.dom.btnAddD?.addEventListener('click', () => this.add());
        
        if (this.dom.list) {
            this.dom.list.addEventListener('click', e => {
                const li = e.target.closest('li[data-id]');
                if (!li) return;
                
                const id = parseInt(li.dataset.id);
                
                if (e.target.closest('.btn-toggle')) {
                    state.toggleAlarm(id);
                    return;
                }
                if (e.target.closest('.btn-del')) {
                    state.deleteAlarm(id);
                    return;
                }
            });
        }
        
        window.addEventListener('timeFormatChanged', () => { this.updateAlarmTimeMode(); this.render() });
        state.subscribe(() => this.render()); 
        this.updateAlarmTimeMode(); 
        this.render();
    }

    updateAlarmTimeMode() {
        if (app.globalCtrl.is24Hour) { 
            this.dom.hInp.max = 23; 
            this.dom.hInp.min = 0; 
            if (this.dom.btnAddM) this.dom.btnAddM.innerHTML = '<span>Add</span>' 
        }
        else { 
            this.dom.hInp.max = 12; 
            this.dom.hInp.min = 1; 
            if (this.dom.btnAddM) this.dom.btnAddM.innerHTML = `<span class="ampm-label text-[10px] opacity-60 pointer-events-auto cursor-pointer">${this.alarmAmpmState}</span><span>Add</span>` 
        }
        this.validateHourInput();
    }

    validateHourInput() {
        let v = parseInt(this.dom.hInp.value) || 0;
        if (!app.globalCtrl.is24Hour) { 
            if (v > 12) this.dom.hInp.value = 12; 
            if (v < 1) this.dom.hInp.value = 1 
        }
        else { 
            if (v > 23) this.dom.hInp.value = 23; 
            if (v < 0) this.dom.hInp.value = 0 
        }
    }

    add() {
        let h = parseInt(this.dom.hInp.value) || 0, m = parseInt(this.dom.mInp.value) || 0;
        if (!app.globalCtrl.is24Hour) { 
            if (this.alarmAmpmState === 'PM' && h < 12) h += 12; 
            if (this.alarmAmpmState === 'AM' && h === 12) h = 0 
        }
        state.addAlarm({ id: Date.now(), time24: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, active: true, triggeredToday: false });
    }

    render() {
        if (!this.dom.list) return;
        this.dom.list.innerHTML = '';
        
        if (!state.data.alarms.length) { 
            this.dom.list.innerHTML = '<p class="text-sm font-bold opacity-50 text-center uppercase mt-8">No alarms set.</p>'; 
            return 
        }
        
        const frag = document.createDocumentFragment();
        
        state.data.alarms.sort((a, b) => a.time24.localeCompare(b.time24)).forEach(a => {
            const c = document.getElementById('tpl-alarm').content.cloneNode(true), li = c.querySelector('li');
            li.dataset.id = a.id; 
            if (!a.active) li.classList.add('opacity-40');
            
            c.querySelector('.time-disp').textContent = app.clockComp ? app.clockComp.formatTime(a.time24) : a.time24;
            
            const sz = c.querySelector('.snooze-disp'); 
            if (a.snoozeMins > 0 && a.active) { 
                sz.textContent = `+ ${a.snoozeMins}m`; 
                sz.classList.remove('hidden') 
            }
            
            c.querySelector('.btn-toggle').textContent = a.active ? 'Off' : 'On'; 
            frag.appendChild(c);
        });
        
        this.dom.list.appendChild(frag);
    }
}