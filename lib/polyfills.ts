import * as path from "path";

/**
 * Represents a polyfill
 */
export interface Polyfill {
	/**
	 * Name of the polyfill.
	 * Convention: use lowercases and use a `-` to seperate words.
	 * Example: "fetch", "set-immediate"
	 */
	name: string;
	/**
	 * JavaScript code to check whether a feature is missing.
	 * It should return `true` if the feature should be polyfilled.
	 * Example: "!window.fetch"
	 */
	check: string;
	/**
	 * Path of the file that contains the polyfill.
	 */
	fileName: string;
	/**
	 *  Path of a minified file that contains the polyfill
	 */
	fileNameMin?: string;
}

/**
 * Represents a group of polyfills.
 */
export class Polyfills {
	/**
	 * Creates a new group of polyfills.
	 * @param items A list of Polyfill objects or names of polyfills.
	 */
	constructor(items: (string | Polyfill)[] = []) {
		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			
			if (typeof item === 'string') {
				this.register(Polyfills.defaults.findName(item));
			} else {
				this.register(item);
			}
		}
	}
	
	private indices: string[] = [];
	private items: { [name: string]: Polyfill } = {};
	
	/**
	 * Adds a new polyfill
	 */
	register(item: Polyfill) {
		this.indices.push(item.name);
		this.items[item.name] = item;
	}
	
	/**
	 * Returns the polyfill at the specified index.
	 */
	findIndex(index: number) {
		return this.findName(this.indices[index]);
	}
	/**
	 * Returns the polyfill with the specified name.
	 */
	findName(name: string) {
		return this.items[name];
	}
	
	/**
	 * The number of polyfills.
	 */
	get length() {
		return this.indices.length;
	}
	
	static defaults = new Polyfills([
		{
			name: 'promise',
			check: '!window.Promise',
			fileName: path.join(path.dirname(require.resolve('promise-polyfill')), 'Promise.js'),
			fileNameMin: path.join(path.dirname(require.resolve('promise-polyfill')), 'Promise.min.js')
		},
		{
			name: 'set-immediate',
			check: '!window.setImmediate',
			fileName: require.resolve('setimmediate')
		},
		{
			name: 'fetch',
			check: '!window.fetch',
			fileName: require.resolve('whatwg-fetch')
		},
		{
			name: 'collections',
			check: '!window.WeakMap || !window.Map || !window.Set',
			fileName: path.join(require.resolve('es6-collections')),
			fileNameMin: path.join(path.dirname(require.resolve('es6-collections')), 'es6-collections.js')
		}
	]);
}
