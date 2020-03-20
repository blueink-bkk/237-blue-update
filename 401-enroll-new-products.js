#!/usr/bin/env node


const fs = require("fs");
const path = require('path')
const assert = require('assert');
const cheerio = require('cheerio');
const md2html = require('./md2html-simple.js')
const yaml = require('js-yaml')

/*
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
console.log(s3)
return;
*/

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
  .alias('x','xid')
//  .boolean('pg-monitor')
//  .boolean('commit')
  .alias('f','force') // create output folder
  .options({
    'dry-run': {type:'boolean', default:false},
    'force': {type:'boolean', default:false},
  }).argv;

Object.assign(env, argv);

const {verbose, 'dry-run':dry_run, xid} = env;

;(verbose >0) && console.log({env})


const s3client = require('./lib/min-io.js').connect();

if (!xid) {
  console.log(`@52 Uploading all articles.`)
  if (!all) {
    console.log(`@52 Uploading all articles use -a (--all) flag.`)
    return;
  }
}


(async function main() {
  console.log(`Going async`);
  const {data, list, error:error1} = await s3client.list_Objects({bucket:'ya-tests', prefix:''});
  for (it of list) {
    //    console.log(`-- `,it.prefix)
    // because non-recursive => prefix
    if (it.prefix.startsWith(xid)) {
      console.log(`FOUND:`,it.prefix)
      const {meta, errCount} = await validate_meta(it.prefix);
      if (errCount >0) {
        console.log(`@61 validation-failed ${it.prefix}`)
        continue;
      }
      /***************
      READY TO MOVE files.
      ****************/
      const {base:key_pdf} = path.parse(meta.pdf)
      const {base:key_jpeg} = path.parse(meta.img)
      let xid_ = it.prefix;
      if (xid_.endsWith('/')) xid_ = xid_.slice(0,-1)

      console.log(`@112 Moving files: (s3://ya-tests) => (s3://jpci-assets)
        ${meta.md} => ${xid_}.md
        ${meta.img} => ${key_jpeg}
        ${meta.pdf} => ${key_pdf}
        `)

        await s3client.fGet_Object({bucket:'ya-tests', key:meta.img, fpath:'/tmp/s3-tmp.jpg'})
  //      .then(x=>{console.log('@79',x)});
        await s3client.fPut_Object({bucket:'jpci-assets', key:key_jpeg, fpath:'/tmp/s3-tmp.jpg'})
  //      .then(x=>{console.log('@81',x)});

        await s3client.fGet_Object({bucket:'ya-tests', key:meta.pdf, fpath:'/tmp/s3-tmp.pdf'});
        await s3client.fPut_Object({bucket:'jpci-assets', key:key_pdf, fpath:'/tmp/s3-tmp.pdf'});

        await s3client.fGet_Object({bucket:'ya-tests', key:meta.md, fpath:'/tmp/s3-tmp.md'});
        await s3client.fPut_Object({bucket:'jpci-assets', key:xid_+'.md', fpath:'/tmp/s3-tmp.md'});

        console.log(`run command s3cmd ls s3://jpci-assets/${xid_}`)
    }
  }
})();


async function validate_meta(xid_) {
  // key is a directory (prefix) => lets list Objects
//  if (xid_.endsWith('/')) xid_ = xid_.slice(0,-1)
  console.log(`validate_Object(${xid_})`)
  const {list, error:error1} = await s3client.list_Objects({bucket:'ya-tests', prefix:xid_, recursive:true});
  const p = {};
  list.forEach(it =>{
    console.log(`-- `,it.name)
    if (it.name.endsWith('.jpg')) {assert(!p.img); p.img = it.name;}
    else if (it.name.endsWith('.pdf')) {assert(!p.pdf); p.pdf = it.name;}
    else if (it.name.endsWith('.md')) {assert(!p.md); p.md = it.name;}
    else {
      console.log(`Ignoring <${it.name}>`)
    }
  })
  console.log({p})
  /*************************
  read md-file and check
  **************************/
  const {data:md_data, error:error2} = await s3client.get_Object({bucket:'ya-tests', key: p.md});
  console.log(`@100: data ready. data.length:${md_data.length}`);
  console.log(`@76 `,md_data.toString());
  const v = md_data.split(/\-\-\-/g);
  assert(!v[0])
  assert(v.length == 3)
  let meta = yaml.safeLoad(v[1], 'utf8');
  let md_code = v[2];
  console.log({meta})
  let errCount =0;
  if (xid_+meta.img != p.img) {
    console.log(`ALERT invalid image (${meta.img}) (${p.img})`); errCount++;
  }
  if (xid_+meta.pdf != p.pdf) {
    console.log(`ALERT invalid pdfs3cmd`); errCount++;
  }

  /********************************************
    We are ready to Upload.
    1575^Cat22----9SWN------/Cat22---9SWN----.md => 1575^Cat22----9SWN------.md
    1575^Cat22----9SWN------/Cat22---9SWN----.pdf => Cat22----9SWN------.pdf
    1575^Cat22----9SWN------/Cat22---9SWN----.jpg => Cat22----9SWN------.jpg
  *********************************************/


  return {meta:p, errCount};
}



//main();
