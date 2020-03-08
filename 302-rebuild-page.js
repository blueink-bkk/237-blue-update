#!/usr/bin/env node

/*
    rebuild HTML code from ./en/new-product/<pageno>/index.md2
    then re-insert into ./en/new-products.html

    Each product has a minimal tvec.page in the database.
    Just for deep-search to operate.

WORK IN PROGRESS ...................................

    (1) scan folder ya-store, and index products h[ai]
    (2) scan files /en/new-products.html~(ai).md, and remove them from h[ai]
    (3) for each product still in h[ai] : ex: 1200
        3.1 : create link /en/pdf => .pdf
        3.2 : create link /new-images => .jpg
        3.3 : create link /en/new-products.html~1200.md
        3.4 : automatically create/update article_id
*/

const fs = require("fs");
const path = require('path')
const assert = require('assert');
const cheerio = require('cheerio');
const md2html = require('./md2html-simple.js')

const env = {};

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

const {verbose, input:www_root, assets, force, 'dry-run':dry_run} = env;
let {output} =  env;
const fpath = argv._[0];

if (!fpath) {
  console.log(`Missing index.html filename`)
  return;
}

if (!fs.existsSync(fpath)) {
  console.log(`file-not-found <${fpath}>`)
  return;
}

if (!fpath.endsWith('.html')) {
  console.log(`>>>>>> ALERT: not an html file
    <${fpath}>
    -exit-
    `);
  return;
}

if (!fs.existsSync(fpath)) {
  console.log(`file-not-found : <${fpath}>
    -exit-
    `);
  return;
}

/********************************
Attention:

./en/new-products/index.html  => dir: ./en/new-products/  (1)
./en/new-products.html        => dir: ./en/               (2)

(1) => 'editora'
(2) => 'abatros'

*********************************/


/*******************************************************************

    Load html - to explore metadata - then empty section.

********************************************************************/

const html = fs.readFileSync(fpath, 'utf8');
console.log('page.length:', html.length)
const $ = cheerio.load(html)

/****************************

  Get metadata - to determine version

*****************************/

let {dir:md_dir, base} = path.parse(fpath);
console.log(`@103: dir:${md_dir}`)


/*
Object.assign(env, {
  'e3:revision': (fpath.endsWith('index.html'))?'editora':'abatros'
})*/

console.log(`@110: env:`,env) // got both 'e3-version' and e3Version


const meta = get_meta($)
meta['e3-version'] = meta['e3-version'] || (fpath.endsWith('index.html'))?'editora':'abatros'

// override with env[e3-version]
Object.assign(meta, env);

console.log(`@119: env:`,env)

const {
  'e3-revision': e3_revision,
  'e3-version': e3_version, // gives scheme : where to look for MD files.
} = meta;

console.log(`@137: e3_version:"${e3_version}"`); // signal a virgin html => insert scripts ++

/*************************************

    ADJUST MD-Directory according to metadata.

**************************************/


switch (e3_version) {
  case 'abatros': // original
    // md-files are at the same level as html-file
    // syntax is new-products.html#<xid>.md
    // or index.html#<xid>.md
    // => dir (unchanged)
  break;

  case 'editora':
    // md-files are in sub-folder ACCORDING to (index.html)......
    // ./en/new-products.html => (dir: ./en/) new-products/<xid>/index.md
    // ./en/new-products/index.html => (dir: ./en/new-products/) new-products/<xid>/index.md
    const {dir,base,name} = path.parse(fpath)
    if (!fpath.endsWith('index.html')) {
      md_dir = path.join(dir,name)
    } else {
      md_dir = dir
    }

    // in all cases, output should be new-products/index.html

  break;


  default:
    console.log(`@144: Unknown e3_version <${e3_version}>
      FATAL`);
    return;
}






/*******************************

  Analyse directory

********************************/

const walk = require('klaw-sync')

let aCount =0;

const h ={};

walk(md_dir).forEach(file =>{
  if (file.path.endsWith('index.md')) {
    ;(verbose >0) && console.log(`@76: <${file.path}>`)
    const [p,xid] = /\/([0-9]+)\/index.md$/.exec(file.path);
    ;(verbose >0) && console.log(`@187: xid:${xid}`)
    if (h[xid]) {
      console.log(`@93: ALERT duplicate entries for #${xid}
        <${h[xid]}>
        <${file.path}>
        IGNORED
        `)

    } else {
      h[xid] = file.path;
    }
    return;
  }

  /*************
    second try...
  **************/

  if (file.path.endsWith('.md')) {
    ;(verbose >0) && console.log(`@76: file.path:<${file.path}>`)
    const [p,xid] = /\/([0-9]+)\^/.exec(file.path);
    ;(verbose >0) && console.log(`@208: xid:${xid}`)
    if (h[xid]) {
      console.log(`@93: ALERT duplicate entries for #${xid}
        <${h[xid]}>
        <${file.path}>
        IGNORED
        `)

    } else {
      h[xid] = file.path;
    }
  }
});

console.log(`@105: found ${Object.keys(h).length} articles.`)

/********************

    build an array reverse sorted.

*********************/

const revlist = Object.keys(h).reverse();




const div_row = $('body').find('section#new-products div.row');

// console.log(`@142: `,div_row)
div_row.empty()

revlist.forEach(xid =>{
//  const {data, html} = read_md_file(path.join(md_dir, xid, 'index.md'));
//  ;(verbose >0) && console.log(`@242: reading... <${h[xid]}>`)
  console.log(`@242: reading... <${h[xid]}>`)
  const {data, html} = read_md_file(h[xid]);
  ;(verbose >0) && console.log(`@243: reading <${h[xid]}>`)
  if (data.format == 'raw-html') {
//    console.log({html})
    div_row.append(`<div class="col-lg-4 col-md-6">
    <article id="${xid}" class="card new-card js-e3article">
    ${html}
    </article>
    </div>
      `)
    return;
  }

  // should be applied only for certain versions.
  let xdir = xid;
  if (h[xid].indexOf('^') >=0) {
    const {dir} = path.parse(h[xid].split('^')[1]); // horrible trick.
    xdir += '^' + dir
  }

  div_row.append(`<div class="col-lg-4 col-md-6">
  <article id="${xid}" class="card new-card js-e3article">
  <img src="./${xdir}/${data.img}" class="card-imgs mb-2">
  <small class="text-grey mb-2"><b>${data.sku}</b> </small>
  ${html}
  <div class="btns">
  <a href="./${xdir}/${data.pdf}" target="_blank" class="btn-red">Download PDF</a>
  <span class="number-btn">${xid}</span>
  </div>
  </article>
  </div>
    `)
})


if (!output) {
  switch (e3_version) {
    case 'editora':
      output = path.join(md_dir,'index.html')
    break
    default:
      throw '@256: fatal'
  }
}

if (!output) {
  if (!dry_run) {
    fs.writeFileSync(fpath, $.html(), 'utf8');
    console.log(`@248: original file <${fpath}> is updated.`)
  } else {
    console.log(`@250: DRY-RUN - results not written on file system.`)
  }
} else {
  fs.writeFileSync(output, $.html(), 'utf8');
  console.log(`@254: html-file written on <${output}>`)
}

throw "stop"

/*

    here we have list of products in MD files.
    maybe some legacy products not there... <1200

    NEXT: cheerio on section#new-products articles

*/



if (!fs.existsSync(fpath)) {
  console.log(`html not found: <${fn}>`)
  return;
}


//  const html = v.html();
//    console.log(`data():`,v.data())
//    console.log(`data('sku'):`,v.data('sku'))
//  console.log(`inner-html:`,html)
//  return html
console.log({v})
const listp = v.children();
//  console.log({list})

listp.each((i,e)=>{
//  console.log('--------------')
  const article = $(e).find('article');
  let ai = $(article).attr('id');
  const sku = $(article).data().sku;
  const span = $(e).find('span.number-btn');
  if (!ai) {
    // this for first processing on files coming from eglogics
    // those files not have id only number-btn
    ai = span.text();
  } else {
    console.log(`article id:${$(article).attr('id')} sku:${sku}`)
    span.text(ai) // realign.
  }

  /*
      fix the ai
  */
  if (!h[ai]) {
    // CREATE A RAW HTML MD
    console.log(`Missing product ${ai}.MD`)
    // extract and create MD
    console.log(article.html())
    fs.writeFileSync(path.join(en_fpath,`new-products.html#${ai}.md`),`---
article_id: ${ai}
sku: ${sku}
format: raw-html
---
` + article.html().replace(/^\s*/gm,' '),'utf8');
  h[ai] = path.join(en_fpath,`new-products.html#${ai}.md`);
} else {
  // do nothing.
}
})

fs.writeFileSync(path.join(en_fpath,'new-products.html'),$.html(),'utf8');

/*
    Here we will remove all products and reload from MD => new-products3.html
*/

v.empty()


/*
    revuild everything.
*/



function read_md_file(fp) {
  const md = fs.readFileSync(fp,'utf8');
return md2html(md);
/*
  const {data, html} = md2html(md); // if raw-html yaml not used.
  console.log ({data});
  console.log({html})
*/
}


function get_meta($) {
  // return document.getElementsByTagName('meta').e3root.content;
////  const selector = `meta[name="${key}"]`
//  const meta = $('meta').attr('content');
  const meta ={};
  $('meta').each((j,it) =>{
    const name = $(it).attr('name');
    if (name) {
      meta[name] = $(it).attr('content')
      console.log(`-- meta[${name}]:"${meta[name]}"`)
    }
  })
  return meta;
}
