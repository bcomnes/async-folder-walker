const tap = require('tap')
const { asyncFolderWalker, allFiles } = require('.')
const path = require('path')
// @ts-ignore
const tmp = require('p-temporary-directory')

const fixtures = path.join(__dirname, 'fixtures')

tap.test('for of multiple folders', async t => {
  for await (const file of asyncFolderWalker([
    path.join(fixtures, 'sub-folder'),
    path.join(fixtures, 'another-folder')
  ])) {
    t.ok(file, file)
  }
})

tap.test('Array from async iterator', async t => {
  const files = await allFiles([
    path.join(fixtures, 'sub-folder'),
    path.join(fixtures, 'another-folder')
  ])
  t.equal(files.length, 4, 'expected number of files are found')
})

tap.test('No args', async t => {
  // @ts-ignore
  for await (const file of asyncFolderWalker()) {
    t.fail('no files should be found!', file)
  }
  t.pass('for of executed')
})

tap.test('No folders', async t => {
  const [dir, cleanup] = await tmp()
  try {
    for await (const file of asyncFolderWalker(dir)) {
      t.fail('no files should be found!', file)
    }
    t.pass('for of executed')
  } finally {
    await cleanup()
  }
})

tap.test('When you just pass a file', async t => {
  const [dir, cleanup] = await tmp()
  try {
    const theFile = path.join(fixtures, 'test.json')
    const files = await allFiles([theFile, dir])
    t.equal(files.length, 1, 'only one file is found')
    t.equal(theFile, files[0], 'only one file is found')
  } finally {
    await cleanup()
  }
})

tap.test('pathFilter works', async t => {
  const filterStrig = 'sub-folder'
  const files = await allFiles(fixtures, {
    pathFilter: p => !p.includes(filterStrig)
  })

  t.notOk(files.some(f => f.includes(filterStrig)), 'No paths include the excluded string')
})

tap.test('statFilter works', async t => {
  const stats = await allFiles(fixtures, {
    statFilter: st => !st.isDirectory(), // Exclude files
    shaper: ({ stat /*, root, filepath, relname, basename */ }) => stat // Lets get the stats instead of paths
  })

  for (const st of stats) {
    t.notOk(st.isDirectory(), 'none of the files are directories')
  }
})

tap.test('dont include root directory in response', async (t) => {
  const root = fixtures
  for await (const file of asyncFolderWalker(root)) {
    if (file === root) t.fail('root directory should not be in results')
  }
  t.pass('The root was not included in results.')
})

tap.test('dont walk past the maxDepth', async t => {
  const maxDepth = 3
  const walker = asyncFolderWalker(['.git', 'node_modules'], { maxDepth })
  for await (const file of walker) {
    const correctLength = file.split(path.sep).length - process.cwd().split(path.sep).length <= maxDepth
    if (!correctLength) t.fail('walker walked past the depth it was supposed to')
  }
  t.pass('Walker was depth limited')
})

tap.test('ignore-folder should be ignored', async t => {
  for await (const file of asyncFolderWalker([fixtures], {
    ignore: ['ignore-folder', '.*']
  })) {
    t.notOk(file.includes('ignore-folder', 'does not include ignored files and folders'))
  }
})
