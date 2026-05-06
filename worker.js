let timerId = null;
self.onmessage = (e) => {
    const { action, interval } = e.data;
    if (action === 'start') {
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => self.postMessage('tick'), interval || 1000);
    } else if (action === 'stop') {
        clearInterval(timerId);
        timerId = null;
    }
};