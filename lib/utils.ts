/// <reference path="typings-fix" />

import * as fs from "fs";

/**
 * Converts a string or a Buffer to a Buffer.
 */
export function toBuffer(content: string | Buffer): Buffer {
	if (typeof content === 'string') return new Buffer(content);
	return <Buffer> content;
}

/**
 * Read a file from the file system.
 */
export function readFile(fileName: string) {
	return new Promise<Buffer>((resolve, reject) => {
		fs.readFile(fileName, (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

/**
 * Writes a file to the file system.
 */
export function writeFile(fileName: string, content: Buffer) {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(fileName, content, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve(undefined);
			}
		});
	});
}