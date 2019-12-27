# async-folder-walker
[![Actions Status](https://github.com/bcomnes/async-folder-walker/workflows/tests/badge.svg)](https://github.com/bcomnes/async-folder-walker/actions)

A recursive async iterator of the files and directories in a given folder. Can take multiple folders, limit walk depth and filter based on path names and stat results.

```
npm install async-folder-walker
```

## Usage

``` js
const { asyncFolderWalker, allFiles } = require('async-folder-walker');

async function iterateFiles () {
  const walker = asyncFolderWalker(['.git', 'node_modules']);
  for await (const file of walker) {
    console.log(file); // logs the file path!
  }
}

async function getAllFiles () {
  const allFilepaths = await allFiles(['.git', 'node_modules']);
  console.log(allFilepaths);
}

iterateFiles().then(() => getAllFiles());
```

## API

### `import { asyncFolderWalker } from 'async-folder-walker'`

Import `asyncFolderWalker`.

### `async-gen = asyncFolderWalker(paths, [opts])`

Return an async generator that will iterate over all of files inside of a directory. `paths` can be a string path or an Array of string paths.

You can iterate over each file and directory individually using a `for-await...of` loop.  Note, you must be inside an [async function statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

```js
const { asyncFolderWalker } = require('async-folder-walker');
async function iterateFiles () {
  const walker = asyncFolderWalker(['.git', 'node_modules']);
  for await (const file of walker) {
    console.log(file); // logs the file path!
  }
}

iterateFiles();
```

Opts include:

```js
{
  fs: require('fs'),
  pathFilter: filepath => true,
  statFilter st => true,
  maxDepth: Infinity,
  shaper: ({ root, filepath, stat, relname, basename }) => filepath
}
```

The `pathFilter` function allows you to filter files from additional async stat operations.  Return false to filter the file.

```js
{ // exclude node_modules
  pathFilter: filepath => !filepath.includes(node_modules)
}
```

The `statFilter` function allows you to filter files based on the internal stat operation.  Return false to filter the file.

```js
{ // exclude all directories:
  statFilter: st => !st.isDirectory()
}
```

The `shaper` function lets you change the shape of the returned value based on data accumulaed during the iteration.  To return the same shape as [okdistribute/folder-walker](https://github.com/okdistribute/folder-walker) use the following function:

```js
{ // Return the same shape as folder-walker
  shaper: fwData => fwData
}
````

### `files = await allFiles(paths, [opts])`

Get an Array of all files inside of a directory.  `paths` can be a single string path or an array of string paths.

`opts` Is the same as `asyncFolderWalker`.

## See also

This module is effectivly a rewrite of [okdistribute/folder-walker](https://github.com/okdistribute/folder-walker) using async generators instead of Node streams, and a few tweaks to the underlying options to make the results a bit more flexible.

- [for-await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

## License

MIT
