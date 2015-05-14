import { readFile, writeFile, toBuffer } from "./utils";
import { Polyfills, Polyfill } from "./polyfills";
import { Compiler } from "./compiler";
import { File, FileWriter } from "./file";

/**
 * Compiles a file
 */
export function compile(inputFile: string | File, outputFileName: string, sourceCodeFileName: string, polyfillList: (string | Polyfill)[], minified = false, write?: FileWriter) {
	const polyfills = new Polyfills(polyfillList);
	const compiler = new Compiler(polyfills, false, minified);
	let file: File;
	
	if (write === undefined) {
		write = (file: File) => writeFile(file.fileName, toBuffer(<string | Buffer> file.content));
	}
	
	let read: Promise<string | Buffer>;
	if (typeof inputFile === 'string') {
		read = readFile(inputFile);
	} else {
		read = Promise.resolve(inputFile.content);
	}
	
	return read.then(content => {
		file = {
			fileName: outputFileName,
			content
		};
		
		return compiler.compileFile(file, sourceCodeFileName, write);
	});
}