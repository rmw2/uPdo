

// Utility function for mapping an object {k: v} to a new object {k: f(v)}
export const omap = (o, f) => 
	Object.assign({}, ...Object.keys(o).map(k => ({[k]: f(o[k])})));
