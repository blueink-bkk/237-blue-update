#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const jsonfile = require('jsonfile')
const yaml = require('js-yaml');

const adir = '/www/ultimheat.co.th/article'
const ya_store = '/home/dkz/tmp/ya-store'

const h = {};

for (const fn of walkSync(ya_store, ['\.md$'])) {
  const {dir, base} = path.parse(path.relative(ya_store,fn));
  console.log(`@89: <${dir}> <${base}>`)
  assert(!h[dir])
  h[dir] = {fn}; // full path

  const fn2 =  path.join(ya_store,dir,'index.md');
  if (base != 'index.md') {
    fs.renameSync(fn,fn2)
  }


  /***********************************************
    get xid from dir
  ************************************************/

  const regex = /^(\d+)\^.*/; // ya-format
  const retv = dir.match(regex)
  if (!retv) {
    console.log(`Invalid file syntax: <${dir}>`)
    throw 'fatal@31'
  }

  const xid = retv[1]
  assert (xid == dir.substring(0,4));

  const article_md = path.join(adir,xid,'index.md')
  if (fs.existsSync(article_md)) {
    fs.unlinkSync(fn); // original in ya
    fs.linkSync(fn2,article_md)
  }
}


function *walkSync(dir,patterns) {
  const files = fs.readdirSync(dir, 'utf8');
//  console.log(`scanning-dir: <${dir}>`)
  for (const file of files) {
    try {
      let pathToFile = path.join(dir, file);
      if (file.startsWith('.')) continue; // should be an option to --exclude
        const fstat = fs.statSync(pathToFile);

      if (fs.statSync(pathToFile).isSymbolicLink()) {
        let pathToFile = fs.realpathSync(pathToFile)
      }

      const isDirectory = fs.statSync(pathToFile).isDirectory();
      if (isDirectory) {
        if (file.startsWith('.')) continue;
          yield *walkSync(pathToFile, patterns);
      } else {
        if (file.startsWith('.')) continue;
        let failed = false;
        for (pat of patterns) {
          const regex = new RegExp(pat,'gi');
          if (file.match(regex)) continue;
          failed = true;
          break;
        };
        if (!failed)
        yield pathToFile;
      }
    }
    catch(err) {
      console.log(`ALERT on file:${ path.join(dir, file)} err:`,err)
//      console.log(`ALERT err:`,err)
      continue;
    }
  }
}
