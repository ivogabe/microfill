import * as path from "path";
import { Emitter } from "./emitter";
import { Polyfills } from "./polyfills";
import { File, FileWriter } from "./file";
import { Bundler } from "./bundler";
import { PolyfillReader } from "./polyfill-reader";

export class BundleEmitter extends Emitter {
	polyfills: Polyfills;
	reader: PolyfillReader;
	
	constructor(polyfills: Polyfills, reader: PolyfillReader, streaming: boolean, minified: boolean) {
		super(streaming, minified);
		
		this.polyfills = polyfills;
		this.reader = reader;
	}
	
	emit(input: File, write: FileWriter): Promise<void> {
		const length = this.polyfills.length;
			
		const bundler = new Bundler(input, length, this.streaming);
		
		for (let i = 0; i < length; i++) {
			((i: number) => { // Create scope, since a `let` in a loop isn't supported (yet) in TS
				this.reader.loadIndex(i)
					.then(content => bundler.onLoad(i, content))
					.catch(reason => bundler.notFound(reason));
			})(i);
		}
		
		return bundler.buffers.then(buffers => {
			const extension = path.extname(input.fileName);
			const fileNameExtensionless = input.fileName.substring(0, input.fileName.length - extension.length);
			
			var promises: Promise<void>[] = [];
			for (let i = 0; i < buffers.length; i++) {
				promises.push(write({
					fileName: fileNameExtensionless + '-' + i.toString(16) + extension,
					content: buffers[i]
				}));
			}
			
			return Promise.all(promises);
		}).then(() => undefined);
	}
}