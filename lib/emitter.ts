import { File, FileWriter } from "./file";

export class Emitter {
	streaming: boolean;
	minified: boolean;
	
	constructor(streaming: boolean, minified: boolean) {
		this.streaming = streaming;
		this.minified = minified;
	}
}