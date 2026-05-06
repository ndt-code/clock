import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class GlobalController {
    constructor() {
        this.is24Hour = true;
        this.audioCtx = null;
        this.alertInterval = null;
        this.theme = localStorage.theme || 'light';
        this.dom = {};
        this.initDOM();
        this.init();
    }
    initDOM() {
        this.dom = UIUtils.bindDOM({
            lbl1224: 'lbl-12-24',
            toast: 'toast',
            alertModal: 'alert-modal',
            alertTitle: 'alert-title',
            alertMsg: 'alert-msg',
            alertSnoozeAlarm: 'alert-snooze-alarm',
            alertSnoozeTimer: 'alert-snooze-timer',
            alertMainBtns: 'alert-main-btns',
            alertFocusBtns: 'alert-focus-btns',
            snoozeH: 'snooze-t-h',
            snoozeM: 'snooze-t-m',
            snoozeS: 'snooze-t-s',
            btnRingtoneMenu: 'btn-ringtone-menu',
            ringtoneModal: 'ringtone-modal',
            btnCloseRingtone: 'btn-close-ringtone'
        });
        this.dom.ringtoneBtns = document.querySelectorAll('.ringtone-btn');
    }
    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }
    init() {
        document.getElementById('btn-export-data')?.addEventListener('click', () => this.exportData());
        document.getElementById('btn-import-data')?.addEventListener('click', () => this.importData());
        ['snooze-t-h', 'snooze-t-m', 'snooze-t-s'].forEach(id => UIUtils.setupNum(document.getElementById(id)));
        document.addEventListener('contextmenu', e => {
            if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
        });
        if (this.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
        document.getElementById('theme-toggle-menu')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('btn-toggle-12-24-menu')?.addEventListener('click', () => this.toggleTimeFormat());
        const btnSet = document.getElementById('btn-settings-menu');
        const popSet = document.getElementById('settings-popup');
        const iconSet = document.getElementById('icon-settings-chevron');
        if (btnSet && popSet) {
            btnSet.addEventListener('click', (e) => {
                e.stopPropagation();
                popSet.classList.toggle('opacity-0'); popSet.classList.toggle('invisible');
                popSet.classList.toggle('pointer-events-none'); popSet.classList.toggle('scale-95');
                popSet.classList.toggle('scale-100'); iconSet.classList.toggle('rotate-180');
            });
            document.addEventListener('click', (e) => {
                if (!popSet.contains(e.target) && e.target !== btnSet) {
                    popSet.classList.add('opacity-0', 'invisible', 'pointer-events-none', 'scale-95');
                    popSet.classList.remove('scale-100'); iconSet.classList.remove('rotate-180');
                }
            });
        }
        document.getElementById('btn-focus')?.addEventListener('click', () => { document.body.classList.add('focus-mode'); document.getElementById('btn-unfocus').classList.remove('hidden') });
        document.getElementById('btn-unfocus')?.addEventListener('click', () => { document.body.classList.remove('focus-mode'); document.getElementById('btn-unfocus').classList.add('hidden') });
        document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => this.switchTab(b))); document.addEventListener('click', () => this.requestNoti(), { once: true });
        document.getElementById('btn-todo-desk')?.addEventListener('click', () => this.toggleTodoSidebar(true));
        document.getElementById('btn-todo-mob')?.addEventListener('click', () => this.toggleTodoSidebar(true));
        document.getElementById('btn-close-todo')?.addEventListener('click', () => this.toggleTodoSidebar(false));
        document.addEventListener('keydown', e => {
            const isInput = ['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName);
            if (e.key === 'Escape') {
                const td = document.getElementById('todo-sidebar');
                if (td && !td.classList.contains('md:translate-x-[120%]')) {
                    if (!document.getElementById('todo-detail-view').classList.contains('hidden')) { if (app.todoComp) app.todoComp.backToMain() }
                    else { this.toggleTodoSidebar(false) }
                    return;
                }
                document.querySelectorAll('.modal-bg:not(.hidden)').forEach(m => { if (m.id === 'quit-modal') { if (app.focusComp) app.focusComp.cancelQuit(); else UIUtils.closeModal(m) } else if (m.id !== 'alert-modal' && m.id !== 'pause-modal') UIUtils.closeModal(m) });
                if (app.musicPlayer && app.musicPlayer.isOpen) app.musicPlayer.togglePanel(false);
            }
            if (e.key === 'Enter') {
                const am = document.getElementById('alert-modal'), cd = document.getElementById('cd-edit-modal'), pm = document.getElementById('preset-modal'), fpm = document.getElementById('focus-preset-modal'), cm = document.getElementById('congrats-modal');
                if (am && !am.classList.contains('hidden')) { if (app.currentAlertType === 'focus') document.getElementById('alert-focus-confirm')?.click(); else this.stopAlert(); return }
                if (cd && !cd.classList.contains('hidden')) { document.getElementById('btn-save-cd')?.click(); return } if (pm && !pm.classList.contains('hidden')) { document.getElementById('btn-save-presets')?.click(); return }
                if (fpm && !fpm.classList.contains('hidden')) { document.getElementById('btn-close-focus-preset-2')?.click(); return } if (cm && !cm.classList.contains('hidden')) { document.getElementById('btn-close-congrats')?.click(); return }
                if (document.activeElement && document.activeElement.id === 'music-url') { document.getElementById('btn-load-music')?.click(); document.activeElement.blur(); return }
                if (document.activeElement && document.activeElement.id === 'todo-cat-input') { document.getElementById('btn-add-cat-new')?.click(); return }
                if (document.activeElement && document.activeElement.id === 'todo-task-input') { document.getElementById('btn-add-task')?.click(); return }
                if (document.body.getAttribute('data-active-tab') === 'alarm' && isInput) { const btn = window.innerWidth >= 1000 ? document.getElementById('btn-add-alarm-d') : document.getElementById('btn-add-alarm-m'); btn?.click() }
            }
            if (e.key === ' ' && !isInput) {
                e.preventDefault();
                const t = document.body.getAttribute('data-active-tab');
                window.dispatchEvent(new CustomEvent('app:togglePlay', { detail: { tab: t } }));
            }
        });
        document.querySelectorAll('.modal-bg').forEach(m => { if (m) m.addEventListener('click', e => { if (e.target === m) { if (m.id === 'quit-modal') { if (app.focusComp) app.focusComp.cancelQuit(); else UIUtils.closeModal(m) } else if (m.id !== 'alert-modal' && m.id !== 'pause-modal') UIUtils.closeModal(m) } }) });
        document.getElementById('music-backdrop')?.addEventListener('click', () => { const td = document.getElementById('todo-sidebar'); if (td && !td.classList.contains('md:translate-x-[120%]')) { this.toggleTodoSidebar(false) } });
        document.getElementById('btn-stop-alert-1')?.addEventListener('click', () => this.stopAlert()); document.getElementById('btn-stop-alert-2')?.addEventListener('click', () => this.stopAlert()); document.getElementById('btn-stop-alert-3')?.addEventListener('click', () => this.stopAlert());
        document.getElementById('btn-show-snooze')?.addEventListener('click', () => { this.dom.alertMainBtns.classList.replace('flex', 'hidden'); if (app.currentAlertType === 'alarm') this.dom.alertSnoozeAlarm.classList.replace('hidden', 'flex'); else if (app.currentAlertType === 'timer') this.dom.alertSnoozeTimer.classList.replace('hidden', 'flex') });
        document.querySelectorAll('#alert-snooze-alarm button[data-action="snooze"]').forEach(b => b.addEventListener('click', e => {
            const addedSnooze = parseInt(e.target.dataset.time);
            let targetAlarm = null;
            let currentSnooze = 0;
            if (app.currentAlertAlarmId) {
                targetAlarm = state.data.alarms.find(x => x.id === app.currentAlertAlarmId);
                if (targetAlarm) currentSnooze = targetAlarm.snoozeMins || 0;
            }
            this.stopAlert();
            if (targetAlarm) {
                targetAlarm.snoozeMins = currentSnooze + addedSnooze;
                state.notify('alarms');
                app.alarmSnoozeTimeout = setTimeout(() => this.startAlert("ALARM SNOOZED!", `Wake up!`, false, 'alarm', targetAlarm.id), addedSnooze * 60000);
            }
        }));
        document.getElementById('btn-snooze-timer-apply')?.addEventListener('click', () => { this.stopAlert(); const h = parseInt(this.dom.snoozeH.value) || 0, m = parseInt(this.dom.snoozeM.value) || 0, s = parseInt(this.dom.snoozeS.value) || 0, ms = (h * 3600 + m * 60 + s) * 1000; if (ms > 0) { app.timerComp.remainingMs = ms; app.timerComp.totalMs = ms; app.timerComp.start() } });
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', () => { const isT = app.timerComp?.isRunning, isS = app.swComp?.isRunning, isF = app.focusComp?.isRunning || app.focusComp?.state !== 'idle'; if (isT || isS || isF) { if (confirm("Process running. Quit?")) window.history.back(); else window.history.pushState(null, null, window.location.href) } });
        window.addEventListener('beforeunload', e => { const isT = app.timerComp?.isRunning, isS = app.swComp?.isRunning, isF = app.focusComp?.isRunning || app.focusComp?.state !== 'idle'; if (isT || isS || isF) { e.preventDefault(); e.returnValue = ''; return '' } });
        this.dom.btnRingtoneMenu?.addEventListener('click', () => {
            this.updateRingtoneUI();
            UIUtils.openModal(this.dom.ringtoneModal);
        });
        this.dom.btnCloseRingtone?.addEventListener('click', () => UIUtils.closeModal(this.dom.ringtoneModal));
        this.dom.ringtoneBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                localStorage.setItem('ringtone', e.target.dataset.tone);
                this.updateRingtoneUI();
                this.playBeep(true);
            });
        });
        window.addEventListener('app:triggerAlert', (e) => {
            const { title, msg, type, id } = e.detail;
            this.startAlert(title, msg, false, type, id);
        });
    }
    toggleTodoSidebar(open) {
        const s = document.getElementById('todo-sidebar'), b = document.getElementById('music-backdrop');
        if (open) {
            if (app.musicPlayer && app.musicPlayer.isOpen) app.musicPlayer.togglePanel(false);
            s.classList.remove('translate-y-[120%]', 'md:translate-x-[120%]'); b.classList.remove('hidden');
            if (typeof UIUtils !== 'undefined') UIUtils.trapFocus('todo-sidebar');
        }
        else { s.classList.add('translate-y-[120%]', 'md:translate-x-[120%]'); b.classList.add('hidden') }
    }
    toast(msg) { this.dom.toast.innerText = msg; this.dom.toast.classList.remove('opacity-0'); setTimeout(() => this.dom.toast.classList.add('opacity-0'), 3000) }
    toggleDarkMode() { document.documentElement.classList.toggle('dark'); localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
    toggleTimeFormat() {
        this.is24Hour = !this.is24Hour;
        if (this.dom.lbl1224) this.dom.lbl1224.innerText = this.is24Hour ? "24" : "12";
        window.dispatchEvent(new CustomEvent('timeFormatChanged'));
    }
    switchTab(btn) {
        const target = btn.getAttribute('data-target').split('-')[1]; document.body.setAttribute('data-active-tab', target); if (target !== 'alarm') this.dom.toast.classList.add('opacity-0');
        document.querySelectorAll('.tab-btn').forEach(b => { const isM = b.parentElement.id === 'main-tabs'; if (isM) { b.classList.remove('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black', 'border-black', 'dark:border-white'); b.classList.add('border-transparent') } else { b.classList.remove('text-black', 'dark:text-white'); b.classList.add('text-gray-400', 'dark:text-gray-500') } });
        document.querySelectorAll(`.tab-btn[data-target="tab-${target}"]`).forEach(b => { if (b.parentElement.id === 'main-tabs') { b.classList.add('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black', 'border-black', 'dark:border-white'); b.classList.remove('border-transparent') } else { b.classList.add('text-black', 'dark:text-white'); b.classList.remove('text-gray-400', 'dark:text-gray-500') } });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden', 'flex')); document.getElementById('tab-' + target).classList.remove('hidden'); document.getElementById('tab-' + target).classList.add('flex');
    }
    requestNoti() { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission() }
    playBeep(isTest = false) {
        if (!this.audioCtx) return;
        const type = localStorage.getItem('ringtone') || 'beep';
        const o = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        o.connect(g);
        g.connect(this.audioCtx.destination);
        const now = this.audioCtx.currentTime;
        if (type === 'beep') {
            o.type = 'sine';
            o.frequency.setValueAtTime(880, now);
            o.frequency.exponentialRampToValueAtTime(440, now + 0.5);
            g.gain.setValueAtTime(0.3, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            o.start(now);
            o.stop(now + 0.5);
        } else if (type === 'digital') {
            o.type = 'square';
            o.frequency.setValueAtTime(600, now);
            o.frequency.setValueAtTime(600, now + 0.15);
            o.frequency.exponentialRampToValueAtTime(800, now + 0.16);
            o.frequency.setValueAtTime(800, now + 0.3);
            o.frequency.exponentialRampToValueAtTime(600, now + 0.31);
            g.gain.setValueAtTime(0.1, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            o.start(now);
            o.stop(now + 0.4);
        } else if (type === 'marimba') {
            o.type = 'sine';
            o.frequency.setValueAtTime(400, now);
            o.frequency.setValueAtTime(800, now + 0.1);
            g.gain.setValueAtTime(0.5, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            o.start(now);
            o.stop(now + 0.5);
        }
        if (isTest) {
            setTimeout(() => {
                if(this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
            }, 10);
        }
    }
    startAlert(t, m, revisit, type = 'alarm', id = null) {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        app.currentAlertType = type;
        app.currentAlertAlarmId = id;
        this.initAudio();
        this.dom.alertTitle.innerText = t;
        this.dom.alertMsg.innerText = m;
        this.dom.alertSnoozeAlarm.classList.replace('flex', 'hidden');
        this.dom.alertSnoozeTimer.classList.replace('flex', 'hidden');
        this.dom.alertMainBtns.classList.replace('hidden', 'flex');
        const sBtn = document.getElementById('btn-show-snooze');
        if (sBtn) sBtn.classList.toggle('hidden', !(type === 'alarm' || type === 'timer'));
        UIUtils.openModal(this.dom.alertModal);
        this.playBeep();
        this.alertInterval = UIUtils.clearTask(this.alertInterval);
        this.alertInterval = setInterval(() => this.playBeep(), 1000);
        if (!revisit && document.hidden && "Notification" in window && Notification.permission === "granted") {
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
        if (app.currentAlertType === 'alarm' && app.currentAlertAlarmId) {
            const a = state.data.alarms.find(x => x.id === app.currentAlertAlarmId);
            if (a) { a.snoozeMins = 0; state.notify('alarms'); app.alarmSnoozeTimeout = UIUtils.clearTask(app.alarmSnoozeTimeout) }
        }
    }
    exportData() {
        const data = {
             alarms: UIUtils.getSafeData('alarms', []),
             countdowns: UIUtils.getSafeData('countdowns', []),
             timerPresets: UIUtils.getSafeData('timerPresets', []),
             focusPresets: UIUtils.getSafeData('focusPresets', []),
             todoList: UIUtils.getSafeData('todoList', []),
            ringtone: localStorage.getItem('ringtone') || 'beep',
            mediaVol: parseInt(localStorage.getItem('mediaVol') || 100)
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `study_clock_data_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); this.toast("Data exported!");
    }
    importData() {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result); if (!confirm("Merge data?")) return;
                    const mergeArray = (key, newArr) => {
                        if (!Array.isArray(newArr)) return; let oldArr = UIUtils.getSafeData(key, []); let merged = [...oldArr];
                        newArr.forEach(newItem => {
                            if (newItem.id) { const idx = merged.findIndex(x => x.id === newItem.id); if (idx !== -1) merged[idx] = newItem; else merged.push(newItem); }
                            else { const strNew = JSON.stringify(newItem); if (!merged.some(x => JSON.stringify(x) === strNew)) merged.push(newItem); }
                        });
                        localStorage.setItem(key, JSON.stringify(merged));
                    };
                    mergeArray('alarms', data.alarms); mergeArray('countdowns', data.countdowns); mergeArray('timerPresets', data.timerPresets); mergeArray('focusPresets', data.focusPresets); mergeArray('todoList', data.todoList);
                    if (data.ringtone) localStorage.setItem('ringtone', data.ringtone);
                    if (data.mediaVol !== undefined) localStorage.setItem('mediaVol', data.mediaVol);
                    this.toast("Complete! Loading data..."); setTimeout(() => window.location.reload(), 1500);
                } catch (err) { this.toast("Invalid data!"); }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    updateRingtoneUI() {
        const currentTone = localStorage.getItem('ringtone') || 'beep';
        this.dom.ringtoneBtns?.forEach(btn => {
            if (btn.dataset.tone === currentTone) {
                btn.classList.add('border-black', 'dark:border-white', 'bg-gray-100', 'dark:bg-gray-800');
                btn.classList.remove('border-black/10', 'dark:border-white/10', 'bg-transparent');
            } else {
                btn.classList.add('border-black/10', 'dark:border-white/10', 'bg-transparent');
                btn.classList.remove('border-black', 'dark:border-white', 'bg-gray-100', 'dark:bg-gray-800');
            }
        });
    }
}