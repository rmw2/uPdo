# uPdo: A makeover for Puredata in your browser
An attempt at making a nice React/d3 interface for Pd patches running in the browser on [WebPd](http://github.com/sebpiq/WebPd) with [@JoshuaStorm](http://github.com/JoshuaStorm). HackPrinceton Spring 2018

# Thoughts and TODO:

## Representing the patch
Come up with a (more) efficient graph representation of a Pd patch that doesn't destroy the existing one.  This may be impossible, but it seems like pdfu creates a graph like this:

```
<patch>
{
    nodes: [<node1>, ..., <nodeN>],
    connections: [<connection1>, ..., <connectionN>],
    args: [<arg1>, ..., <argN>],
    layout: {<key>: <value>},
}

<nodeK>
{
    id: <id>,
    proto: <object type>,
    args:  [<arg1>, ..., <argN>],
    layout: {<key>: <value>},
    data: [<number1>, ..., <numberN>],
    subpatch: <a patch object>
}

<connectionK>
{
    source: {
        id: <source object id>,
        port: <outlet>
    },
    sink: {
        id: <sink object id>,
        port: <inlet>
    }
}
```

With this, every change to the topology will require iterating over all nodes and connections, which could get prohibitively slow.  Then again, WebPd is made to handle this format, so either we need to bridge between this and a better adjacency list representation, rewrite the handling in webpd (probably not), or deal with it.

To get sound playing, we need to maintain a patch object to pass to WebPd, which we _can_ edit.  We have access to methods like 
```javascript
let patch = Pd.createPatch()
let osc = patch.createObject('osc~', [400])
let dac = patch.createObject('dac~')         
osc.o(0).connect(dac.i(0)) // Connect outlet of [osc~] to left inlet of [dac~]
osc.o(0).connect(dac.i(1)) // Connect outlet of [osc~] to right inlet of [dac~]
osc.i(0).message([330]) 
```
So our patch editing methods should wrap these, and perform whatever necessary updates to the topology as well.

## Rendering the patch
We want our patch rendering method to simply take an object which defines the topology, and render it to the screen.  Click handlers etc. on this svg will update the underlying object, and force a re-render. Presumably each node will have an x and y position, and connection locations can be inferred from that. **pd-fileutils** does _not_ help us too much here, as it just brute force renders an ugly svg.  However, we might be able to learn something from the way it handles the rendering, and make our react renderer do something similar.  Ideally, we can keep the bulk of the styles separate from the representation itself, and apply multiple skins (e.g. a regular old Pd-style skin, and any number of cooler ones).

Potential pitfalls: I'm not sure yet how WebPd handles the dynamic editing.  We might need to also manage the patch.start() and patch.stop() between edits.  Also it seems like on mobile, audio can only be started by a touch event, so maybe we make a Max-like dac~ which toggles start and stop?

## Patch editing functionality

- [ ] Click and drag to move objects
- [ ] Click inlet->outlet to make connections
	- Draw the patch cord while moving
	- Maybe make patch cords beziers or something better than straight lines?
- [ ] Click objects and patch cord to select
	- Change style to indicate selection
	- Delete key will delete
- [ ] Double-click object to edit type as text box
	- This could be tricky, probably will have save the connections, destroy(), create(), and reconnect, (after validating object type).
	- Should an invalid object stay on the screen, or revert?  If the former, should the connections remain in place?
- [ ] Toolbar with quick access to new objects
	- Buttons to create a bang, message, object, etc.
	- Also have delete button available when an object is selected
- [ ] Nicer displays for specific objects
	- Sliders, bangs, toggles
	- Maybe an FFT or waveform visualizer? (table in pd?)
- [ ] Keyboard shortcuts for object creation (max-style or pd style?)
- [ ] Save patch as pd file!!!

Super stretch goals:
- [ ] Patch cord routing
- [ ] Topological sort on objects?
- [ ] Tabbed windows for editing subpatches/ multiple patches at once