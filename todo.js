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
        this.pendingDelete = null;
        this.initDOM();
        this.init();
    }

    initDOM() {
        this.dom = UIUtils.bindDOM({
            addCatBtn: 'btn-add-cat-new',
            addTaskBtn: 'btn-add-task',
            taskInp: 'todo-task-input',
            backBtn: 'btn-todo-back',
            toggleFocTodoBtn: 'btn-toggle-focus-todo',
            sortBtn: 'btn-todo-sort',
            titleInp: 'todo-detail-title-input',
            mainView: 'todo-main-view',
            detailView: 'todo-detail-view',
            pinList: 'todo-category-pinned-list',
            actList: 'todo-category-list',
            cmpList: 'todo-category-completed-list',
            pinSec: 'todo-pinned-section',
            actSec: 'todo-active-section',
            cmpSec: 'todo-completed-cat-section',
            taskList: 'todo-task-list',
            cmpTaskList: 'todo-task-completed-list',
            cmpTaskSec: 'todo-completed-task-section',
            focCont: 'focus-todo-content',
            focSide: 'focus-todo-side',
            focClock: 'focus-clock-side',
            confirmModal: 'todo-confirm-modal',
            confirmMsg: 'todo-confirm-msg',
            confirmYes: 'btn-todo-confirm-yes',
            confirmCancel: 'btn-todo-confirm-cancel'
        });
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
                this.dom.sortBtn.innerText = this.currentSortDir === 'desc' ? '🔽' : '🔼';
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
            if (!e.target.closest('.task-drag-handle')) {
                const cat = state.data.todo.find(x => x.id === this.activeCatId);
                const task = cat.tasks.find(x => x.id === taskId);
                task.done = !task.done;
                
                const cb = li.querySelector('.task-check');
                const span = li.querySelector('.task-text');
                
                cb.checked = task.done;
                if (task.done) {
                    span.classList.add('line-through', 'opacity-50');
                    this.dom.cmpTaskList.appendChild(li);
                } else {
                    span.classList.remove('line-through', 'opacity-50');
                    this.dom.taskList.appendChild(li);
                }
                
                localStorage.setItem('todoList', JSON.stringify(state.data.todo));
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
        
        state.subscribe('todo', () => { this.renderSidebar(); this.renderFocus() });
        this.renderFocus();
        this.renderSidebar();
        
        document.getElementById('btn-del-all-cmp-cat')?.addEventListener('click', () => {
            this.pendingDelete = 'all-cat';
            if(this.dom.confirmMsg) this.dom.confirmMsg.innerText = "Delete all completed categories?";
            UIUtils.openModal(this.dom.confirmModal);
        });
        
        document.getElementById('btn-del-all-cmp-task')?.addEventListener('click', () => {
            this.pendingDelete = 'all-task';
            if(this.dom.confirmMsg) this.dom.confirmMsg.innerText = "Delete all completed tasks?";
            UIUtils.openModal(this.dom.confirmModal);
        });
        
        this.dom.confirmCancel?.addEventListener('click', () => {
            this.pendingDelete = null;
            UIUtils.closeModal(this.dom.confirmModal);
        });
        
        this.dom.confirmYes?.addEventListener('click', () => {
            if (this.pendingDelete === 'all-cat') {
                state.data.todo = state.data.todo.filter(c => !(c.tasks.length > 0 && c.tasks.every(t => t.done)));
                state.notify('todo');
            } else if (this.pendingDelete === 'all-task') {
                if (this.activeCatId) {
                    const cat = state.data.todo.find(x => x.id === this.activeCatId);
                    if (cat) {
                        cat.tasks = cat.tasks.filter(t => !t.done);
                        state.notify('todo');
                    }
                }
            }
            this.pendingDelete = null;
            UIUtils.closeModal(this.dom.confirmModal);
        });
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
            const text = this.dom.taskInp.value.trim();
            const newTask = { id: Date.now(), text, done: false };
            const cat = state.data.todo.find(x => x.id === this.activeCatId);
            
            cat.tasks.unshift(newTask);
            localStorage.setItem('todoList', JSON.stringify(state.data.todo));

            const t = document.getElementById('tpl-todo-task').content.cloneNode(true);
            const li = t.querySelector('li');
            li.dataset.id = newTask.id;
            
            t.querySelector('.task-check').checked = false;
            t.querySelector('.task-text').textContent = newTask.text;
            
            this.dom.taskList.prepend(t);
            this.dom.taskInp.value = '';
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
            t.querySelector('.cat-title').textContent = c.title || 'Untitled';
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
                s.textContent = '  ' + tk.text;
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
            span.textContent = tk.text;
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
        const catTpl = document.getElementById('tpl-focus-todo-cat');
        const taskTpl = document.getElementById('tpl-focus-todo-task');
        sortedCats.forEach(c => {
            if (c.tasks.length === 0) return;
            hasContent = true;
            const isCompleted = c.tasks.every(t => t.done);
            const catClone = catTpl.content.cloneNode(true);
            const div = catClone.querySelector('.focus-cat-card');
            div.dataset.catId = c.id;            
            if (isCompleted) {
                div.classList.add('opacity-60', 'grayscale');
            }            
            catClone.querySelector('.foc-cat-title').textContent = c.title || 'Untitled';            
            const pinBtn = catClone.querySelector('.btn-focus-pin');
            const pinIcon = catClone.querySelector('.foc-pin-icon');
            if (c.pinned) {
                pinBtn.classList.add('text-yellow-500', 'opacity-100');
                pinBtn.classList.remove('text-gray-400', 'opacity-0', 'group-hover:opacity-100');
                pinIcon.setAttribute('fill', 'currentColor');
            } else {
                pinBtn.classList.add('text-gray-400', 'opacity-0', 'group-hover:opacity-100');
                pinBtn.classList.remove('text-yellow-500', 'opacity-100');
                pinIcon.setAttribute('fill', 'none');
            }
            const ul = catClone.querySelector('.foc-task-list');
            c.tasks.forEach(tk => {
                const taskClone = taskTpl.content.cloneNode(true);
                const li = taskClone.querySelector('li');
                li.dataset.taskId = tk.id;
                li.dataset.catId = c.id;
                
                const cb = taskClone.querySelector('.foc-task-cb');
                if (tk.done) cb.checked = true;
                
                const span = taskClone.querySelector('.foc-task-text');
                span.textContent = tk.text;
                if (tk.done) span.classList.add('line-through', 'opacity-40');
                
                ul.appendChild(taskClone);
            });
            
            fragFocus.appendChild(catClone);
        });
        if (!hasContent) {
            this.dom.focCont.innerHTML = '<p class="text-sm opacity-50 uppercase tracking-widest font-bold">No active tasks.</p>';
        } else {
            this.dom.focCont.appendChild(fragFocus);
        }
    }
}