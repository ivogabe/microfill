import * as stream from "stream";

/**
 * Represents an input or output file
 */
export class File {
	fileName: string;
	content: string | Buffer | stream.Readable
}

/**
 * Writes a file.
 * The file can for instance be written to the filesystem or a gulp stream.
 */
export type FileWriter = (file: File) => Promise<void>;