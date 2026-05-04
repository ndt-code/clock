import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class EventComponent {
    constructor() {
        this.currentSort = 'target_asc'; 
        this.cdAmpmState = 'AM'; 
        this.isInitialized = true;
        this.dom = {};
        this.initDOM();
        this.init();
    }

    initDOM() {
        this.dom.dayInp = document.getElementById('cd-day');
        this.dom.monthInp = document.getElementById('cd-month');
        this.dom.yearInp = document.getElementById('cd-year');
        this.dom.hourInp = document.getElementById('cd-hour');
        this.dom.minuteInp = document.getElementById('cd-minute');
        this.dom.hubDesk = document.getElementById('btn-cd-hub-desk');
        this.dom.hubMob = document.getElementById('btn-cd-hub-mob');
        this.dom.closeHub = document.getElementById('btn-close-cd-hub');
        this.dom.closeEdit = document.getElementById('btn-close-cd-edit');
        this.dom.addCd = document.getElementById('btn-add-cd');
        this.dom.saveCd = document.getElementById('btn-save-cd');
        this.dom.delCd = document.getElementById('btn-delete-cd');
        this.dom.ampmBtn = document.getElementById('btn-cd-ampm');
        this.dom.sortBtn = document.getElementById('btn-cd-sort');
        this.dom.sortMenu = document.getElementById('cd-sort-menu');
        this.dom.sortLbl = document.getElementById('cd-sort-label');
        this.dom.grid = document.getElementById('cd-grid');
        this.dom.pinCont = document.getElementById('pinned-cd-container');
        this.dom.hubModal = document.getElementById('cd-hub-modal');
        this.dom.editModal = document.getElementById('cd-edit-modal');
        this.dom.idInp = document.getElementById('cd-id-input');
        this.dom.titleInp = document.getElementById('cd-title-input');
        this.dom.goalInp = document.getElementById('cd-goal-input');
        this.dom.tabClock = document.getElementById('tab-clock');
    }

    init() {
        [this.dom.dayInp, this.dom.monthInp, this.dom.yearInp, this.dom.hourInp, this.dom.minuteInp].forEach(el => UIUtils.setupNum(el));
        this.dom.hubDesk?.addEventListener('click', () => UIUtils.openModal(this.dom.hubModal) || this.renderHub());
        this.dom.hubMob?.addEventListener('click', () => UIUtils.openModal(this.dom.hubModal) || this.renderHub());
        this.dom.closeHub?.addEventListener('click', () => UIUtils.closeModal(this.dom.hubModal));
        this.dom.closeEdit?.addEventListener('click', () => UIUtils.closeModal(this.dom.editModal));
        this.dom.addCd?.addEventListener('click', () => this.openEdit());
        this.dom.saveCd?.addEventListener('click', () => this.save());
        this.dom.delCd?.addEventListener('click', () => this.delete());
        
        this.dom.ampmBtn?.addEventListener('click', () => { 
            this.cdAmpmState = this.cdAmpmState === 'AM' ? 'PM' : 'AM'; 
            this.dom.ampmBtn.innerText = this.cdAmpmState 
        });
        
        if (this.dom.sortBtn && this.dom.sortMenu) {
            this.dom.sortBtn.addEventListener('click', e => { 
                e.stopPropagation(); 
                this.dom.sortMenu.classList.toggle('opacity-0'); 
                this.dom.sortMenu.classList.toggle('pointer-events-none') 
            });
            this.dom.sortMenu.querySelectorAll('button').forEach(b => {
                b.addEventListener('click', () => { 
                    this.currentSort = b.dataset.sort; 
                    this.dom.sortLbl.innerText = b.innerText; 
                    this.dom.sortMenu.classList.add('opacity-0', 'pointer-events-none'); 
                    this.renderHub() 
                });
            });
            document.addEventListener('click', () => this.dom.sortMenu.classList.add('opacity-0', 'pointer-events-none'));
        }
        
        if (this.dom.grid) {
            this.dom.grid.addEventListener('click', e => { 
                const pb = e.target.closest('.btn-pin'); 
                if (pb) { 
                    e.stopPropagation(); 
                    const id = parseInt(pb.dataset.id), c = state.data.countdowns.find(x => x.id === id); 
                    if (c) { 
                        c.pinned = !c.pinned; 
                        state.notify('countdowns'); 
                        this.renderHub(); 
                        this.updatePinned() 
                    } 
                    return 
                } 
                const card = e.target.closest('.cd-card'); 
                if (card) this.openEdit(parseInt(card.dataset.id)) 
            });
        }
        
        if (this.dom.pinCont) {
            this.dom.pinCont.addEventListener('click', e => { 
                const p = e.target.closest('.pinned-cd'); 
                if (p) this.openEdit(parseInt(p.dataset.id)) 
            });
        }
        
        window.addEventListener('timeFormatChanged', () => this.updateCdTimeMode()); 
        this.updatePinned();
    }

    updateCdTimeMode() { 
        if (app.globalCtrl.is24Hour) { 
            this.dom.hourInp.max = 23; 
            this.dom.hourInp.min = 0; 
            this.dom.ampmBtn?.classList.add('hidden') 
        } else { 
            this.dom.hourInp.max = 12; 
            this.dom.hourInp.min = 1; 
            this.dom.ampmBtn?.classList.remove('hidden'); 
            if(this.dom.ampmBtn) this.dom.ampmBtn.innerText = this.cdAmpmState 
        } 
    }

    openEdit(id = null) {
        this.updateCdTimeMode(); 
        UIUtils.openModal(this.dom.editModal);
        
        if (id) {
            const c = state.data.countdowns.find(x => x.id === id); 
            this.dom.idInp.value = id; 
            this.dom.titleInp.value = c.title; 
            this.dom.goalInp.value = c.goal || ''; 
            
            const d = new Date(c.target); 
            this.dom.dayInp.value = d.getDate(); 
            this.dom.monthInp.value = d.getMonth() + 1; 
            this.dom.yearInp.value = d.getFullYear();
            
            let hr = d.getHours(); 
            this.dom.minuteInp.value = d.getMinutes().toString().padStart(2, '0'); 
            
            if (!app.globalCtrl.is24Hour) { 
                this.cdAmpmState = hr >= 12 ? 'PM' : 'AM'; 
                hr = hr % 12 || 12; 
                if(this.dom.ampmBtn) this.dom.ampmBtn.innerText = this.cdAmpmState 
            } 
            
            this.dom.hourInp.value = hr.toString().padStart(2, '0'); 
            this.dom.delCd?.classList.remove('hidden');
        } else { 
            this.dom.idInp.value = ''; 
            this.dom.titleInp.value = ''; 
            this.dom.goalInp.value = ''; 
            this.dom.delCd?.classList.add('hidden'); 
            
            const n = new Date(); 
            this.dom.dayInp.value = n.getDate(); 
            this.dom.monthInp.value = n.getMonth() + 1; 
            this.dom.yearInp.value = n.getFullYear(); 
            this.dom.hourInp.value = ''; 
            this.dom.minuteInp.value = '' 
        }
    }

    save() {
        const title = this.dom.titleInp.value.trim() || 'Event', 
              dy = parseInt(this.dom.dayInp.value), 
              mo = parseInt(this.dom.monthInp.value), 
              yr = parseInt(this.dom.yearInp.value); 
        let hr = parseInt(this.dom.hourInp.value) || 0, 
            mi = parseInt(this.dom.minuteInp.value) || 0; 
            
        if (!app.globalCtrl.is24Hour) { 
            if (this.cdAmpmState === 'PM' && hr < 12) hr += 12; 
            if (this.cdAmpmState === 'AM' && hr === 12) hr = 0 
        } 
        
        const testDate = new Date(yr, mo - 1, dy, hr, mi); 
        if (testDate.getMonth() !== mo - 1 || testDate.getDate() !== dy || testDate.getFullYear() !== yr) { 
            app.globalCtrl.toast("Invalid date!"); 
            return 
        } 
        
        const tar = testDate.getTime(); 
        if (tar <= Date.now()) { 
            app.globalCtrl.toast("Must be a future date!"); 
            return 
        } 
        
        const id = this.dom.idInp.value; 
        if (id) { 
            const idx = state.data.countdowns.findIndex(x => x.id == id); 
            state.data.countdowns[idx] = { ...state.data.countdowns[idx], title, target: tar, goal: this.dom.goalInp.value.trim(), notified: false } 
        } else {
            state.data.countdowns.push({ id: Date.now(), title, target: tar, pinned: false, notified: false, goal: this.dom.goalInp.value.trim() }); 
        }
        
        state.notify('countdowns'); 
        UIUtils.closeModal(this.dom.editModal); 
        this.renderHub(); 
        this.updatePinned();
    }

    delete() { 
        const id = this.dom.idInp.value; 
        state.data.countdowns = state.data.countdowns.filter(x => x.id != id); 
        state.notify('countdowns'); 
        UIUtils.closeModal(this.dom.editModal); 
        this.renderHub(); 
        this.updatePinned() 
    }

    renderHub() { 
        if (!this.dom.grid) return; 
        this.dom.grid.innerHTML = ''; 
        let s = [...state.data.countdowns]; 
        
        if (s.length === 0) { 
            this.dom.grid.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center opacity-50 py-10 mt-10"><span class="text-5xl mb-4"> </span><p class="font-bold uppercase tracking-widest text-center">No events yet.<br>Click "Add New Event" to start!</p></div>'; 
            this.updateCDTimes(); 
            return 
        } 
        
        if (this.currentSort === 'target_asc') s.sort((a, b) => a.target - b.target); 
        else if (this.currentSort === 'target_desc') s.sort((a, b) => b.target - a.target); 
        else if (this.currentSort === 'newest') s.sort((a, b) => b.id - a.id); 
        else if (this.currentSort === 'oldest') s.sort((a, b) => a.id - b.id); 
        
        const frag = document.createDocumentFragment();
        
        s.forEach(c => { 
            const cl = document.getElementById('tpl-cd-card').content.cloneNode(true), card = cl.querySelector('.cd-card'); 
            card.dataset.id = c.id; 
            cl.querySelector('.cd-title').textContent = c.title; 
            
            const pb = cl.querySelector('.btn-pin'); 
            pb.dataset.id = c.id; 
            
            if (c.pinned) { 
                pb.classList.replace('text-gray-400', 'text-yellow-500'); 
                cl.querySelector('.icon-pin').setAttribute('fill', 'currentColor'); 
                card.classList.add('border-black', 'dark:border-white', 'bg-gray-100', 'dark:bg-gray-900') 
            } 
            
            ['d', 'h', 'm', 's'].forEach(k => cl.querySelector('.hub-' + k).id = 'hub-' + k + '-' + c.id); 
            frag.appendChild(cl);
        }); 
        
        this.dom.grid.appendChild(frag);
        this.updateCDTimes() 
    }

    updatePinned() { 
        if (!this.dom.pinCont) return; 
        this.dom.pinCont.innerHTML = ''; 
        const p = state.data.countdowns.filter(x => x.pinned).sort((a, b) => a.target - b.target); 
        
        if (this.dom.tabClock) { 
            this.dom.tabClock.classList.remove('pinned-1', 'pinned-2', 'pinned-3'); 
            if (p.length) this.dom.tabClock.classList.add(`pinned-${p.length}`) 
        } 
        
        const frag = document.createDocumentFragment();
        
        p.forEach(x => { 
            const cl = document.getElementById('tpl-pinned-cd').content.cloneNode(true), wr = cl.querySelector('.pinned-cd'); 
            wr.dataset.id = x.id; 
            cl.querySelector('.pin-title').textContent = x.title; 
            ['d', 'h', 'm', 's'].forEach(k => cl.querySelector('.pin-' + k).id = 'pin-' + k + '-' + x.id); 
            frag.appendChild(cl);
        }); 
        
        this.dom.pinCont.appendChild(frag);
        this.updateCDTimes() 
    }

    updateCDTimes() { 
        state.data.countdowns.forEach(c => { 
            const diff = c.target - Date.now(); 
            if (diff <= 0 && !c.notified && this.isInitialized) { 
                c.notified = true; 
                state.notify('countdowns'); 
                app.globalCtrl.startAlert(c.title, "Event is happening now!", false, 'event') 
            } 
            const t = this.getCDStr(c.target); 
            ['d', 'h', 'm', 's'].forEach(k => { 
                const h = document.getElementById('hub-' + k + '-' + c.id), p = document.getElementById('pin-' + k + '-' + c.id); 
                if (h) h.innerText = t[k]; 
                if (p) p.innerText = t[k] 
            }) 
        }) 
    }

    getCDStr(t) { 
        const d = Math.max(0, t - Date.now()), sec = Math.floor(d / 1000); 
        return { 
            d: Math.floor(sec / 86400).toString().padStart(2, '0'), 
            h: Math.floor((sec % 86400) / 3600).toString().padStart(2, '0'), 
            m: Math.floor((sec % 3600) / 60).toString().padStart(2, '0'), 
            s: (sec % 60).toString().padStart(2, '0') 
        } 
    }
}