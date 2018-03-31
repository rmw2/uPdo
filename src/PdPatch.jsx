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

export default class PdPatch extends Component {
	constructor(props) {
    super(props);

    this.state = {
      patch: Pd.loadPatch(props.patchString),
      width: null,
      height: null
    };
    
    this.props.toggleAudio();
    console.log(this.state.patch);
	}

  componentDidMount() {
    // Set svg size
    this.setState({
      height: this.refs.wrapper.clientHeight,
      width: this.refs.wrapper.clientWidth
    });
  }

	render() {
    let {patch, width, height} = this.state;

    let {nodes, connections} = patch.patchData;

    return (
      <div id="svg-wrapper" ref="wrapper">
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