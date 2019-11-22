import fs from 'fs';
import path from 'path';

const { readdir, lstat } = fs.promises;

export async function * asyncFolderWalker (dirs, opts) {
  opts = Object.assign({
    fs,
    pathFilter: filename => true,
    statFilter: st => true,
    maxDepth: Infinity,
    shapeFn: ({ root, filepath, stat, relname, basename }) => filepath
  }, opts);

  const roots = [dirs].flat().filter(opts.pathFilter);
  const pending = [];

  while (roots.length) {
    const root = roots.shift();
    pending.push(root);

    while (pending.length) {
      const current = pending.shift();
      if (typeof current === 'undefined') continue;
      const st = await lstat(current);
      if ((!st.isDirectory() || depthLimiter(current, root, opts.maxDepth)) && opts.statFilter(st)) {
        yield opts.shapeFn(fwShape(root, current, st));
        continue;
      }

      const files = await readdir(current);
      files.sort();

      for (const file of files) {
        var next = path.join(current, file);
        if (opts.pathFilter(next)) pending.unshift(next);
      }
      if (current === root || !opts.statFilter(st)) continue;
      else yield opts.shapeFn(fwShape(root, current, st));
    }
  }
}

function fwShape (root, name, st) {
  return {
    root: root,
    filepath: name,
    stat: st,
    relname: root === name ? path.basename(name) : path.relative(root, name),
    basename: path.basename(name)
  };
}

function depthLimiter (filePath, relativeTo, maxDepth) {
  if (maxDepth === Infinity) return false;
  const rootDepth = relativeTo.split(path.sep).length;
  const fileDepth = filePath.split(path.sep).length;
  return fileDepth - rootDepth > maxDepth;
}

export async function all (iterator) {
  const collect = [];

  for await (const result of iterator) {
    collect.push(result);
  }

  return collect;
}

export async function allFiles (...args) {
  return all(asyncFolderWalker(...args));
}
