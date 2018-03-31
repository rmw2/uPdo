import React, { Component } from 'react';

import {parsePatch} from './parse';
import PdPatch from './PdPatch';

import './App.css';

export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      patch: null
    }
  }

  upload() {
    let reader = new FileReader();
    reader.onload = () => this.setState({patch: parse(reader.result)});
    reader.readAsText(event.target.files[0]);
  }

  render() {
    return (
      <div id="component">
        <nav>
          <button id="upload" 
            className="nav-button"
            onClick={upload}>upload patch</button>
        </nav>
        <main>
          <PdPatch patch={patch} />
        </main>
      </div>
    );
  }
}