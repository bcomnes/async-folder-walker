// @ts-check

'use strict'

const fs = require('fs')
const path = require('path')
const ignore = require('ignore')

const { readdir, lstat } = fs.promises

/**
 * pathFilter lets you filter files based on a resolved `filepath`.
 * @callback pathFilter
 * @param {String} filepath - The resolved `filepath` of the file to test for filtering.
 *
 * @return {Boolean} Return false to filter the given `filepath` and true to include it.
 */
const pathFilter = filepath => true

/**
 * statFilter lets you filter files based on a lstat object.
 * @callback statFilter
 * @param {Object} st - A fs.Stats instance.
 *
 * @return {Boolean} Return false to filter the given `filepath` and true to include it.
 */
const statFilter = st => true

/**
 * FWStats is the object that the okdistribute/folder-walker module returns by default.
 *
 * @typedef FWStats
 * @property {String} root - The filepath of the directory where the walk started.
 * @property {String} filepath - The resolved filepath.
 * @property {Object} stat - A fs.Stats instance.
 * @property {String} relname - The relative path to `root`.
 * @property {String} basename - The resolved filepath of the files containing directory.
 */

/**
 * shaper lets you change the shape of the returned file data from walk-time stats.
 * @callback shaper
 * @param {FWStats} fwStats - The same status object returned from folder-walker.
 *
 * @return {*} - Whatever you want returned from the directory walk.
 */
const shaper = ({ root, filepath, stat, relname, basename }) => filepath

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
async function * asyncFolderWalker (dirs, opts) {
  opts = Object.assign({
    fs,
    pathFilter,
    statFilter,
    ignore,
    maxDepth: Infinity,
    shaper
  }, opts)

  // @ts-ignore
  const ig = ignore().add(opts.ignore)

  const roots = [dirs].flat().filter(opts.pathFilter)
  const pending = []

  while (roots.length) {
    const root = roots.shift()
    pending.push(root)
    while (pending.length) {
      const current = pending.shift()
      if (typeof current === 'undefined') continue
      const st = await lstat(current)
      const rel = relname(root, current)
      if (ig.ignores(st.isDirectory() ? rel + '/' : rel)) continue
      if ((!st.isDirectory() || depthLimiter(current, root, opts.maxDepth)) && opts.statFilter(st)) {
        yield opts.shaper(fwShape(root, current, st))
        continue
      }

      const files = await readdir(current)
      files.sort()

      for (const file of files) {
        const next = path.join(current, file)
        if (opts.pathFilter(next)) pending.unshift(next)
      }
      if (current === root || !opts.statFilter(st)) continue
      else yield opts.shaper(fwShape(root, current, st))
    }
  }
}

function relname (root, name) {
  return root === name ? path.basename(name) : path.relative(root, name)
}

/**
 * Generates the same shape as the folder-walker module.
 *
 * @function
 * @private
 * @param {String} root - Root filepath.
 * @param {String} name - Target filepath.
 * @param {Object} st - fs.Stat object.
 *
 * @return {FWStats} - Folder walker object.
 */
function fwShape (root, name, st) {
  return {
    root: root,
    filepath: name,
    stat: st,
    relname: relname(root, name),
    basename: path.basename(name)
  }
}

/**
 * Test if we are at maximum directory depth.
 *
 * @private
 * @function
 * @param {String} filePath - The resolved path of the target fille.
 * @param {String} relativeTo - The root directory of the current walk.
 * @param {Number} maxDepth - The maximum number of folders to descend into.
 *
 * @returns {Boolean} - Return true to signal stop descending.
 */
function depthLimiter (filePath, relativeTo, maxDepth) {
  if (maxDepth === Infinity) return false
  const rootDepth = relativeTo.split(path.sep).length
  const fileDepth = filePath.split(path.sep).length
  return fileDepth - rootDepth > maxDepth
}

/**
 * Async iterable collector
 *
 * @async
 * @function
 * @private
 * @param {AsyncIterator} iterator - The iterator to collect into an array
 */
async function all (iterator) {
  const collect = []

  // @ts-ignore
  for await (const result of iterator) {
    collect.push(result)
  }

  return collect
}

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
async function allFiles (dirs, opts) {
  return all(asyncFolderWalker(dirs, opts))
}

module.exports = {
  asyncFolderWalker,
  allFiles,
  all
}
