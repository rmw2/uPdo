import React, { Component } from 'react';


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

  }

  render() {
    let {patch} = this.state;
    return (
      <div id="component">
        <nav>
          <button id="upload" 
            className="nav-button"
            onClick={this.upload}>upload patch</button>
        </nav>
        <main>
          {patch ? (
            <PdPatch patch={patch} />
          ) : (
            <button id="new"
              onClick={this.newPatch}>new patch</button>
          )}
        </main>
      </div>
    );
  }
}