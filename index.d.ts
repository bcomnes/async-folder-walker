/**
 * Options object
 */
export type Opts = {
    /**
     * - A pathFilter cb.
     */
    pathFilter?: pathFilter | undefined;
    /**
     * - A statFilter cb.
     */
    statFilter?: statFilter | undefined;
    /**
     * - An array of .gitignore style strings of files to ignore.
     */
    ignore?: string[] | undefined;
    /**
     * - The maximum number of folders to walk down into.
     */
    maxDepth?: number | undefined;
    /**
     * - A shaper cb.
     */
    shaper?: shaper | undefined;
};
/**
 * pathFilter lets you filter files based on a resolved `filepath`.
 */
export type pathFilter = (filepath: string) => boolean;
/**
 * statFilter lets you filter files based on a lstat object.
 */
export type statFilter = (st: Object) => boolean;
/**
 * FWStats is the object that the okdistribute/folder-walker module returns by default.
 */
export type FWStats = {
    /**
     * - The filepath of the directory where the walk started.
     */
    root: string;
    /**
     * - The resolved filepath.
     */
    filepath: string;
    /**
     * - A fs.Stats instance.
     */
    stat: Object;
    /**
     * - The relative path to `root`.
     */
    relname: string;
    /**
     * - The resolved filepath of the files containing directory.
     */
    basename: string;
};
/**
 * shaper lets you change the shape of the returned file data from walk-time stats.
 */
export type shaper = (fwStats: FWStats) => any;
/**
 * Options object
 *
 * @typedef Opts
 * @property {pathFilter} [pathFilter] - A pathFilter cb.
 * @property {statFilter} [statFilter] - A statFilter cb.
 * @property {String[]} [ignore] - An array of .gitignore style strings of files to ignore.
 * @property {Number} [maxDepth=Infinity] - The maximum number of folders to walk down into.
 * @property {shaper} [shaper] - A shaper cb.
 */
/**
 * Create an async generator that iterates over all folders and directories inside of `dirs`.
 *
 * @async
 * @generator
 * @function
 * @public
 * @param {String|String[]} dirs - The path of the directory to walk, or an array of directory paths.
 * @param {?(Opts)} opts - Options used for the directory walk.
 *
 * @yields {Promise<String|any>} - An async iterator that returns anything.
 */
export function asyncFolderWalker(dirs: string | string[], opts: (Opts) | null): AsyncGenerator<any, void, unknown>;
/**
 * allFiles gives you all files from the directory walk as an array.
 *
 * @async
 * @function
 * @public
 * @param {String|String[]} dirs - The path of the directory to walk, or an array of directory paths.
 * @param {?(Opts)} opts - Options used for the directory walk.
 *
 * @returns {Promise<String[]|any>} - An async iterator that returns anything.
 */
export function allFiles(dirs: string | string[], opts: (Opts) | null): Promise<string[] | any>;
/**
 * Async iterable collector
 *
 * @async
 * @function
 * @private
 * @param {AsyncIterator} iterator - The iterator to collect into an array
 */
export function all(iterator: AsyncIterator<any, any, undefined>): Promise<any[]>;
