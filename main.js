import { app } from './context.js';
import { UIUtils } from './utils.js';
import { GlobalController } from './globalController.js';
import { ClockComponent } from './clock.js';
import { TimerComponent } from './timer.js';
import { StopwatchComponent } from './stopwatch.js';
import { AlarmComponent } from './alarm.js';
import { EventComponent } from './event.js';
import { FocusComponent } from './focus.js';
import { TodoComponent } from './todo.js';
import { MusicPlayer } from './music.js';

requestAnimationFrame(() => {
    document.body.classList.remove('opacity-0');
});

app.globalCtrl = new GlobalController();
app.clockComp = new ClockComponent();
app.timerComp = new TimerComponent();
app.swComp = new StopwatchComponent();
app.alarmComp = new AlarmComponent();
app.eventComp = new EventComponent();
app.focusComp = new FocusComponent();
app.todoComp = new TodoComponent();
app.musicPlayer = new MusicPlayer();

let isLooping = false;
app.startLoopIfNeeded = () => { 
    if (!isLooping) { 
        isLooping = true; 
        requestAnimationFrame(loop);
    } 
};

function loop() {
    let u = false;
    if (app.timerComp && app.timerComp.isRunning) { app.timerComp.render(); u = true; }
    if (app.swComp && app.swComp.isRunning) { app.swComp.render(); u = true; }
    if (app.focusComp && app.focusComp.isRunning) { app.focusComp.render(); u = true; }
    if (u) requestAnimationFrame(loop); else isLooping = false;
}