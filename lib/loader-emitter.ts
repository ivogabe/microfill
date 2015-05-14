import * as path from "path";
import { Emitter } from "./emitter";
import { Polyfills, Polyfill } from "./polyfills";
import { File, FileWriter } from "./file";
import { toBuffer } from "./utils";

const header = new Buffer(`;(function(){
	var n = 0;
`);
const headerMin = new Buffer(`document.head.appendChild(function(n,t){`);

function footer(fileNameExtensionless: string, extension: string) {
	return `
	
	var script = document.createElement("script");
	script.src = ${ JSON.stringify(fileNameExtensionless + '-') } + n.toString(16) + ${ JSON.stringify(extension) };
	script.type = "text/javascript";
	document.head.appendChild(script);
})();
`
}

function footerMin(fileNameExtensionless: string, extension: string) {
	return `return t.src=${ JSON.stringify(fileNameExtensionless + '-') }+n.toString(16)+${ JSON.stringify(extension) },` +
		`t.type="text/javascript",` +
		`t}` +
		`(0,document.createElement("script")))`;
}

/**
 * Emits the main code file, that will load the code file with the corrent polyfills.
 */
export class LoaderEmitter extends Emitter {
	polyfills: Polyfills;
	minified: boolean;
	
	private outputBuffers: Buffer[] = [];
	private outputBuffersLength: number = 0;
	
	constructor(polyfills: Polyfills, streaming: boolean, minified: boolean) {
		super(streaming, minified);
		this.polyfills = polyfills;
	}
	
	/**
	 * @param sourceCodeFileName The filename to be used in the loader.
	 * @param write Callback to write the result. `write` is called once.
	 */
	emit(file: File, sourceCodeFileName: string, write: FileWriter) {
		this.emitHeader();
		for (let i = 0; i < this.polyfills.length; i++) {
			this.emitPolyfill(i);
		}
		this.emitFooter(sourceCodeFileName);
		return this.finish(file.fileName, write);
	}
	
	private emitHeader() {
		this.writeText(this.minified ? headerMin : header);
	}
	
	private emitPolyfill(index: number) {
		const verbose = !this.minified;
		const polyfill = this.polyfills.findIndex(index);
		
		this.writeText('\n\tif (', 'if(');
		this.writeText(polyfill.check);
		this.writeText(')');
		
		this.writeText(' n += ', 'n+=');
		this.writeText('1 << ' + index, '' + (1 << index));
		this.writeText(';');
	}
	
	private emitFooter(fileName: string) {
		const extension = path.extname(fileName);
		const fileNameExtensionless = fileName.substring(0, fileName.length - extension.length);
		
		this.writeText((this.minified ? footerMin : footer)(fileNameExtensionless, extension));
	}
	
	private writeText(content: string | Buffer, contentMinified?: string | Buffer) {
		let contentBuffer: Buffer;
		
		if (this.minified && contentMinified !== undefined) {
			contentBuffer = toBuffer(contentMinified);
		} else {
			contentBuffer = toBuffer(content);
		}
		
		if (this.streaming) {
			
		} else {
			this.outputBuffers.push(contentBuffer);
			this.outputBuffersLength += contentBuffer.length;
		}
	}
	
	private finish(fileName: string, write: FileWriter) {
		if (this.streaming) {
			
		} else {
			return write({
				fileName: fileName,
				content: Buffer.concat(this.outputBuffers, this.outputBuffersLength)
			});
		}
	}
}