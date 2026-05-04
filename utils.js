export const UIUtils = {
    clearTask: (v) => { 
        if(v) { clearInterval(v); clearTimeout(v); } 
        return null; 
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
                const isMinOrSec = max === 59 || 
                                   i.id.endsWith('-m') || i.id.endsWith('-s') || i.id.endsWith('-bm') || i.id.includes('minute') ||
                                   i.classList.contains('preset-m') || i.classList.contains('fm') || i.classList.contains('bm');
                
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
            if(i.value === ''){ i.value = i.min; if(cb) cb(); }
        });
        i.addEventListener('click', function(){ this.select(); });
    },
    
    trapFocus: (modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';        
        const getFocusable = () => Array.from(modal.querySelectorAll(focusableElementsString)).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
        
        const els = getFocusable();
        if (els.length) {
            const firstInput = els.find(el => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
            (firstInput || els[0]).focus();
        }

        if (modal.dataset.trapFocusInit) return;
        
        modal.addEventListener('keydown', function(e) {
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
        });
        modal.dataset.trapFocusInit = 'true';
    },

    openModal: (el) => {
        el.classList.remove('hidden');
        el.classList.add('flex');
        setTimeout(() => el.classList.remove('opacity-0'), 10);
        if (UIUtils.trapFocus) UIUtils.trapFocus(el.id);
    },

    closeModal: (el) => {
        el.classList.add('opacity-0');
        setTimeout(() => { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
    }
};