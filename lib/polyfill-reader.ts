import { readFile } from "./utils";
import { Polyfills, Polyfill } from "./polyfills";

/**
 * Reads polyfills from the file system & caches them
 */
export class PolyfillReader {
	polyfills: Polyfills;
	minified: boolean;
	
	constructor(polyfills: Polyfills, minified: boolean) {
		this.polyfills = polyfills;
		this.minified = minified;
	}
	
	private cache: { [fileName: string]: Promise<Buffer> } = {};
	
	/**
	 * Loads a polyfill based on its index.
	 */
	loadIndex(index: number) {
		return this.loadPolyfill(this.polyfills.findIndex(index));
	}
	
	/**
	 * Loads a polyfill
	 * Returns a Promise that will resolve to a Buffer containing the contents of the polyfill.
	 */
	loadPolyfill(polyfill: Polyfill) {
		let fileName: string;
		if (this.minified && polyfill.fileNameMin) {
			fileName = polyfill.fileNameMin;
		} else {
			fileName = polyfill.fileName;
		}
		
		if (this.cache[fileName]) return this.cache[fileName];
		
		return this.cache[fileName] = readFile(fileName);
	}
}