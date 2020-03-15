#!/usr/bin/env node




const fs = require('fs-extra');
const path = require('path')
const walk = require('klaw-sync')
//const input_folder = '/www/ultimheat.co.th';

const argv = require('yargs')
  .alias('h','help')
  .alias('v','verbose').count('verbose')
//  .alias('i','input-dir')
  .alias('n','dry-run').count('dry-run')
  .options({
    'dry-run':  {type:'integer', default:0},
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
const s3_new_images = 'https://blueink.us-east-1.linodeobjects.com/products/'
const s3_en_pdf = 'https://blueink.us-east-1.linodeobjects.com/products/'
const s3_img = 'https://blueink.us-east-1.linodeobjects.com/assets/'
const s3_js = 'https://blueink.us-east-1.linodeobjects.com/js/'
const s3_css = 'https://blueink.us-east-1.linodeobjects.com/css/'

if (dry_run) {console.log('DRY-RUN');}

function convert_include(fn) {
//<img src="<?= base_url; ?>img/main-logo.png"
  return fs.readFileSync(fn,'utf8')
  .replace(/<\?= base_url; \?>img\//g, s3_img)
//    <script src="<?= base_url; ?>js/main.js"></script>
  .replace(/<\?= base_url; \?>js\//g, s3_js)
// <link rel="stylesheet" href="/css/
  .replace(/href="\/css\//g, 'href="' + s3_css)
  // <?= base_url; ?>css/
  .replace(/<\?= base_url; \?>css\//g, s3_css)
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
  .replace(/<\?php.*\?>/s,'')

}


function rebuild(lang) {
  // get code to include.

  /**********************

    FIRST: convert head, header, footer, sidedar
    and hold in cache.

  ***********************/
  /********
  const head = fs.readFileSync(path.join(input_folder,lang,'head.php'),'utf8')
  .replace(/<\?= base_url; \?>/g,base_url) // must be first
  .replace(/<\?php.*\?>/s,'')
  */

  const head = convert_include(path.join(input_folder,lang,'head.php'))
  const header = convert_include(path.join(input_folder,lang,'header.php'))
  const footer = convert_include(path.join(input_folder,lang,'footer.php'))
  const sidebar = convert_include(path.join(input_folder,lang,'sidebar.php'))


  /*
  + `
<meta name="e3:revision" content="1.0">
<script src="/dkz-double-click.js"></script>
<link rel="stylesheet" href="/dkz.css">
`;*/

  /***************************
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
  *******************/

  // each php file from either en or th folders.

  let nfiles =0;
  walk(path.join(input_folder,lang)).forEach(file =>{
    if (file.path.endsWith('.php')) {
      ;(verbose >1) && console.log(`processing file: <${file.path}>`)
      const html = fs.readFileSync(file.path,'utf8')
//      .replace(/^[^]*<!DOCTYPE/mi,'<!DOCTYPE')
//      <img src="<?= base_url; ?>new-images/1-61-4C.jpg" height="250" width="350" class="img-responsive">


      .replace(/<\?= base_url; \?>img\//g, s3_img)
//      .replace(/url\(\.\.\/img\/\//g, 'url('+s3_img)
//    <script src="<?= base_url; ?>js/main.js"></script>
.replace(/<\?= base_url; \?>js\//g, s3_js)
// <link rel="stylesheet" href="/css/
//.replace(/href="\/css\//g, 'href="' + s3_css)
// <?= base_url; ?>css/
//.replace(/<\?= base_url; \?>css\//g, s3_css)
      .replace(/<\?= base_url; \?>new-images\//g,s3_new_images) // must be first
      .replace(/<a href="http:\/\/www.ultimheat.com\//g,s3_en_pdf)
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
