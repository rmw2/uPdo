import React, { Component } from 'react';
import Draggable from 'react-draggable'
import Pd from 'webpd';
import {parsePatch} from './parse';

import './patch.css';

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

const NODE_HEIGHT = 20;
const NODE_WIDTH = 50;

export default class PdPatch extends Component {
	constructor(props) {
    super(props);

    this.state = {
      patch: Pd.loadPatch(props.patchString),
      width: null,
      height: null,
      oscOn: true
    };

    this.nextId = this.state.patch.objects.length;

    this.props.toggleAudio();
    this.disconnect = this.disconnect.bind(this);
    this.delete = this.delete.bind(this);

	}

  // Horrendously O(n^2)
  getNodeWithId(id) {
    for (let node of this.state.patch.patchData.nodes) {
      if (node.id === id) {
        console.log(node);
        return node;
      }
    }
    console.log("BAAAAAAAAAAAAAAD");
  }

  deleteNodeWithId(id) {
    let {nodes} = this.state.patch.patchData;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        return nodes.splice(i, 1);
      }
    }
  }

  getObjectWithId(id) {
    for (let obj of this.state.patch.objects) {
      if (obj.id === id) {
        return obj;
      }
    }
  }

  deleteObjectWithId(id) {
    let {objects} = this.state.patch;
    for (let i = 0; i < objects.length; i++) {
      if (objects[i].id === id) {
        return objects.splice(i, 1);
      }
    }
  }

  componentDidMount() {
    // Set svg size
    this.setState({
      height: this.refs.wrapper.clientHeight,
      width: this.refs.wrapper.clientWidth
    });
  }

  /**
   * Remove patch cord idx from the render and objects so it stops DSP boi
   */
  disconnect(connectionIdx) {
    let {patch} = this.state;

    // Find the connection with this index
    let {source, sink} = patch.patchData.connections[connectionIdx];
    let outlet = this.getObjectWithId(source.id).o(source.port);
    let inlet = this.getObjectWithId(sink.id).i(sink.port);
    // Remove connection from the object
    outlet.disconnect(inlet);

    // Remove connection from the connections list
    patch.patchData.connections.splice(connectionIdx, 1);
    console.log(patch.patchData);
    this.forceUpdate();
  }

  /**
   *
   */
  connect(from, to) {

  }

  /**
   * Update the arguments for the node with the given id
   */
  updateObject(id, proto, args) {
    let {patch} = this.state;

    // TODO: Delete the object, create a new one, connect it
    console.log(patch.objects[id]);
  }

  disconnectAll(nodeIdx) {
    let {connections} = this.state.patch.patchData;

    for (let i = connections.length-1; i >= 0; i--) {
      if (connections[i].source.id === nodeIdx || connections[i].sink.id === nodeIdx) {
        this.disconnect(i);
      }
    }
  }

  /**
   * Delete a node from existence
   */
  delete(nodeId) {
    let {patch} = this.state;

    this.disconnectAll(nodeId);
    this.getObjectWithId(nodeId).stop();
    this.deleteObjectWithId(nodeId);
    this.deleteNodeWithId(nodeId);
  }

  moveObject(id, x, y) {
    let {patch} = this.state;

    this.getNodeWithId(id).layout = {x, y};
    this.forceUpdate();
  }

  createObject(proto, args) {
    let {patch} = this.state;
    let obj = patch.createObject(proto, args);
    patch.patchData.nodes.append(obj);
    this.forceUpdate();
  }

	render() {
    let {patch, width, height, oscOn} = this.state;
    let {nodes, connections} = patch.patchData;

    return (
      <div id="svg-wrapper" ref="wrapper">
        <button onClick={this.toggleOsc}>{oscOn ? 'oscOff' : 'oscOn'}</button>
        <input type="range" onChange={(val) => this.setFrequency(val)} step="1" min="0" max="1000" defaultValue="420"></input>

        <svg width={width} height={height}>
          {nodes.map(({id, ...rest}) =>
            <PdNode key={id} {...rest}
              move={(x, y) => this.moveObject(id, x, y)}
              inlets={this.getObjectWithId(id).inlets}
              outlets={this.getObjectWithId(id).outlets}
              updateObject={(proto, args) => this.updateObject(id, proto, args)}
              delete={() => this.delete(id)}
            />
          )}
          {connections.map(({source, sink}, idx) =>
            <PdPatchCord key={`${source.id}.${source.port}-${sink.id}.${sink.port}`}
              outlet={source.port}
              inlet={sink.port}
              from={this.getNodeWithId(source.id)}
              to={this.getNodeWithId(sink.id)}
              idx={idx}
              disconnect={this.disconnect} />
          )}
        </svg>
      </div>
    );
	}
}

/**
 * Class/component for representing a Pd Node
 *
 */
class PdNode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editing: false,
      selected: false,
      nodeText: this.props.proto + ' ' + this.props.args.join(' ')
    };

    this.select = this.select.bind(this);
    this.deselect = this.deselect.bind(this);
    this.edit = this.edit.bind(this);
    this.drag = this.drag.bind(this);
    this.delete = this.delete.bind(this);

    this.updateText = this.updateText.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      nodeText: nextProps.proto + ' ' + nextProps.args.join(' ')
    });
  }

  select(evt) {
    console.log('selecting');
    this.setState({selected: true});

    window.addEventListener('click', this.deselect);
    window.addEventListener('keyup', this.delete);
    evt.stopPropagation();
  }

  deselect(evt) {
    this.setState({selected: false});
    this.cleanUp();
  }

  edit() {
    console.log('editing');
    this.setState({editing: true});
  }

  drag() {

  }

  updateText(evt) {
    this.setState({nodeText: evt.target.value});
  }

  delete(evt) {
    if (evt.key == 'Backspace') {
      this.props.delete();
    }
    this.cleanUp();
  }

  componentWillUnmount() {
    this.cleanUp();
  }

  cleanUp() {
    window.removeEventListener('click', this.deselect);
    window.removeEventListener('keyup', this.delete);
  }


  handleSubmit(evt) {
    if (evt.key == 'Enter') {
      let [proto, ...args] = this.state.nodeText.split();
      this.props.updateObject(proto, args)
      this.setState({editing: false});
    }
  }

  render() {
    let {nodeText, editing, selected} = this.state;
    let {inlets, outlets} = this.props;
    let {x, y} = this.props.layout;

    console.log(inlets, outlets);

    let padding = 5;
    let height = NODE_HEIGHT;
    let width = nodeText.length * 12;

    // TODO:
    // Switch here on proto if we need to render a different type of object

    return (
      <Draggable disabled={editing}
        position={{x:0, y:0}}
        onStop={(_, data) => this.props.move(x + data.x, y + data.y)}>
        <g className="pd-node">
          {inlets.map((_,i) =>
            <circle className="pd-portlet"
              cx={x + width * (i/(inlets.length - 1))}
              cy={y}
              r={3} />
          )}
          <rect x={x} y={y}
            className={`pd-node-rect ${selected ? 'selected' : ''}`}
            fill="transparent"
            onDragStart={this.drag}
            onDragEnd={this.move}
            onClick={this.select}
            onDoubleClick={this.edit}
            height={height} width={width}
            style={{stroke: '#000', fill: '#fff'}} />
          {editing ? (
            <foreignObject x={x} y={y}>
              <input className="pd-node-input"
                style={{width}}
                onChange={this.updateText}
                onKeyUp={this.handleSubmit}
                value={nodeText} />
            </foreignObject>
          ) : (
            <text className="pd-node-text"
              onDoubleClick={this.edit} onClick={this.select}
              x={x + padding} y={y + height - padding}>{nodeText}</text>
          )}
          {outlets.map((_,i) =>
            <circle className="pd-portlet"
              cx={x + width * (i/(outlets.length-1))}
              cy={y + height}
              r={3} />
          )}
        </g>
      </Draggable>
    );
  }
}

class PdPatchCord extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: false
    };

    this.select = this.select.bind(this);
    this.deselect = this.deselect.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * Select this patch cord by setting state to selected
   * and installing event handlers for "delete" and click
   */
  select(evt) {
    this.setState({selected: true});
    window.addEventListener('click', this.deselect);
    window.addEventListener('keyup', this.delete);
    evt.stopPropagation();
  }

  deselect(evt) {
    this.setState({selected: false});
    this.cleanUp();
  }

  delete(evt) {
    let {idx} = this.props;
    if (evt.key == 'Backspace') {
      this.props.disconnect(idx);
    }

    this.cleanUp();
  }

  componentWillUnmount() {
    this.cleanUp();
  }

  cleanUp() {
    window.removeEventListener('click', this.deselect);
    window.removeEventListener('keyup', this.delete);
  }

  render() {
    let {selected} = this.state;
    let {from, to, inlet, outlet} = this.props;
    let cordWidth = selected ? 4 : 2;

    let fromX = from.layout.x + (outlet / 2) * NODE_WIDTH;
    let fromY = from.layout.y + NODE_HEIGHT;
    let toX = to.layout.x + (inlet / 2) * NODE_WIDTH;
    let toY = to.layout.y;

    return (
      <path className="pd-patchcord"
        stroke={selected ? 'black' : 'grey'}
        fill="transparent"
        strokeWidth={cordWidth}
        onClick={this.select}
        d={`M${fromX} ${fromY} L${toX} ${toY}`} />
    );
  }
}
