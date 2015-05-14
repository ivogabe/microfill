import * as path from "path";
import * as fs from "fs";
import * as diff from "diff";
import * as chalk from "chalk";
import * as yargs from "yargs";
import * as lib from "./index";
import * as utils from "./utils";

export interface TestConfig {
	polyfills: (string | lib.Polyfill)[];
}


export enum TestMode {
	/**
	 * Compare with baselines
	 */
	Compare,
	/**
	 * Acccept output as new baselines
	 */
	Accept
}

export class TestRunner {
	mode: TestMode;
	
	constructor(mode: TestMode) {
		this.mode = mode;
	}
	
	run(folder: string) {
		let config: TestConfig;
		
		return utils.readFile(path.join(folder, 'config.json')).then(content => {
			config = JSON.parse(content.toString());
			
			return Promise.all([
				this.runCompile(folder, config, false),
				this.runCompile(folder, config, true)
			]);
		});
	}
	
	private collapseString(str: string, length: number) {
		if (str.length <= length) return str;
		
		const beginLength = ((length - 2) / 2) | 0;
		const endLength = length - beginLength - 3;
		
		const newLine = (str.substring(beginLength, str.length - endLength).indexOf('\n') !== -1) ? '\n' : '';
		
		return str.substring(0, beginLength) + newLine + '...' + newLine + str.substring(str.length - endLength);
	}
	
	writeOrCompare(file: lib.File) {
		if (this.mode === TestMode.Compare) {
			return utils.readFile(file.fileName).then(baseline => {
				const diffs = diff.diffChars(baseline.toString(), file.content.toString());
				let str = '';
				let changed = false;
				
				for (const part of diffs) {
					if (part.added) {
						str += chalk.green(this.collapseString(part.value, 128));
						changed = true;
					} else if (part.removed) {
						str += chalk.red(this.collapseString(part.value, 128));
						changed = true;
					} else {
						str += chalk.grey(this.collapseString(part.value, 48));
					}
				}
				
				if (changed) {
					const title = 'File changed: ' + path.relative(path.resolve(__dirname, '../tests'), file.fileName);
					console.error(title);
					console.error(str);
					
					throw new Error(title);
				}
			}).catch(reason => {
				if (reason.code === 'ENOENT') {
					const title = 'New file: ' + path.relative(path.resolve(__dirname, '../tests'), file.fileName);
					console.error(title);
					console.error(file.content.toString());
					
					throw new Error(title);
				}
			});
		} else {
			return utils.writeFile(file.fileName, utils.toBuffer(<string | Buffer> file.content));
		}
	}
	
	private runCompile(folder: string, config: TestConfig, minified: boolean) {
		// TODO: Custom fileWriter
		const fullFolder = path.join(folder, 'output' + (minified ? '-min' : ''));
		
		const files: string[] = [];
		const write = (file: lib.File) => {
			files.push(path.relative(fullFolder, file.fileName));
			return this.writeOrCompare(file);
		};
		
		return lib.compile(path.join(folder, 'file.js'), path.join(fullFolder, '/file.js'), 'file.js', config.polyfills, minified, write).then(() => {
			this.writeOrCompare({
				fileName: path.join(fullFolder, 'files.txt'),
				content: files.sort().join('\n')
			});
		});
	}
	
	static runAll(mode: TestMode) {
		console.log('Running tests in mode:', TestMode[mode]);
		
		const runner = new TestRunner(mode);
		const testPath = path.resolve(__dirname, '../../tests');
		const tests = fs.readdirSync(testPath);
		
		console.log('Tests:', tests.join(', '))
		
		for (const test of tests) {
			try {
				fs.mkdirSync(path.join(testPath, test, 'output'));
				fs.mkdirSync(path.join(testPath, test, 'output-min'));
			} catch (e) {
				// Errors are thrown if directories already exist
			}
			
			((test: string) => {
				runner.run(path.join(testPath, test)).then(() => {
					console.log('Test completed:', test);
				}).catch((reason) => {
					console.error('Test failed:', test);
					console.error('Reason:', reason);
				});
			})(test);
		}
	}
}

const accept = (yargs.argv.accept || yargs.argv.a) ? true : false;

TestRunner.runAll(accept ? TestMode.Accept : TestMode.Compare);