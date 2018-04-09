// Store
import { createStore } from 'redux';
import { updo } from './reducers';

/** SCHEMA:
{
  nodes: {
    id: {
      proto: String,
      args: [String, String, ...],
      layout: {x, y, w, h},
      data: [Number, ...],
      connections: {id: boolean}
    }
  },
  prenodes: {
    id: {
      text: String,
      layout: {x, y, w, h}
    }
  },
  cords: {
    id: {
      source: {node, port},
      sink: {node, port}
    }
  }
  selected: {
    nodes: {id: boolean, ...},
    prenodes: {id: boolean, ...},
    cords: {id: boolean, ...}
  },
  currentCord: {
    node: id, port: index, layout: {x, y},
  },
  nextId: Number
}
*/

const store = createStore(updo);
export default store;
