import React, { Component } from 'react';

import Pd from 'webpd';
import {parsePatch} from './parse';
import PdPatch from './PdPatch';

import './App.css';

export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      patch: null
    };


    this.upload = this.upload.bind(this);
    this.newPatch = this.newPatch.bind(this);
  }

  upload(event) {
    let reader = new FileReader();
    reader.onload = () => this.setState({patch: parsePatch(reader.result)});
    reader.readAsText(event.target.files[0]);
  }

  newPatch() {
    this.setState({
      // TODO: Need to actually figure out order of these bois
      patch: `#N canvas 359 25 ${window.innerHeight} ${window.innerWidth} 10`
    });
  }

  render() {
    let {patch} = this.state;
    return (
      <div id="component">
        <nav>

        </nav>
        <main>
          {patch ? (
            <PdPatch patch={patch} />
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
