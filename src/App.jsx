import React, { Component } from 'react';

import Pd from 'webpd';
import PdPatch from './PdPatch';

import './App.css';

export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      patch: null,
      playing: false
    };

    this.upload = this.upload.bind(this);
    this.newPatch = this.newPatch.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
  }

  upload(event) {
    let reader = new FileReader();
    reader.onload = () => this.setState({patch: reader.result});
    reader.readAsText(event.target.files[0]);
  }

  newPatch() {
    this.setState({
      // TODO: Need to actually figure out order of these bois
      patch: `#N canvas 359 25 ${window.innerHeight} ${window.innerWidth} 10`
    });
  }

  toggleAudio() {
    if (this.state.playing) {
      Pd.stop();
      this.setState({playing: false});
    } else {
      Pd.start();
      this.setState({playing: true});
    }
  }

  render() {
    let {patch, playing} = this.state;
    return (
      <div id="component">
        <nav>
          <div id="logo">u<span id="pd">Pd</span>o</div>
          <div id="nav-buttons">
            <button disabled={patch === null} onClick={this.toggleAudio}>{playing ? 'pause' : 'play'}</button>
          </div>
        </nav>
        <main>
          {patch ? (
            <PdPatch patchString={patch} toggleAudio={this.toggleAudio} />
          ) : (
            <div id="start-buttons">
              <input type="file" id="upload"
                className="nav-button"
                onChange={this.upload} />
              <button id="new"
                onClick={this.newPatch}>new patch</button>
            </div>
          )}
        </main>
      </div>
    );
  }
}
