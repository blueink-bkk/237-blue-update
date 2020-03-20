#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path')
//const walk = require('klaw-sync')
//const walk = require('klaw')
//const FindFiles = require('file-regex');

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
  .alias('l','limit')
  .alias('z','zero')
//  .boolean('pg-monitor')
//  .boolean('commit')
  .alias('f','force') // create output folder
  .options({
    'dry-run': {type:'boolean', default:false},
    'force': {type:'boolean', default:false},
    'limit': {type:'integer', default:999999},
  }).argv;

Object.assign(env, argv);

const {verbose, 'dry-run':dry_run, xid, limit} = env;

let {zero=+0} = env; //zero = 100000 + zero;
zero += 100000;

;(verbose >0) && console.log({env})

const s3client = require('./lib/min-io.js').connect();

const root_folder = '/media/dkz/recup';

const h ={};

/*
fs.readdir(`/media/dkz/recup/`, (err,dir)=>{
  console.log(`--`,dir)
//  const iSeq = it.path.split('.')[1];
//  h[iSeq] = it.path;
//  console.log(`h[${iSeq}]=>${it.path}`)
})
*/

const dir = fs.readdirSync('/media/dkz/recup/');

dir.forEach(it=>{
//  console.log(`--`,it)
  const x = +it.split('.')[1];
  if (!isNaN(x)) {
    const iSeq = (100000 + x);
    h[iSeq] = it;
//    console.log(`h[${iSeq}]=>${it}`)
  }
})

const dir2 = Object.keys(h);
dir2.sort((a,b)=>{return (+a)-(+b)});


let uCount =0;
let fCount =0;


(async function main(){
  for (iSeq of dir2) {
  //  console.log(`--`,it)
    ;(verbose >1) &&console.log(`-- h[${iSeq}]=>${h[iSeq]} zero:${zero}`)
    if (iSeq < zero) continue;
    fCount ++; // folder count
    if (fCount > limit) break;
    uCount += await upload(root_folder+`/recup_dir.${iSeq-100000}`)
  }
  console.log(`${dir.length} folders uCount:${uCount}`)
})();


async function upload(fpath) {
  let uCount =0;
  ;(verbose >1) &&console.log(`-- uploading folder ${fpath}`)
  const dir = fs.readdirSync(fpath);

  for (it of dir) {
    if (it.endsWith('.jpg')) {
      uCount++;
      console.log(`>> (${uCount}) uploading file ${path.join(fpath,it)}`);
      const retv = await s3client.upload_file({
        bucket:'dkz',
        key: it,
        fpath: path.join(fpath,it),
        meta: {
          'Content-Type': 'image/jpeg',
          'X-Amz-Meta-Testing': 1234,
        }
      });
      //, function(err, etag) {
      //  return console.log(err, etag) // err should be null
      //})
      console.log(`@122 `,{retv})
    }
  } // for
  return uCount;
} // function


/******************
walk(root_folder,{
  depthLimit:6
})
.on('data',(it)=>{
  //console.log(`-- ${it.path}`)
  const iSeq = it.path.split('.')[1];
  h[iSeq] = it.path;
  console.log(`h[${iSeq}]=>${it.path}`)
})
.on('end', ()=>{
  console.log(`end`)
})
/**
FindFiles(root_folder, /\.txt$/, 5)
.then(x=>{
  console.log(x)
});
*****************/
