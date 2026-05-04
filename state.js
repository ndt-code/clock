import { UIUtils } from './utils.js';

export class AppState {
    constructor() {
        let a = UIUtils.getSafeData('alarms', []),
            c = UIUtils.getSafeData('countdowns', []),
            tp = UIUtils.getSafeData('timerPresets', [{h: 0, m: 30}, {h: 1, m: 0}, {h: 1, m: 30}]),
            fp = UIUtils.getSafeData('focusPresets', [{h: 0, m: 45, bm: 5, r: 3}, {h: 1, m: 0, bm: 10, r: 3}]),
            td = UIUtils.getSafeData('todoList', []);
        this.data = {
            alarms: (Array.isArray(a) ? a : []).filter(x => x && typeof x.time24 === 'string'),
            countdowns: Array.isArray(c) ? c : [],
            timerPresets: Array.isArray(tp) ? tp : [],
            focusPresets: Array.isArray(fp) ? fp : [],
            todo: Array.isArray(td) ? td : []
        };
        this.listeners = [];
        this.saveTimeouts = {};
    }
    subscribe(f) { this.listeners.push(f) }
    notify(key) {
        this.listeners.forEach(f => f());
        const scheduleSave = (k, dataKey, storageKey) => {
            if (!key || key === k) {
                if (this.saveTimeouts[k]) clearTimeout(this.saveTimeouts[k]);
                this.saveTimeouts[k] = setTimeout(() => {
                    localStorage.setItem(storageKey, JSON.stringify(this.data[dataKey]));
                }, 500);
            }
        };
        scheduleSave('alarms', 'alarms', 'alarms');
        scheduleSave('countdowns', 'countdowns', 'countdowns');
        scheduleSave('timerPresets', 'timerPresets', 'timerPresets');
        scheduleSave('focusPresets', 'focusPresets', 'focusPresets');
        scheduleSave('todo', 'todo', 'todoList');
    }
    addAlarm(a) { this.data.alarms.push(a); this.notify('alarms') }
    deleteAlarm(i) { this.data.alarms = this.data.alarms.filter(a => a.id !== i); this.notify('alarms') }
    toggleAlarm(i) {
        const a = this.data.alarms.find(x => x.id === i);
        if (a) {
            a.active = !a.active;
            a.triggeredToday = false;
            if (!a.active) {
                a.snoozeMins = 0;
            }
        }
        this.notify('alarms');
    }
    sortTodoCat(dir) { this.data.todo.sort((a, b) => dir === 'asc' ? a.id - b.id : b.id - a.id); this.notify('todo') }
    addTodoCat() {
        const cat = { id: Date.now(), title: '', tasks: [], pinned: false };
        this.data.todo.unshift(cat);
        this.notify('todo'); return cat.id;
    }
    renameTodoCat(id, title) { const c = this.data.todo.find(x => x.id === id); if (c) { c.title = title; this.notify('todo') } }
    deleteTodoCat(id) { this.data.todo = this.data.todo.filter(c => c.id !== id); this.notify('todo') }
    pinTodoCat(id) { const c = this.data.todo.find(x => x.id === id); if (c) { c.pinned = !c.pinned; this.notify('todo') } }
    addTodoTask(catId, text) { const c = this.data.todo.find(x => x.id === catId); if (c) { c.tasks.unshift({ id: Date.now(), text, done: false }); this.notify('todo') } }
    toggleTodoTask(catId, taskId) { const c = this.data.todo.find(x => x.id === catId); if (c) { const t = c.tasks.find(x => x.id === taskId); if (t) t.done = !t.done; this.notify('todo') } }
    deleteTodoTask(catId, taskId) { const c = this.data.todo.find(x => x.id === catId); if (c) { c.tasks = c.tasks.filter(x => x.id !== taskId); this.notify('todo') } }
}
export const state = new AppState();
