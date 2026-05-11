export const UIUtils = {
    trapFocusListeners: new Map(),
    clearTask: (v) => {
        if(v) { clearInterval(v); clearTimeout(v); }
        return null;
    },
    parseMs: (ms) => {
        const t = Math.max(0, ms);
        const sec = Math.floor(t / 1000);
        return {
            h: Math.floor(sec / 3600),
            m: Math.floor((sec % 3600) / 60),
            s: sec % 60,
            ms: Math.floor((t % 1000) / 10)
        };
    },
    getSafeData: (k, d) => {
        try {
            const i = localStorage.getItem(k);
            return i ? JSON.parse(i) : d;
        } catch(e) {
            return d;
        }
    },
    esc: (t) => t ? String(t).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : '',
    setupNum: (i, cb) => {
        if(!i) return;
        i.addEventListener('input', () => {
            if(cb) cb();
        });
        i.addEventListener('wheel', e => {
            e.preventDefault();
            let v = parseInt(i.value) || 0;
            let min = parseInt(i.min) || 0;
            let max = parseInt(i.max) || 99;
            let step = parseInt(i.step);
            
            if (isNaN(step)) {
                const minSecIds = ['alarm-m', 'timer-m', 'timer-s', 'focus-m', 'focus-bm', 'foc-add-m', 'foc-add-s', 'cd-minute', 'snooze-t-m', 'snooze-t-s'];
                const minSecClasses = ['preset-m', 'fm', 'bm'];
                
                const isMinOrSec = minSecIds.includes(i.id) || minSecClasses.some(c => i.classList.contains(c));
                step = isMinOrSec ? 5 : 1;
            }
            
            if(e.deltaY < 0) v += step; else v -= step;
            if (v > max) {
                v = min;
            } else if (v < min) {
                v = max - (max % step);
            }
            i.value = v;
            if(cb) cb();
        }, {passive: false});
        
        i.addEventListener('blur', () => {
            let v = parseInt(i.value);
            let min = parseInt(i.min) || 0;
            let max = parseInt(i.max) || 99;
            
            if (isNaN(v)) {
                i.value = min;
            } else if (v > max) {
                i.value = max;
            } else if (v < min) {
                i.value = min;
            }
            if(cb) cb();
        });
        
        i.addEventListener('click', function(){ this.select(); });
    },
    bindDOM: (config) => {
        const dom = {};
        for (const [key, id] of Object.entries(config)) {
            dom[key] = document.getElementById(id);
        }
        return dom;
    },
    trapFocus: (modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal || UIUtils.trapFocusListeners.has(modal)) return;
        const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
        const getFocusable = () => Array.from(modal.querySelectorAll(focusableElementsString)).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
        const els = getFocusable();
        if (els.length) {
            const firstInput = els.find(el => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
            (firstInput || els[0]).focus();
        }
        const handler = function(e) {
            if (e.key === 'Tab') {
                const currentEls = getFocusable();
                if (!currentEls.length) return;
                const first = currentEls[0];
                const last = currentEls[currentEls.length - 1];
                const isOutside = !currentEls.includes(document.activeElement);
                if (e.shiftKey) {
                    if (document.activeElement === first || isOutside) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || isOutside) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };
        modal.addEventListener('keydown', handler);
        UIUtils.trapFocusListeners.set(modal, handler);
    },
    openModal: (el) => {
        el.classList.remove('hidden');
        el.classList.add('flex');
        setTimeout(() => el.classList.remove('opacity-0'), 10);
        if (UIUtils.trapFocus) UIUtils.trapFocus(el.id);
    },
    closeModal: (el) => {
        el.classList.add('opacity-0');
        if (UIUtils.trapFocusListeners.has(el)) {
            el.removeEventListener('keydown', UIUtils.trapFocusListeners.get(el));
            UIUtils.trapFocusListeners.delete(el);
        }
        setTimeout(() => { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
    }
};