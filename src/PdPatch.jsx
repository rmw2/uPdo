import React, { Component } from 'react';
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