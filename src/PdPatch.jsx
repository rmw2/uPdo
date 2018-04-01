import React, { Component } from 'react';
import Draggable from 'react-draggable'
import Pd from 'webpd';

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

const NODE_HEIGHT = 20;
const NODE_WIDTH = 100;

export default class PdPatch extends Component {
	constructor(props) {
    super(props);

    this.state = {
      patch: Pd.loadPatch(props.patchString),
      preObject: null,
      newCord: null,
      width: null,
      height: null,      
    };

    this.nextId = this.state.patch.objects.length;

    this.delete = this.delete.bind(this);
    this.disconnect = this.disconnect.bind(this);

    this.createPreObject = this.createPreObject.bind(this);
    this.createObject = this.createObject.bind(this);
    this.startPatchCord = this.startPatchCord.bind(this);
    this.finishPatchCord = this.finishPatchCord.bind(this);
    // Turn it on
    props.toggleAudio();
	}

  componentDidMount() {
    // Set svg size
    this.setState({
      height: this.refs.wrapper.clientHeight,
      width: this.refs.wrapper.clientWidth
    });

    this.refs.svg.addEventListener('dblclick', this.createPreObject);
  }

  componentWillUnmount() {
    this.refs.svg.removeEventListener('dblclick', this.createPreObject);
  }

  // Horrendous
  getNodeWithId(id) {
    for (let node of this.state.patch.patchData.nodes) {
      if (node && node.id === id) {
        return node;
      }
    }
    console.log("BAAAAAAAAAAAAAAD");
  }

  deleteNodeWithId(id) {
    let {nodes} = this.state.patch.patchData;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i].id === id) {
        return nodes.splice(i, 1);
      }
    }

    return null;
  }

  getObjectWithId(id) {
    for (let obj of this.state.patch.objects) {
      if (obj && obj.id === id) {
        return obj;
      }
    }
  }

  deleteObjectWithId(id) {
    let {objects} = this.state.patch;
    for (let i = 0; i < objects.length; i++) {
      if (objects[i] && objects[i].id === id) {
        return objects.splice(i, 1);
      }
    }

    return null;
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
    this.forceUpdate();
  }

  startPatchCord(fromNodeId, fromPort, x, y) {
    this.setState({newCord: {fromNodeId, fromPort, x, y}});
  }

  finishPatchCord(toNodeId, toPort) {
    let {fromNodeId, fromPort} = this.state.newCord;
    let outlet = this.getObjectWithId(fromNodeId).o(fromPort);
    let inlet = this.getObjectWithId(toNodeId).i(toPort);

    outlet.connect(inlet);
    this.state.patch.patchData.connections.push({
      source: {id: fromNodeId, port: fromPort},
      sink: {id: toNodeId, port: toPort}
    })

    this.setState({newCord: null});
  }

  disconnectAll(nodeIdx) {
    let {connections} = this.state.patch.patchData;

    for (let i = connections.length-1; i >= 0; i--) {
      if (connections[i].source.id === nodeIdx || connections[i].sink.id === nodeIdx) {
        this.disconnect(i);
      }
    }
  }

  createPreObject(evt) {
    this.setState({preObject: {x: evt.offsetX, y: evt.offsetY}})
  }

  createObject(proto, args, layout) {
    let {patch} = this.state;
    let obj;

    console.log(patch.objects);
    try {
      obj = patch.createObject(proto, args.map(a => isNaN(a) ? a : parseFloat(a)));
    } catch (e) {
      return null;
    }
    console.log(patch.objects);

    obj.id = this.nextId;
    patch.patchData.nodes.push({proto, args, layout, id: this.nextId});
    // Increment the id
    this.nextId++;
    this.setState({preObject: null});

    return obj;
  }

  /**
   * Update the arguments/prototype for the node with the given id
   */
  updateObject(id, proto, args) {
    let {patch} = this.state;

    // TODO: Delete the object, create a new one, connect it
    console.log(patch.objects[id]);
  }

  moveObject(id, x, y) {
    let {patch} = this.state;

    this.getNodeWithId(id).layout = {x, y};
    this.forceUpdate();
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
    this.forceUpdate();
  }


	render() {
    let {patch, width, height, oscOn, preObject, newCord} = this.state;
    let {nodes, connections} = patch.patchData;
    console.log('rendering');

    return (
      <div id="svg-wrapper" ref="wrapper">
        <svg width={width} height={height} ref="svg">
          {connections.map(({source, sink}, idx) =>
            <PdPatchCord key={`${source.id}.${source.port}-${sink.id}.${sink.port}`}
              outletOffset={source.port / (this.getObjectWithId(source.id).outlets.length - 1)}
              inletOffset={sink.port / (this.getObjectWithId(sink.id).inlets.length - 1)}
              from={this.getNodeWithId(source.id)}
              to={this.getNodeWithId(sink.id)}
              idx={idx}
              disconnect={this.disconnect} />
          )}
          {nodes.map(({id, ...rest}) =>
            <PdNode key={id} id={id} {...rest}
              isDrawingPatchCord={newCord !== null}
              startPatchCord={this.startPatchCord}
              finishPatchCord={this.finishPatchCord}
              move={(x, y) => this.moveObject(id, x, y)}
              inlets={this.getObjectWithId(id).inlets}
              outlets={this.getObjectWithId(id).outlets}
              updateObject={(proto, args) => this.updateObject(id, proto, args)}
              delete={() => this.delete(id)} />
          )}
          {preObject &&
            <PreObject x={preObject.x} y={preObject.y} 
              createObject={this.createObject} />
          }
        </svg>
      </div>
    );
	}
}

class PreObject extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeText: ''
    };

    this.updateText = this.updateText.bind(this);
    this.submitText = this.submitText.bind(this);
  }

  updateText(evt) {
    this.setState({nodeText: evt.target.value});
  }

  submitText(evt) {
    let {x,y} = this.props;
    let [proto, ...args] = this.state.nodeText.split(' ');
    this.props.createObject(proto, args, {x,y});
    window.removeEventListener('click', this.submitText);
  }

  render() {
    let {x,y} = this.props;
    let {nodeText} = this.state;

    return (
      <g className="pd-preobject">
        <rect className="pd-preobject-rect"
          fill="transparent"
          x={x} y={y} height={NODE_HEIGHT} width={NODE_WIDTH} />
        <foreignObject x={x} y={y}>
          <input className="pd-node-input"
            style={{width: NODE_WIDTH}}
            onChange={this.updateText}
            onKeyUp={(e) => (e.key === 'Enter') && this.submitText()}
            value={nodeText} />
        </foreignObject>
      </g>
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
    this.delete = this.delete.bind(this);

    this.updateText = this.updateText.bind(this);
    this.submitText = this.submitText.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      nodeText: nextProps.proto + ' ' + nextProps.args.join(' ')
    });
  }

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

  edit(evt) {
    this.setState({editing: true});
    window.addEventListener('click', this.submitText);
    evt.stopPropagation();
  }

  updateText(evt) {
    this.setState({nodeText: evt.target.value});
  }

  submitText(evt) {
    let [proto, ...args] = this.state.nodeText.split();
    this.props.updateObject(proto, args)
    this.setState({editing: false});
    window.removeEventListener('click', this.submitText);
  }

  delete(evt) {
    if (evt.key == 'Backspace') {
      this.props.delete();
      this.setState({selected: false, editing: false})
      this.cleanUp();
    }
  }

  componentWillUnmount() {
    this.cleanUp();
  }

  cleanUp() {
    window.removeEventListener('click', this.deselect);
    window.removeEventListener('keyup', this.delete);
  }

  render() {
    let {nodeText, editing, selected} = this.state;
    let {inlets, outlets, isDrawingPatchCord, startPatchCord, finishPatchCord, id} = this.props;
    let {x, y} = this.props.layout;

    let padding = 5;
    let height = NODE_HEIGHT;
    let width = NODE_WIDTH;

    let inletX = inlets.map((_,i) => 
      x + width * (inlets.length > 1 ? i/(inlets.length - 1) : 0));
    let outletX = outlets.map((_,i) => 
      x + width * (outlets.length > 1 ? i/(outlets.length - 1) : 0));

    return (
      <Draggable disabled={editing}
        position={{x:0, y:0}}
        onStop={(_, data) => this.props.move(x + data.x, y + data.y)}>
        <g className="pd-node">
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
                onKeyUp={(e) => (e.key === 'Enter') && this.submitText()}
                value={nodeText} />
            </foreignObject>
          ) : (
            <text className="pd-node-text"
              onDoubleClick={this.edit} onClick={this.select}
              x={x + padding} y={y + height - padding}>{nodeText}</text>
          )}
          {inletX.map((x, idx) =>
            <circle key={idx} className="pd-portlet"
              onClick={() => isDrawingPatchCord && finishPatchCord(id, idx)}
              cx={x}
              cy={y}
              r={3} />
          )}
          {outletX.map((x, idx) =>
            <circle key={idx} className="pd-portlet"
              cx={x}
              cy={y + height}
              r={3}
              onClick={() => startPatchCord(id, idx, x, y + height)} />
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
    let {from, to, inletOffset, outletOffset} = this.props;
    let cordWidth = selected ? 4 : 2;

    const CURVE_THRESHOLD = 50;

    // Calculate positions
    let fromX = from.layout.x + (outletOffset || 0) * NODE_WIDTH;
    let fromY = from.layout.y + NODE_HEIGHT;
    let toX = to.layout.x + (inletOffset || 0) * NODE_WIDTH;
    let toY = to.layout.y;

    let midX = (fromX + toX)/2;
    let midY = (fromY + toY)/2;

    // Use straight path if within threshold, otherwise Quadradic bezier
    let d = Math.abs(toX - fromX) > CURVE_THRESHOLD
      ? `M${fromX} ${fromY} Q${fromX} ${midY}, ${midX} ${midY} T${toX} ${toY}`
      : `M${fromX} ${fromY} L${toX} ${toY}`;

    return (
      <path className="pd-patchcord"
        stroke={selected ? 'black' : 'grey'}
        fill="transparent"
        strokeWidth={cordWidth}
        onClick={this.select}
        d={d} />
    );
  }
}
