#! /usr/bin/env node

/*

    THE ORIGINAL WAS IN
    /home/dkz/dev-utpp/museum-1808-massive-upload/upload-batch-85.js

    ATTENTION THIS IS ONLY FOR JPCI (co.th) BUT USING database museum-v3

    Similar to RSYNC:
    (1) get an index from database page_list() => {pageno,checksum-date}
    (2) scan local folder ./en/new-product/<pageno>/index.md2
        for each article, with checksum/date changed
          db.write (page)


    Usage:

    ./303-push [--commit]

*/


const fs = require('fs');
const path = require('path');
const assert = require('assert');
const jsonfile = require('jsonfile')
const yaml = require('js-yaml');
const Massive = require('massive');
const monitor = require('pg-monitor');
var pdfjsLib = require('pdfjs-dist');
//const klaw = require('klaw');

const env = {
  user: process.env.PGUSER,
  port: process.env.PGPORT,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
};
console.log({env})

const env_yaml = (fs.existsSync('./.env.yaml')) ?
  yaml.safeLoad(fs.readFileSync('./.env.yaml', 'utf8')) : {};
console.log({env_yaml})

Object.assign(env, env_yaml);

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('p','password')
  .alias('f','file')
  .alias('d','dir')
  .alias('a','all')
  .alias('c','commit')
  .alias('P','purge')
  .options({
    'commit': {type:'boolean', default:false},
    'purge': {type:'boolean', default:false},
  }).argv;
console.log('commit:',{argv})

Object.assign(env, argv);

assert(env.user)
assert(env.port)
assert(env.host)
assert(env.database)
assert(env.ya_store) // store

const {ya_store, verbose, purge, commit} = env;
const {host,port,user,database,password} = env;

if (!password) {
  console.log(`password for database ${database} is required.
    ex: export PGPASSWORD='secret-pass-for-${database}'
    -stop`)
  process.exit(-1)
}


// ==========================================================================

/*
    FIRST GET LOCAL DIRECTORY
*/

const local_dir = {};

;(verbose >0) && console.log(`@88 ya_store: <${ya_store}>`)
for (const fn of walkSync(ya_store, ['\.md$'])) {
  const {dir:sku, base} = path.parse(path.relative(ya_store,fn));
  console.log(`@89: <${sku}> <${base}>`)
  assert(!local_dir[sku])
  local_dir[sku] = {fn}; // full path
}

;(verbose >0) && console.log(`@88 found ${Object.keys(local_dir).length} in ya_store: <${ya_store}>`)


// ==========================================================================

/*
  THEN: get directory from server
*/

let db;

function close_db(s) {
  (verbose >=0) && console.log(s,'closing connections pool.');
  db.instance.$pool.end();
  (verbose >=0) && console.log('db.instance closed.');
}

async function get_new_products_dir() {
  assert(db);
//  const retv = await db.adoc.list_pages('museum.pdf','1908 Allez freres Section 1 20151026.pdf');

  db.adoc.list_files('jpci.products.en')
  .then(retv =>{
    console.log(`@91: list_pages =>`,retv);
      return retv || [];
  });
}





async function main() {
  console.log(`@110 Massive startup w/passwd: <${password}>`);
  db = await Massive({
      host,
      port,
      database,
      user,
      password
  });
  console.log('Massive is ready.');

  if (purge) {
    db.adoc.remove_path('jpci.products.en')
  }


  const remote_dir = {};
  const _v_remote_dir = await db.adoc.list_files('jpci.products.en');
  _v_remote_dir.forEach(it =>{
    remote_dir[it.xid] = it;
  })
  const remote_Count = Object.keys(remote_dir).length;
  console.log(`@106: found ${Object.keys(remote_dir).length} products on server.`)

//  console.log(remote_dir); throw 'break@119'


  function remove_fn_tail(fn) {
//    const i =/\^/.exec(fn.split('^')[0])
//    return fn.replace(/^.*\([0-9]+^\).*$/,'($1)')
    return fn.replace(/^.*\/([0-9]+)\^.*$/,'$1')
  }

  function get_local(fn) {
    const v = fs.readFileSync(fn,'utf8').split('\-\-\-');
    const meta = yaml.safeLoad(v[1]);
    const md_code = v[2];

    return {meta, md_code, mtime:fs.statSync(fn).mtime}
  }



  //const root_prefix_length = ya_store.length;


  /***********************************************

  upload from local-dir
  only if NOT on remote
  or local newer than remote.

  ************************************************/


  let w_Count =0;

  for (const [xid, data] of Object.entries(local_dir)) {
    ;(verbose >0) &&console.log(`@178 xid:${xid} ${(remote_dir[xid])?'':"NOT "}found in remote.`)
//    const {meta, md_code, mtime} = get_local(data.fn);
//    console.log(`@180: mtime:${mtime} <${data.fn}>`)
    ;(!remote_dir[xid]) && console.log(`@181 ALERT xid:${xid} NOT found in remote.`)

    const {meta, md_code, mtime} = get_local(data.fn);

    if (remote_dir[xid]) continue; //////////////////// temp

    if (remote_dir[xid] && remote_dir[xid].mtime) {
      //console.log(`@159: timeStamp ai:${ai} local:${mtime} remote:${remote_dir[ai].mtime}`)
      if (mtime <= remote_dir[xid].mtime) continue;
    }

    const jsonb = {xid};

    Object.assign(jsonb, meta, {
      timeStamp: new Date(),
      '.lang-en': md_code
    })

    const raw_text = `${jsonb.article_id} - ${jsonb.sku} ` + jsonb['.lang-en'];
    const pageNo = 0;

    if (commit) {
      console.log(`writing xid:${xid}...`)
      const retv = await db.adoc.write_pagex('jpci.products.en', xid, pageNo, jsonb, raw_text);
      w_Count ++;
    }

  }


  console.log(`@127: found ${Object.keys(local_dir).length} MD-files in <${ya_store}>`)
  close_db(`@107:`);
  return {w_Count, remote_Count}
} // main





try {
  main()
  .then(({w_Count, remote_Count})=>{
    if (w_Count <=0) console.log(`Server is up to date.`);
    else console.log(`${w_Count} article were updated.`)
    console.log(`>> warning (potential bug with timestamp) !`)
    console.log('-eoj-');
  })
  .catch(err=>{
    console.log(`@95: err:`,err)
    close_db();
  });
}
catch (err) {
  console.log(`@90 `,err)
}
return;

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
