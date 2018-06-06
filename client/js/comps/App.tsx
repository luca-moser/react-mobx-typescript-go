declare var __DEVELOPMENT__;
import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {ApplicationStore} from '../stores/AppStore';
import DevTools from 'mobx-react-devtools';

import * as css from './app.scss';
import * as canvas from './canvas';

interface Props {
    appStore: ApplicationStore;
}

@inject("appStore")
@observer
export class App extends React.Component<Props, {}> {
    componentDidMount() {
        this.drawCanvas();
    }

    updateColor = (e: any) => {
        this.props.appStore.updateColor(e.target.value);
        canvas.changeBallColor(e.target.value);
    }

    drawCanvas = () => {
        canvas.setup((this.refs.canvas as HTMLCanvasElement));
    }

    render() {
        const {color} = this.props.appStore;
        return (
            <div>
                <div className={css.drawboard}>
                    <input type="color" onChange={this.updateColor} value={color}/>
                    <canvas ref={"canvas"}>
                    </canvas>
                </div>
                {__DEVELOPMENT__ ? <DevTools/> : <span></span>}
            </div>
        );
    }
}