declare var __DEVELOPMENT__;
import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {ApplicationStore} from '../stores/AppStore';
import DevTools from 'mobx-react-devtools';

import * as css from './app.scss';

interface Props {
    appStore: ApplicationStore;
}

@inject("appStore")
@observer
export class App extends React.Component<Props, {}> {
    componentDidMount() {}

    render() {
        const {runningSince} = this.props.appStore;
        return (
            <div>
                <div className={css.deleteMe}>App is running since {runningSince} second(s)</div>
                {__DEVELOPMENT__ ? <DevTools/> : <span></span>}
            </div>
        );
    }
}