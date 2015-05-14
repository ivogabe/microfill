// node.d.ts uses the following types, but they are not available in the default lib.d.ts,
// since we're targeting ES5. We declare these types here as typescript wouldn't find them
// and throw errors instead.

declare class DataView {}
declare class Map {}
declare class Set {}
declare class WeakMap {}