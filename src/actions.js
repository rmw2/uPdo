// Actions
export const SELECT = 'SELECT';
export const DESELECT = 'DESELECT';
export const DELETE = 'DELETE';
export const MOVE = 'MOVE';
export const ADD_PREOBJECT = 'ADD_PREOBJECT';
export const PROMOTE_PREOBJECT = 'PROMOTE_PREOBJECT';
export const ADD_OBJECT = 'ADD_OBJECT';
export const DEMOTE_OBJECT = 'DEMOTE_OBJECT';
export const START_CORD = 'START_CORD';
export const FINISH_CORD = 'FINISH_CORD';
export const UPDATE_PREOBJECT = 'UPDATE_PREOBJECT';

export function select(nodelist) {
	return {type: SELECT, nodelist};
}

export function deselect(node) {
	return {type: DESELECT, node};
}

export function delete(node) {
	return {type: DELETE, node};
}

export function move(dx, dy) {
	return {type: MOVE, dx, dy};
}

export function startCord(node, port) {
	return {type: START_CORD, node, port};
}

export function finishCord(node, port) {
	return {type: FINISH_CORD, node, port};
}

export function addPreObject(layout) {
	return {type: ADD_PREOBJECT, layout};
}

export function addObject(proto, args, id) {
	return {type: ADD_OBJECT, proto, args, layout};
}

export function promote(nodeId, id, proto, args) {
	return {type: PROMOTE_PREOBJECT, nodeId, id, proto, args}
}

export function demote(id, text) {
	return {type: DEMOTE_OBJECT, id, text};
}

export function updatePreobject(id, text) {
	return {type: UPDATE_PREOBJECT, id, text};
}