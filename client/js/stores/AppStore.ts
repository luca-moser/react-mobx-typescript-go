import {action, observable, runInAction} from 'mobx';

export class ApplicationStore {
    @observable runningSince = 0;
    timerID;

    constructor() {
        this.timerID = setInterval(() => {
            runInAction(this.updateTimer);
        }, 1000);
    }

    updateTimer = () => {
        this.runningSince++;
    }
}

export var AppStoreInstance = new ApplicationStore();