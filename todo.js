import { UIUtils } from './utils.js';
import { state } from './state.js';
import { app } from './context.js';

export class TodoComponent {
    constructor() {
        this.activeCatId = null;
        this.isFocusTodoOpen = false;
        this.currentSortDir = 'desc';
        this.catSortables = [];
        this.taskSortables = [];
        this.dom = {};
        this.initDOM();
        this.init();
    }

    initDOM() {
        this.dom.addCatBtn = document.getElementById('btn-add-cat-new');
        this.dom.addTaskBtn = document.getElementById('btn-add-task');
        this.dom.taskInp = document.getElementById('todo-task-input');
        this.dom.backBtn = document.getElementById('btn-todo-back');
        this.dom.toggleFocTodoBtn = document.getElementById('btn-toggle-focus-todo');
        this.dom.sortBtn = document.getElementById('btn-todo-sort');
        this.dom.titleInp = document.getElementById('todo-detail-title-input');
        this.dom.mainView = document.getElementById('todo-main-view');
        this.dom.detailView = document.getElementById('todo-detail-view');
        this.dom.pinList = document.getElementById('todo-category-pinned-list');
        this.dom.actList = document.getElementById('todo-category-list');
        this.dom.cmpList = document.getElementById('todo-category-completed-list');
        this.dom.pinSec = document.getElementById('todo-pinned-section');
        this.dom.actSec = document.getElementById('todo-active-section');
        this.dom.cmpSec = document.getElementById('todo-completed-cat-section');
        this.dom.taskList = document.getElementById('todo-task-list');
        this.dom.cmpTaskList = document.getElementById('todo-task-completed-list');
        this.dom.cmpTaskSec = document.getElementById('todo-completed-task-section');
        this.dom.focCont = document.getElementById('focus-todo-content');
        this.dom.focSide = document.getElementById('focus-todo-side');
        this.dom.focClock = document.getElementById('focus-clock-side');
    }

    init() {
        this.dom.addCatBtn?.addEventListener('click', () => { const id = state.addTodoCat(); this.openCat(id); setTimeout(() => this.dom.titleInp?.focus(), 50) });
        this.dom.addTaskBtn?.addEventListener('click', () => this.addTask());
        this.dom.taskInp?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.addTask() } });
        this.dom.backBtn?.addEventListener('click', () => this.backToMain());
        this.dom.toggleFocTodoBtn?.addEventListener('click', () => this.toggleFocusTodo());

        if (this.dom.sortBtn) {
            this.dom.sortBtn.addEventListener('click', () => {
                this.currentSortDir = this.currentSortDir === 'desc' ? 'asc' : 'desc';
                this.dom.sortBtn.innerText = this.currentSortDir === 'desc' ? '↓' : '↑';
                state.sortTodoCat(this.currentSortDir)
            });
        }

        if (this.dom.titleInp) {
            this.dom.titleInp.addEventListener('input', e => { if (this.activeCatId) state.renameTodoCat(this.activeCatId, e.target.value) });
            this.dom.titleInp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.dom.taskInp?.focus() } });
        }

        const handleCategoryClick = (e) => {
            const li = e.target.closest('li[data-id]');
            if (!li) return;

            const catId = Number(li.dataset.id);

            if (e.target.closest('.btn-del-cat')) {
                e.stopPropagation();
                state.deleteTodoCat(catId);
                return;
            }

            if (e.target.closest('.btn-pin-cat')) {
                e.stopPropagation();
                state.pinTodoCat(catId);
                return;
            }

            if (!e.target.closest('.cat-drag-handle')) {
                this.openCat(catId);
            }
        };

        if (this.dom.pinList) this.dom.pinList.addEventListener('click', handleCategoryClick);
        if (this.dom.actList) this.dom.actList.addEventListener('click', handleCategoryClick);
        if (this.dom.cmpList) this.dom.cmpList.addEventListener('click', handleCategoryClick);

        const handleTaskClick = (e) => {
            const li = e.target.closest('li[data-id]');
            if (!li || !this.activeCatId) return;

            const taskId = Number(li.dataset.id);

            if (e.target.closest('.btn-del-task')) {
                state.deleteTodoTask(this.activeCatId, taskId);
                return;
            }

            if (!e.target.closest('.btn-del-task') && !e.target.closest('.task-drag-handle')) {
                state.toggleTodoTask(this.activeCatId, taskId);
                return;
            }
        };

        if (this.dom.taskList) this.dom.taskList.addEventListener('click', handleTaskClick);
        if (this.dom.cmpTaskList) this.dom.cmpTaskList.addEventListener('click', handleTaskClick);

        const handleFocusClick = (e) => {
            const pinBtn = e.target.closest('.btn-focus-pin');
            if (pinBtn) {
                const catDiv = e.target.closest('div[data-cat-id]');
                if (catDiv) {
                    state.pinTodoCat(Number(catDiv.dataset.catId));
                }
                return;
            }

            const taskLi = e.target.closest('li[data-task-id]');
            if (taskLi) {
                state.toggleTodoTask(Number(taskLi.dataset.catId), Number(taskLi.dataset.taskId));
                return;
            }
        };

        if (this.dom.focCont) this.dom.focCont.addEventListener('click', handleFocusClick);
        
        state.subscribe(() => { this.renderSidebar(); this.renderFocus() });
        this.renderFocus();
        this.renderSidebar();
    }

    initSortable() {
        this.catSortables.forEach(s => s.destroy());
        this.taskSortables.forEach(s => s.destroy());
        this.catSortables = [];
        this.taskSortables = [];

        if (typeof Sortable === 'undefined') return;

        [this.dom.pinList, this.dom.actList].forEach(el => {
            if (el) this.catSortables.push(Sortable.create(el, { handle: '.cat-drag-handle', animation: 150, delay: window.innerWidth < 1000 ? 200 : 0, delayOnTouchOnly: true, onEnd: () => this.syncCatOrder() }))
        });

        [this.dom.taskList, this.dom.cmpTaskList].forEach(el => {
            if (el) this.taskSortables.push(Sortable.create(el, { handle: '.task-drag-handle', animation: 150, delay: window.innerWidth < 1000 ? 200 : 0, delayOnTouchOnly: true, onEnd: () => this.syncTaskOrder() }))
        });
    }

    syncCatOrder() {
        const newOrder = [];
        document.querySelectorAll('#todo-category-pinned-list li, #todo-category-list li, #todo-category-completed-list li').forEach(li => {
            const id = Number(li.dataset.id);
            const cat = state.data.todo.find(c => c.id === id);
            if (cat) newOrder.push(cat)
        });
        if (newOrder.length === state.data.todo.length) {
            state.data.todo = newOrder;
            state.notify('todo')
        }
    }

    syncTaskOrder() {
        const cat = state.data.todo.find(x => x.id === this.activeCatId);
        if (!cat) return;
        const newOrder = [];
        document.querySelectorAll('#todo-task-list li, #todo-task-completed-list li').forEach(li => {
            const id = Number(li.dataset.id);
            const task = cat.tasks.find(t => t.id === id);
            if (task) newOrder.push(task)
        });
        if (newOrder.length === cat.tasks.length) {
            cat.tasks = newOrder;
            state.notify('todo')
        }
    }

    addTask() {
        if (this.dom.taskInp && this.dom.taskInp.value.trim() && this.activeCatId) {
            state.addTodoTask(this.activeCatId, this.dom.taskInp.value.trim());
            this.dom.taskInp.value = ''
        }
    }

    backToMain() {
        this.activeCatId = null;
        if (this.dom.mainView) {
            this.dom.mainView.classList.remove('hidden');
            this.dom.mainView.classList.add('flex')
        }
        if (this.dom.detailView) {
            this.dom.detailView.classList.add('hidden');
            this.dom.detailView.classList.remove('flex')
        }
        if (this.dom.backBtn) this.dom.backBtn.classList.add('hidden');
        state.data.todo = state.data.todo.filter(c => c.title.trim() !== '' || c.tasks.length > 0);
        state.notify('todo')
    }

    openCat(id) {
        this.activeCatId = id;
        const cat = state.data.todo.find(x => x.id === id);
        if (this.dom.titleInp) this.dom.titleInp.value = cat.title;
        if (this.dom.mainView) {
            this.dom.mainView.classList.add('hidden');
            this.dom.mainView.classList.remove('flex')
        }
        if (this.dom.detailView) {
            this.dom.detailView.classList.remove('hidden');
            this.dom.detailView.classList.add('flex')
        }
        if (this.dom.backBtn) this.dom.backBtn.classList.remove('hidden');
        this.renderTasks()
    }

    toggleFocusTodo() {
        this.isFocusTodoOpen = !this.isFocusTodoOpen;
        if (this.dom.focSide && this.dom.focClock) {
            if (this.isFocusTodoOpen) {
                this.dom.focClock.style.width = 'calc(100% - 320px)';
                this.dom.focSide.style.width = '320px';
                this.dom.focSide.style.opacity = '1';
                this.dom.focSide.style.borderLeftWidth = '4px'
            } else {
                this.dom.focClock.style.width = '100%';
                this.dom.focSide.style.width = '0';
                this.dom.focSide.style.opacity = '0';
                this.dom.focSide.style.borderLeftWidth = '0px'
            }
        }
    }

    renderSidebar() {
        if (!this.dom.pinList || !this.dom.actList || !this.dom.cmpList) return;

        this.dom.pinList.innerHTML = '';
        this.dom.actList.innerHTML = '';
        this.dom.cmpList.innerHTML = '';

        let pinC = 0, actC = 0, cmpC = 0;

        const fragPin = document.createDocumentFragment();
        const fragAct = document.createDocumentFragment();
        const fragCmp = document.createDocumentFragment();

        state.data.todo.forEach(c => {
            const isCompleted = c.tasks.length > 0 && c.tasks.every(t => t.done);
            const t = document.getElementById('tpl-todo-cat').content.cloneNode(true);
            const li = t.querySelector('li');
            li.dataset.id = c.id;

            t.querySelector('.cat-title').innerText = c.title || 'Untitled';

            const pinBtn = t.querySelector('.btn-pin-cat');
            if (c.pinned) {
                pinBtn.classList.replace('text-gray-400', 'text-yellow-500');
                pinBtn.classList.replace('opacity-0', 'opacity-100');
                t.querySelector('.icon-pin').setAttribute('fill', 'currentColor')
            }

            const preview = t.querySelector('.cat-preview');
            c.tasks.slice(0, 4).forEach(tk => {
                const s = document.createElement('span');
                s.className = 'text-xs opacity-60 truncate' + (tk.done ? ' line-through' : '');
                s.innerText = '• ' + tk.text;
                preview.appendChild(s)
            });

            if (isCompleted) { fragCmp.appendChild(t); cmpC++ }
            else if (c.pinned) { fragPin.appendChild(t); pinC++ }
            else { fragAct.appendChild(t); actC++ }
        });

        this.dom.pinList.appendChild(fragPin);
        this.dom.actList.appendChild(fragAct);
        this.dom.cmpList.appendChild(fragCmp);

        const emptyMsg = document.getElementById('todo-empty-msg');
        if (pinC === 0 && actC === 0 && cmpC === 0) {
            if (!emptyMsg && this.dom.mainView) {
                const msg = document.createElement('div');
                msg.id = 'todo-empty-msg';
                msg.className = 'flex flex-col items-center justify-center opacity-50 py-10 mt-10';
                msg.innerHTML = '<span class="text-5xl mb-4">📝</span><p class="font-bold uppercase tracking-widest text-center">Your list is empty.<br>Add a category to begin!</p>';
                this.dom.mainView.insertBefore(msg, this.dom.mainView.children[1])
            }
        } else if (emptyMsg) {
            emptyMsg.remove()
        }

        if (this.dom.pinSec) this.dom.pinSec.classList.toggle('hidden', pinC === 0);
        if (this.dom.actSec) this.dom.actSec.classList.toggle('hidden', actC === 0);
        if (this.dom.cmpSec) this.dom.cmpSec.classList.toggle('hidden', cmpC === 0);

        this.initSortable();
        if (this.activeCatId) this.renderTasks();
    }

    renderTasks() {
        if (!this.dom.taskList || !this.dom.cmpTaskList) return;

        this.dom.taskList.innerHTML = '';
        this.dom.cmpTaskList.innerHTML = '';

        let cmpC = 0;
        const cat = state.data.todo.find(x => x.id === this.activeCatId);
        if (!cat) return;

        const fragTask = document.createDocumentFragment();
        const fragCmpTask = document.createDocumentFragment();

        cat.tasks.forEach(tk => {
            const t = document.getElementById('tpl-todo-task').content.cloneNode(true);
            const li = t.querySelector('li');
            li.dataset.id = tk.id;

            const cb = t.querySelector('.task-check');
            cb.checked = tk.done;

            const span = t.querySelector('.task-text');
            span.innerText = tk.text;
            if (tk.done) span.classList.add('line-through', 'opacity-50');

            if (tk.done) { fragCmpTask.appendChild(t); cmpC++ }
            else { fragTask.appendChild(t) }
        });

        this.dom.taskList.appendChild(fragTask);
        this.dom.cmpTaskList.appendChild(fragCmpTask);

        if (this.dom.cmpTaskSec) this.dom.cmpTaskSec.classList.toggle('hidden', cmpC === 0);
        this.initSortable();
    }

    renderFocus() {
        if (!this.dom.focCont) return;
        this.dom.focCont.innerHTML = '';

        let hasContent = false;
        const sortedCats = [...state.data.todo].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        const fragFocus = document.createDocumentFragment();

        sortedCats.forEach(c => {
            if (c.tasks.length === 0) return;
            hasContent = true;
            const isCompleted = c.tasks.every(t => t.done);

            const div = document.createElement('div');
            div.className = `p-4 border-2 border-black dark:border-white rounded-2xl bg-gray-50 dark:bg-neutral-900 relative group transition-all ${isCompleted ? 'opacity-60 grayscale' : ''}`;
            div.dataset.catId = c.id;

            const header = document.createElement('div');
            header.className = 'flex justify-between items-start mb-3 gap-2';
            header.innerHTML = `<h5 class="font-bold uppercase text-sm tracking-widest font-oswald truncate flex-1">${UIUtils.esc(c.title) || 'Untitled'}</h5><button class="btn-focus-pin p-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-black dark:focus-visible:ring-white transition-opacity ${c.pinned ? 'text-yellow-500 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}" title="Pin/Unpin"><svg class="w-4 h-4" fill="${c.pinned ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg></button>`;

            div.appendChild(header);

            const ul = document.createElement('ul');
            ul.className = 'flex flex-col gap-2';

            c.tasks.forEach(tk => {
                const li = document.createElement('li');
                li.className = 'flex items-start gap-2 text-base leading-tight cursor-pointer hover:opacity-80 transition-opacity';
                li.dataset.taskId = tk.id;
                li.dataset.catId = c.id;
                li.innerHTML = `<input type="checkbox" class="mt-[5px] w-4 h-4 accent-black dark:accent-white shrink-0 cursor-pointer pointer-events-none" ${tk.done ? 'checked' : ''}><span class="${tk.done ? 'line-through opacity-40' : ''} break-words flex-1">${UIUtils.esc(tk.text)}</span>`;
                ul.appendChild(li)
            });

            div.appendChild(ul);
            fragFocus.appendChild(div);
        });

        if (!hasContent) {
            this.dom.focCont.innerHTML = '<p class="text-sm opacity-50 uppercase tracking-widest font-bold">No active tasks.</p>'
        } else {
            this.dom.focCont.appendChild(fragFocus);
        }
    }
}
