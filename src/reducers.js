// reducers
import {
  MOVE, DELETE, SELECT, DESELECT, 
  START_CORD, FINISH_CORD,
  CREATE_OBJECT, CREATE_PREOBJECT, UPDATE_PREOBJECT,
  PROMOTE_PREOBJECT, DEMOTE_OBJECT
} from './actions';

import {omap} from './util.js'

// Utility function for generating an empty selection
// use Object.create for hashsets that don't have object prototype
const emptySelection = () => ({
  nodes: Object.create(null), 
  prenodes: Object.create(null), 
  cords: Object.create(null)
});

export const updo = ({selected=emptySelection(), nodes={}, prenodes={}, cords={}, nextId=0, currentCord={node: null, port: null}}, action) => {
  switch (action.type) {
    /**
     * Iterate over all of the selected nodes and prenodes and apply the
     * move specified by action to each of them
     */
    case MOVE:
      const {dx, dy} = action;
      return {
        selected, cords, nextId, currentCord
        nodes: omap(nodes, id => {
          if (!selected.nodes[id]) return nodes[id];
          let {x, y, w, h} = nodes[id].layout;
          return Object.assign({}, nodes[id], {
            layout: {x: x + dx, y: y + dy, w, h}
          });
        }),
        prenodes: omap(prenodes, id => {
          if (!selected.prenodes[id]) return prenodes[id];
          let {x, y, w, h} = prenodes[id].layout;
          return Object.assign({}, prenodes[id], {
            layout: {x: x + dx, y: y + dy, w, h}
          });
        })
      };

    /**
     * Delete all of the selected items, and all cords connected to selected nodes
     */
    case DELETE:
      return {
        nextId, currentCord,
        selected: emptySelection(), 
        nodes: omap(nodes, id => selected.nodes[id] 
          ? undefined : nodes[id]), 
        prenodes: omap(prenodes, id => selected.prenodes[id] 
          ? undefined : prenodes[id]), 
        cords: omap(cords, id => selected.cords[id] || selected.nodes.connections[id] 
          ? undefined : cords[id])
      };

    /**
     * Select the item specified by action
     */
    case SELECT:
      // Start from the old set of selected items
      const newSelected = {
        nodes: Object.assign({}, selected.nodes),
        prenodes: Object.assign({}, selected.prenodes),
        cords: Object.assign({}, selected.cords)
      };

      // Select the action item
      newSelected[action.type][action.item] = true;
      return {nodes, prenodes, cords, nextId, currentCord, selected: newSelected};

    /**
     * Remove the item specified by action from the selected list
     * If no item is specified, deselect all items
     */
    case DESELECT:
      const newSelected = emptySelection();
      if (action.item) {
        // Preserve old selected state
        newSelected.nodes = Object.assign({}, selected.nodes);
        newSelected.prenodes = Object.assign({}, selected.prenodes);
        newSelected.cords = Object.assign({}, selected.cords);
        // Deselect action item
        newSelected[action.type][action.item] = false;
      }

      return {selected: newSelected, nodes, prenodes, cords, nextId, currentCord};

    /**
     * Start drawing a new patch cord, starting at node, port
     */
    case START_CORD:
      const {node, port} = action;
      return {selected, nodes, prenodes, cords, nextId, currentCord: {node, port}};

    /**
     * Stop drawing a patch cord but do not create a new one
     */
    case CANCEL_CORD:
      return {selected, nodes, prenodes, cords, nextId, currentCord: {node: null, port: null}};

    /**
     * Finish drawing a patch cord and add a new connection between the start
     * and finish nodes
     */
    case FINISH_CORD:
      const {node, port} = action;
      const newNodes = omap(nodes, id => id === node || id === currentCord.node
        ? Object.assign({}, nodes[id], {
          cords: Object.assign({}, nodes[id].cords, {[id]: true})
        }) : nodes[id]);
      const newCords = Object.assign({}, cords, {[nextId]: {
        source: {node: currentCord.node, port: currentCord.port},
        sink: {node, port}
      }});

      return {
        selected, prenodes,
        nodes: newNodes,
        cords: newCords, 
        nextId: nextId + 1, 
        currentCord: {node: null, port: null}
      };

    /**
     * Create an object from thin air!
     */
    case CREATE_OBJECT:
      const {id, proto, args, layout} = action;
      return {
        selected, prenodes, cords, nextId, currentCord,
        nodes: Object.assign({}, nodes, {
          [id]: {proto, args, layout, connections: {}}
        })
      };

    /**
     * Create a new object from an existing preobject
     */
    case PROMOTE_PREOBJECT:
      const {nodeId, id, proto, args} = action;
      return {
        selected, cords, nextId, currentCord,
        nodes: Object.assign({}, nodes, {
          [nodeId]: {proto, args, layout: prenodes[id].layout, connections: {}}
        }), 
        prenodes: Object.assign({}, prenodes, {[id]: undefined}), 
      };

    /**
     * Delete an object's connections, and replace it with a preobject
     */
    case DEMOTE_OBJECT:
      const {id, text} = action;
      return {
        selected, cords, currentCord,
        nodes: Object.assign({}, nodes, {[id]: undefined}), 
        prenodes: Object.assign({}, prenodes, {
          [nextId]: {text, layout: nodes[id].layout}
        }),
        nextId: nextId + 1
      };

    /**
     * Create a preobject, it does nothing ! 
     */
    case CREATE_PREOBJECT:
      const {layout} = action;
      return {
        selected, nodes, cords, currentCord,
        nextId: nextId + 1, 
        prenodes: Object.assign({}, prenodes, {[nextId]: {text: '', layout}})
      };

    /**
     * 
     */
    case UPDATE_PREOBJECT:
      const {id, text} = action;
      return {
        selected, nodes, cords, nextId, currentCord,
        prenodes: Object.assign({}, prenodes, {
          [id]: {text, layout: prenodes[id].layout}
        })
      };
    default:
      return {selected, nodes, prenodes, cords, nextId, currentCord};
  }
}