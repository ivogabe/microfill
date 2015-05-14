import { Polyfills } from "./polyfills";
import { Emitter } from "./emitter";
import { LoaderEmitter } from "./loader-emitter";
import { BundleEmitter } from "./bundle-emitter";
import { File, FileWriter } from "./file";
import { PolyfillReader } from "./polyfill-reader";

export class Compiler {
	polyfills: Polyfills;
	minified: boolean;
	streaming: boolean;
	reader: PolyfillReader;
	
	constructor(polyfills: Polyfills, streaming: boolean, minified: boolean) {
		this.polyfills = polyfills;
		this.streaming = streaming;
		this.minified = minified;
		
		this.reader = new PolyfillReader(polyfills, minified);
	}
	
	compileFile(file: File, sourceCodeFileName: string, write: FileWriter) {
		const loaderEmitter = new LoaderEmitter(this.polyfills, this.streaming, this.minified);
		const bundleEmitter = new BundleEmitter(this.polyfills, this.reader, this.streaming, this.minified);
		
		return Promise.all([
			loaderEmitter.emit(file, sourceCodeFileName, write),
			bundleEmitter.emit(file, write)
		]).then(() => undefined);
	}
}
