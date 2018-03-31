import React, { Component } from 'react';
import Pd from 'webpd';

function sanityTestPatch() {
  Pd.start()
  let patch = Pd.createPatch()                  // Create an empty patch
  let osc = patch.createObject('osc~', [440])   // Create an [osc~ 440]
  let dac = patch.createObject('dac~')          // Create a [dac~]
  osc.o(0).connect(dac.i(0))                    // Connect outlet of [osc~] to left inlet of [dac~]
  osc.o(0).connect(dac.i(1))                    // Connect outlet of [osc~] to right inlet of [dac~]
  osc.i(0).message([330])                       // Send frequency of [osc~] to 330Hz
}

function loadPatchString(patchString) {
  let patch = Pd.loadPatch(patchString);            // We assume this patch has an [outlet~] object
  let gain = Pd.getAudio().context.createGain(); // We create a web audio API GainNode
  patch.o(0).getOutNode().connect(gain);         // Connect the output 0 of the patch to our audio node
}

export default class PdPatch extends Component {
	constructor(props) {
    super(props);
    console.log(420)
	}

  componentDidMount() {
    Pd.start();
  }

	render() {
    return null;
	}
}
