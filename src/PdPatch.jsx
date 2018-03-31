import React, { Component } from 'react';
import Pd from 'webpd';
import {parsePatch} from './parse';

function sanityTestPatch() {
  Pd.start()
  let patch = Pd.createPatch()                  // Create an empty patch
  let osc = patch.createObject('osc~', [440])   // Create an [osc~ 440]
  let dac = patch.createObject('dac~')          // Create a [dac~]
  osc.o(0).connect(dac.i(0))                    // Connect outlet of [osc~] to left inlet of [dac~]
  osc.o(0).connect(dac.i(1))                    // Connect outlet of [osc~] to right inlet of [dac~]
  osc.i(0).message([330])                       // Send frequency of [osc~] to 330Hz
}

let DAC_INDEX = 0;
let OSC_INDEX = 1;


export default class PdPatch extends Component {
	constructor(props) {
    super(props);

    this.state = {
      patch: Pd.loadPatch(props.patchString),
      width: null,
      height: null,
      oscOn: true
    };

    this.props.toggleAudio();
    console.log(this.state.patch);
    this.toggleOsc = this.toggleOsc.bind(this);
    this.setFrequency = this.setFrequency.bind(this);
	}

  componentDidMount() {
    // Set svg size
    this.setState({
      height: this.refs.wrapper.clientHeight,
      width: this.refs.wrapper.clientWidth
    });
  }

  // HACKY NONSENSE FOR TESTING
  toggleOsc() {
    let outputPort = this.state.patch.objects[OSC_INDEX].o(0);
    let inputPortL = this.state.patch.objects[DAC_INDEX].i(0);
    let inputPortR = this.state.patch.objects[DAC_INDEX].i(1);

    if (this.state.oscOn) {
      this.setState({oscOn: false});
      this.state.patch.patchData.nodes[OSC_INDEX].layout.x = 420;
      outputPort.disconnect(inputPortL);
      outputPort.disconnect(inputPortR);
    } else {
      this.setState({oscOn: true});
      this.state.patch.patchData.nodes[OSC_INDEX].layout.x = 170;
      outputPort.connect(inputPortL);
      outputPort.connect(inputPortR);
    }
  }
  // MORE HACKY NONSENSE FOR TESTING
  setFrequency(event) {
    let freq = parseFloat(event.target.value);
    // not sure why not passing value so just flipping cus it's a proof of concept not a feature anwyay
    this.state.patch.objects[OSC_INDEX].i(0).message([freq]);
  }


	render() {
    let {patch, width, height, oscOn} = this.state;

    let {nodes, connections} = patch.patchData;

    return (
      <div id="svg-wrapper" ref="wrapper">
        <button onClick={this.toggleOsc}>{oscOn ? 'oscOff' : 'oscOn'}</button>
        <input type="range" onChange={(val) => this.setFrequency(val)} step="1" min="0" max="1000" defaultValue="420"></input>

        <svg width={width} height={height}>
          {nodes.map(({id, proto, args, layout, data}) =>
            <g key={id}>
              <rect x={layout.x} y={layout.y} height={20} width={50} style={{stroke: '#000', fill: '#fff'}}/>
              <text x={layout.x} y={layout.y}>{proto} {args.join(' ')}</text>
            </g>
          )}
          {connections.map(({source, sink}, i) =>
            <path key={i} stroke="black"
              strokeWidth={2}
              d={`M${nodes[source.id].layout.x} ${nodes[source.id].layout.y}
                  L${nodes[sink.id].layout.x} ${nodes[sink.id].layout.y}`}/>
          )}
        </svg>
      </div>
    );
	}
}
