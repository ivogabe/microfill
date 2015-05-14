import * as stream from 'stream';
import { File } from './file';

export class Bundler {
	polyfillCount: number;
	bundleCount: number;
	loaded: number;
	
	polyfillBuffers: Buffer[];
	
	inputFileName: string;
	inputBuffer: Buffer;
	inputStream: stream.Readable;
	
	streaming: boolean;
	outputStreams: stream.Readable[];
	buffers: Promise<Buffer[]>;
	
	private buffersResolve: (buffers: Buffer[]) => void;
	private buffersReject: (reason: any) => void;
	
	constructor(input: File, polyfillCount: number, streaming: boolean) {
		if (streaming) {
			this.inputStream = <stream.Readable> input.content;
		} else {
			this.inputBuffer = <Buffer> input.content;
		}
		
		this.polyfillCount = polyfillCount | 0;
		this.bundleCount = 1 << polyfillCount;
		// = 2 ^ polyfillCount
		// Every polyfill can be turned on or off, so 2 * 2 * 2 * ... 2 = 2 ^ polyfillCount options
		
		this.loaded = 0;
		
		this.polyfillBuffers = new Array(this.polyfillCount);
		
		this.streaming = streaming;
		if (streaming) {
			this.outputStreams = new Array(this.bundleCount);
			for (let i = 0; i < this.bundleCount; i++) {
				this.outputStreams[i] = new stream.Readable();
			}
		} else {
			this.buffers = new Promise<Buffer[]>((resolve, reject) => {
				this.buffersResolve = resolve;
				this.buffersReject = reject;
			});
		}
		
		if (this.isDone()) this.emitBuffers();
	}
	
	onLoad(polyfill: number, content: Buffer) {
		this.loaded |= 1 << polyfill;
		this.polyfillBuffers[polyfill] = content;
		
		if (this.streaming) {
			// TODO
		} else {
			if (this.isDone()) this.emitBuffers();
		}
	}
	notFound(reason: any) {
		this.buffersReject(reason);
	}
	
	polyfillIsLoaded(polyfill: number) {
		return (this.loaded & (1 << polyfill)) !== 0;
	}
	
	isDone() {
		return this.loaded === this.bundleCount - 1;
	}
	
	bundleHasPolyfill(bundle: number, polyfill: number) {
		return (bundle & (1 << polyfill)) !== 0;
	}
	
	private emitBuffers() {
		const bundles: Buffer[] = [];
		for (let bundle = 0; bundle < this.bundleCount; bundle++) {
			bundles[bundle] = this.getBuffer(bundle);
		}
		
		this.buffersResolve(bundles);
	}
	private getBuffer(bundle: number) {
		let length = this.inputBuffer.length;
		const buffers: Buffer[] = [];
		
		for (let polyfill = 0; polyfill < this.polyfillCount; polyfill++) {
			if (this.bundleHasPolyfill(bundle, polyfill)) {
				let polyfillBuffer = this.polyfillBuffers[polyfill]
				buffers.push(polyfillBuffer);
				length += polyfillBuffer.length;
			}
		}
		
		buffers.push(this.inputBuffer);
		
		return Buffer.concat(buffers, length);
	}
}