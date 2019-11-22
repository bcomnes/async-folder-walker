import tape from 'tape';
import ptape from 'tape-promise';
import { asyncFolderWalker, allFiles } from './main';
import path from 'path';
import tmp from 'p-temporary-directory';
const test = ptape(tape);

const fixtures = path.join(__dirname, 'fixtures');

test('for of multiple folders', async t => {
  for await (const file of asyncFolderWalker([
    path.join(fixtures, 'sub-folder'),
    path.join(fixtures, 'another-folder')
  ])) {
    t.ok(file, file);
  }
});

test('Array from async iterator', async t => {
  const files = await allFiles([
    path.join(fixtures, 'sub-folder'),
    path.join(fixtures, 'another-folder')
  ]);
  t.equal(files.length, 4, 'expected number of files are found');
});

test('No args', async t => {
  for await (const file of asyncFolderWalker()) {
    t.fail(file, 'no files should be found!');
  }
  t.pass('for of executed');
});

test('No folders', async t => {
  const [dir, cleanup] = await tmp();
  try {
    for await (const file of asyncFolderWalker(dir)) {
      t.fail(file, 'no files should be found!');
    }
    t.pass('for of executed');
  } finally {
    await cleanup();
  }
});

test('When you just pass a file', async t => {
  const [dir, cleanup] = await tmp();
  try {
    const theFile = path.join(fixtures, 'test.json');
    const files = await allFiles([theFile, dir]);
    t.equal(files.length, 1, 'only one file is found');
    t.equal(theFile, files[0], 'only one file is found');
  } finally {
    await cleanup();
  }
});

test('pathFilter works', async t => {
  t.fail();
});

test('statFilter works', async t => {
  t.fail();
});

test('dont include root directory in response', function (t) {

});

test('dont walk past the maxDepth', function (t) {

});
