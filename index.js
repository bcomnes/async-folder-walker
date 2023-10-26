// @ts-check

/**
 * @typedef {import('fs').Stats} Stats
 */

'use strict'

const fs = require('fs')
const path = require('path')
const ignore = require('ignore')

const { readdir, lstat } = fs.promises

/**
 * PathFilter lets you filter files based on a resolved `filepath`.
 * @callback PathFilter
 * @param {string} filepath - The resolved `filepath` of the file to test for filtering.
 *
 * @return {boolean} Return false to filter the given `filepath` and true to include it.
 */

/**
 * @type PathFilter
 */
const pathFilter = (/* filepath */) => true

/**
 * statFilter lets you filter files based on a lstat object.
 * @callback StatFilter
 * @param {Stats} st - A fs.Stats instance.
 *
 * @return {boolean} Return false to filter the given `filepath` and true to include it.
 */

/**
 * @type StatFilter
 */
const statFilter = (/* st */) => true

/**
 * FWStats is the object that the okdistribute/folder-walker module returns by default.
 *
 * @typedef FWStats
 * @property {string} root - The filepath of the directory where the walk started.
 * @property {string} filepath - The resolved assolute path.
 * @property {Stats} stat - A fs.Stats instance.
 * @property {string} relname - The relative path to `root`.
 * @property {string} basename - The resolved filepath of the files containing directory.
 */

/**
 * Shaper lets you change the shape of the returned file data from walk-time stats.
 * @template T
 * @callback Shaper
 * @param {FWStats} fwStats - The same status object returned from folder-walker.
 *
 * @return {T} - Whatever you want returned from the directory walk.
 */

/**
 * @type {Shaper<string>}
 */
const shaper = ({ filepath/*, root, stat, relname, basename */ }) => filepath

/**
  * AFWReturnType will return the return type of AFW for your given shaper.
  *
  * @template T
  * @typedef {T extends AsyncGenerator<infer U, any, any> ? U : never} AFWReturnType
  */

/**
 * Options object.
 *
 * @template T
 * @typedef {object} AFWOpts
 * @property {PathFilter} pathFilter=pathFilter - A pathFilter callback.
 * @property {StatFilter} statFilter=statFilter - A statFilter callback.
 * @property {string[]} ignore=[] - An array of .gitignore style strings of files to ignore.
 * @property {number} maxDepth=Infinity - The maximum number of folders to walk down into.
 * @property {Shaper<T>} shaper=shaper - A shaper callback.
 */

/**
 * Create an async generator that iterates over all folders and directories inside of `dirs`.
 *
 * @template T
 * @public
 * @param {string|string[]} dirs - The path or paths of the directory to walk.
 * @param {?Partial<AFWOpts<T>>} [opts] - Options used for the directory walk.
 * @yields {T} - An iterator that returns a value of type T.
 */
async function * asyncFolderWalker (dirs, opts) {
  /** @type {AFWOpts<T>} */
  const resolvedOpts = Object.assign({
    fs,
    pathFilter,
    statFilter,
    ignore: [],
    maxDepth: Infinity,
    shaper
  }, opts)

  // @ts-ignore
  const ig = ignore().add(resolvedOpts.ignore)

  const roots = [dirs].flat().filter(resolvedOpts.pathFilter)
  const pending = []

  while (roots.length) {
    const root = roots.shift()
    if (!root) continue // Handle potential undefined value
    pending.push(root)

    while (pending.length) {
      const current = pending.shift()
      if (!current) continue // Handle potential undefined value

      const st = await lstat(current)
      const rel = relname(root, current)
      if (ig.ignores(st.isDirectory() ? rel + '/' : rel)) continue
      if ((!st.isDirectory() || depthLimiter(current, root, resolvedOpts.maxDepth)) && resolvedOpts.statFilter(st)) {
        yield resolvedOpts.shaper(fwShape(root, current, st))
        continue
      }

      const files = await readdir(current)
      files.sort()

      for (const file of files) {
        const next = path.join(current, file)
        if (resolvedOpts.pathFilter(next)) pending.unshift(next)
      }
      if (current === root || !resolvedOpts.statFilter(st)) continue
      else yield resolvedOpts.shaper(fwShape(root, current, st))
    }
  }
}

/**
 * @param  {string} root
 * @param  {string} name
 * @return {string}      The basename or relative name if root === name
 */
function relname (root, name) {
  return root === name ? path.basename(name) : path.relative(root, name)
}

/**
 * Generates the same shape as the folder-walker module.
 *
 * @param {string} root - Root filepath.
 * @param {string} name - Target filepath.
 * @param {Stats} st - fs.Stat object.
 * @returns {FWStats} Folder walker object.
 */
function fwShape (root, name, st) {
  return {
    root,
    filepath: name,
    stat: st,
    relname: relname(root, name),
    basename: path.basename(name)
  }
}

/**
 * Test if we are at maximum directory depth.
 *
 * @param {string} filePath - The resolved path of the target file.
 * @param {string} relativeTo - The root directory of the current walk.
 * @param {number} maxDepth - The maximum number of folders to descend into.
 * @returns {boolean} Return true to signal stop descending.
 */
function depthLimiter (filePath, relativeTo, maxDepth) {
  if (maxDepth === Infinity) return false
  const rootDepth = relativeTo.split(path.sep).length
  const fileDepth = filePath.split(path.sep).length
  return fileDepth - rootDepth > maxDepth
}

/**
 * Async iterable collector.
 *
 * @template T
 * @public
 * @param {AsyncIterableIterator<T>} iterator - The iterator to collect into an array.
 * @returns {Promise<T[]>} Array of items collected from the iterator.
 */
async function all (iterator) {
  const collect = []

  for await (const result of iterator) {
    collect.push(result)
  }

  return collect
}

/**
 * Gives you all files from the directory walk as an array.
 *
 * @template T
 * @public
 * @param {string|string[]} dirs - The path of the directory to walk, or an array of directory paths.
 * @param {Partial<AFWOpts<T>>} [opts] - Options used for the directory walk.
 * @returns {Promise<T[]>} Array of files or any other result from the directory walk.
 */
async function allFiles (dirs, opts) {
  return all(asyncFolderWalker(dirs, opts))
}

module.exports = {
  asyncFolderWalker,
  allFiles,
  all
}
