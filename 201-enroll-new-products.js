#!/usr/bin/env node

/*
  ENROLL:

  scan folder /www/ultimheat.co.th/ya-store/<pageno>

  for each product, create a link file :
    /www/ultimheat.co.th/en/new-products.html-<pageno>.md

  details:
    (1) scan folder /www/ya-store, and index products h[ai]
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
//const cheerio = require('cheerio');
//const md2html = require('./md2html.js')

const verbose =0;
const ya_store = '/www/ultimheat.co.th/ya-store';
const en_fpath = '/www/ultimheat.co.th/en'
const new_images = '/www/ultimheat.co.th/new-images'
const regex = /^(\d+)\^.*/; // ya-format
//en/new-products.html';

const h =[]; // ya-store (minus) /en/new-products.html~1200.md

const v = fs.readdirSync(ya_store)
console.log(`@28 ya-store dir:${v.length}`)

/*
    Each folder in ya-store start with <pageno>
    create an index h[pageno] => folder
*/

for (let fpath of v) {
  /*
  const ai = fpath.split('~');
  if (ai.length<2) {
    console.log(`Invalid file syntax: must have ~ separator`)
  }*/

  const retv = fpath.match(regex)
  if (!retv) {
    console.log(`Invalid file syntax: <${fpath}>`)
    continue;
  }

  if (!fs.lstatSync(path.join(ya_store,fpath)).isDirectory()) {
    console.log(`@44 ALERT NOT A FOLDER:`, fpath)
  //    enroll_product(fpath)
  continue;
  }

  const iSeq = retv[1]
  h[iSeq] = fpath; // h[iSeq] => folder name.
} // loop ya-store files.

/*
    HERE: h[pageno] => path-to-folder
*/


/*
    SCAN existing MD++ files.
    if MD++ file exists in {h} => REMOVE from {h}
    THIS MEANS NO UPDATE.
    just new products.
*/


const v2 = fs.readdirSync(en_fpath)

for (let fn of v2) {
  const retv = fn.match(/^new-products.html#(\d+)\.md$/)
  if (!retv) {
    // Not a product.
//    console.log(`Invalid file syntax: <${fn}>`)
    continue;
  }

  const iSeq = retv[1];
  (verbose>0) && console.log(`md-file iSeq:${iSeq} <${fn}>`)
  if (h[iSeq]) {
    (verbose>0) && console.log(`found h[${iSeq}] => removed`)
    if (true) {
      h[iSeq] = null; // ya-store cannot be loaded twice.
      // MEANS NO UPDATE...........
    }
  } else {
    (verbose>0) && console.log(`alert h[${iSeq}] not in ya-store => ignored`)
  }
}


console.log(`STATUS:`)
let np_count =0;
for (const ai of Object.keys(h)) {
  if (h[ai]) {
//    np_count++;
    console.log(`${++np_count} add <${h[ai]}>`)
  }
}

if (np_count <=0) {
  console.log('No products to add.')
}


/*
    here, h[] contains only new products, to be enrolled.
    i.e:  ya-store (-) /en/new-products
*/

for (const ai of Object.keys(h)) {
  /*
  if (!retv) {
    console.log(`Invalid ya_file syntax: <${ya_fn}>`)
    continue;
  }*/
  if (!h[ai]) continue;

  console.log(`h[${ai}] => ya-folder ${h[ai]}`)

  /*
      open ya-store folder - and link files.
      ADD links in /new-products (pdf)
      ADD link in /new-images (jpeg)
  */

  const v = fs.readdirSync(path.join(ya_store,h[ai]))
//  console.log({v})
  v.forEach(fn =>{
    if (fn.endsWith('.pdf')) {
      const dest = path.join(en_fpath,'/pdf',fn)
//      fs.symlinkSync()
//      fs.linkSync()
      //console.log(`pdf: <${path.join(ya_store,h[ai],fn)}>`)
      try {
        fs.unlinkSync(dest);
      } catch(err) {
        console.log({err})
      }

      try {
        fs.linkSync(path.join(ya_store,h[ai],fn), dest)
      } catch(err) {
        console.log({err})
      }
    } else if (fn.endsWith('.jpg')) {
      const dest = path.join(new_images,fn);
      console.log({dest})
      try {
        // remove first.
        fs.unlinkSync(dest);
      } catch(err) {
        console.log(`code:${err.code} dest:<${err.dest}>`)
      }
      try {
        // remove first.
        fs.linkSync(path.join(ya_store,h[ai],fn), dest)
      } catch(err) {
        console.log(`code:${err.code} dest:<${err.dest}>`)
      }
    } else if (fn.endsWith('.md')) {
      const dest = path.join(en_fpath, `new-products.html#${ai}.md`);
      console.log({dest})
      try {
        fs.unlinkSync(dest);
      } catch(err) {
        console.log(err.Error)
      }
      try {
        fs.linkSync(path.join(ya_store,h[ai],fn), dest)
      } catch(err) {
        console.log(err.Error)
      }
    } else {
      console.log(`ignoring:`,{fn})
    }
  })
}
