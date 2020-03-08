#!/usr/bin/env node

// twillio : 1 201 367 1972


const fs = require('fs-extra');
const path = require('path')
const walk = require('klaw-sync')
//const input_folder = '/www/ultimheat.co.th';

const argv = require('yargs')
  .alias('h','help')
  .alias('v','verbose').count('verbose')
//  .alias('i','input-dir')
  .alias('n','dry-run')
  .options({
    'dry-run':  {type:'boolean', default:false},
    'force': {type:'boolean', default:false},
  }).argv;

const input_folder = argv._[0];

const {verbose,
//  'input-dir':input_folder,
  'dry-run':dry_run,
  help
} = argv;

if (help) {
  console.log(`
    HELP:
    -h (--help)     : this help.
    -v (--verbose)
    -n (--dry-run)  : do not write
    `);
  return;
}


if (!input_folder) {
  console.log(`Missing --input-dir (-i)`)
  return;
}

if (!fs.existsSync(input_folder)) {
  console.log(`Directory not found <${input_folder}>`)
  return;
}

const base_url = '/'
//const base_url = '../'

if (dry_run) {console.log('DRY-RUN');}

function rebuild(lang) {
  // get code to include.

  /**********************

    FIRST: convert head, header, footer, sidedar
    and hold in cache.

  ***********************/

  const head = fs.readFileSync(path.join(input_folder,lang,'head.php'),'utf8')
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
  .replace(/<\?php.*\?>/s,'')

  /*
  + `
<meta name="e3:revision" content="1.0">
<script src="/dkz-double-click.js"></script>
<link rel="stylesheet" href="/dkz.css">
`;*/

  ;(verbose >1) && console.log({head})

  const header = fs.readFileSync(path.join(input_folder,lang,'header.php'),'utf8')
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
//  .replace(/<\?php.*\?>/s,'')
  ;(verbose >1) && console.log({header})

  const footer = fs.readFileSync(path.join(input_folder,lang,'footer.php'),'utf8')
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
//  .replace(/<\?php.*\?>/s,'')
  ;(verbose >1) && console.log(footer)

  const sidebar = fs.readFileSync(path.join(input_folder,lang,'sidebar.php'),'utf8')
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
//  .replace(/<\?php.*\?>/s,'')
  ;(verbose >1) && console.log(sidebar)


  // each php file from either en or th folders.

  let nfiles =0;
  walk(path.join(input_folder,lang)).forEach(file =>{
    if (file.path.endsWith('.php')) {
      ;(verbose >1) && console.log(`processing file: <${file.path}>`)
      const html = fs.readFileSync(file.path,'utf8')
//      .replace(/^[^]*<!DOCTYPE/mi,'<!DOCTYPE')
      .replace(/<\?= base_url; \?>/g,base_url) // must be first
      .replace(/<\?php include\('head.php'\); \?>/g, head)
      .replace(/<\?php include\('header.php'\); \?>/g, header)
      .replace(/<\?php include\('footer.php'\); \?>/g, footer)
      .replace(/<\?php include\('sidebar.php'\); \?>/g, sidebar)

      //console.log(html)
      nfiles ++;

      if (dry_run) {
        console.log(`-- DRY-RUN <${file.path}>`)
      } else {
        fs.outputFileSync(file.path.replace(/\.php$/,'.html'), html);
      }
    }
  })
  console.log(`total ${nfiles} for lang:"${lang}"`)
  return nfiles;
} // rebuild.



rebuild('en');
rebuild('th');

rebuild_index();

function rebuild_index() {
  const fname = path.join(input_folder,'index.php');
  const html = fs.readFileSync(fname,'utf8')
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
//  .replace(/<\?php include\('head.php'\); \?>/g, head)
//  .replace(/<\?php include\('header.php'\); \?>/g, header)
//  .replace(/<\?php include\('footer.php'\); \?>/g, footer)
//  .replace(/<\?php include\('sidebar.php'\); \?>/g, sidebar)
  .replace(/<\?php define[^>]*$>/g,'');
  //console.log(html)

  if (dry_run) {
    console.log(`-- DRY-RUN <${fname}>`)
  } else {
    fs.outputFileSync(fname.replace(/\.php$/,'.html'), html);
  }
//  fs.outputFileSync(path.join(input_folder,'index.html'),html,'utf8');
}
