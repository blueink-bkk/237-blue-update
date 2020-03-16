#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const jsonfile = require('jsonfile')
const yaml = require('js-yaml');

const env = {};

const env_yaml = (fs.existsSync('./.env.yaml')) ?
  yaml.safeLoad(fs.readFileSync('./.env.yaml', 'utf8')) : {};
console.log({env_yaml})

Object.assign(env, env_yaml);

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('i','input')
  .alias('s','soft-links')
  .alias('o','output') // not rewriting on original
  .alias('n','dry-run')
//  .boolean('pg-monitor')
//  .boolean('commit')
  .alias('f','force') // create output folder
  .options({
    'dry-run': {type:'boolean', default:false},
    'force': {type:'boolean', default:false},
  }).argv;

Object.assign(env, argv);

const {verbose, articles, ya_store, 'dry-run':dry_run} = env;

// =======================================================================

const h = {};

for (const fn of walkSync(ya_store, ['\.md$'])) {
  const {dir, base} = path.parse(path.relative(ya_store,fn));
//  console.log(`@89: <${dir}> <${base}>`)
  assert(!h[dir])
  h[dir] = {fn}; // full path

  const fn2 =  path.join(ya_store,dir,'index.md');
  if (base != 'index.md') {
    fs.renameSync(fn,fn2)
  }

  const xid4 = dir.substring(0,4);

  /***********************************************
    fn : full path to original md-file
    fn2 : is normalized name for md-file : <xid/sku>/index.md
    article_md : alternate source for md-file in (/article/<xid4>)

    for legacy-serie 11xx :

  ************************************************/


  if (fn2 != fn) {
    // NOT NORMALIZED - NEED FIX.
    const article_md = path.join(articles,xid4,'index.md')
    ;(verbose >0) && console.log(`@37: NEED FIX <${fn}>`)
    if (fs.existsSync(article_md)) {
      if (!dry_run) {
        console.log(`move <${article_md}> <${fn2}>`)
    //	  continue;
        fs.unlinkSync(fn2); // original in ya
        fs.linkSync(article_md,fn2)
      }
    } else {
      console.log(`article <${article_md}> not found`)
    }
  } // need normalize.
} // each fn.

;(dry_run) &&console.log(`DRY-RUN`)
console.log(`@79: -eoj-
  ya-store:${ya_store}
  articles:${articles}
`)


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
