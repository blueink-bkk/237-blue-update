#!/usr/bin/env node

/*

      fix legacy products.


*/



const fs = require("fs");
const path = require('path')
const assert = require('assert');
const cheerio = require('cheerio');

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('c','js-class')
  .alias('i','input')
  .alias('n','dry-run')
  .options({
    'dry-run':  {type:'boolean', default:false},
    'force': {type:'boolean', default:false},
  }).argv;

const {verbose, 'input':fpath, 'dry-run':dry_run, 'js-class':js_class = 'js-e3article'} = argv;

if (!fpath) {
  console.log(`Missing --input (-i)`)
  return;
}

if (!fs.existsSync(fpath)) {
  console.log(`html file-not-found <${fpath}>`)
  return;
}

if (dry_run) {
  console.log(`DRY-RUN`)
//  console.log(`-stop`); return;
}


const html = fs.readFileSync(fpath,'utf8');
console.log('page.length:', html.length)
const $ = cheerio.load(html)

const revision_id = get_meta($,'e3:revision');
if (!revision_id) {
  console.log(`e3:revision:`,revision_id)
  upgrade_new_products($);
  if (!dry_run) {
    fs.writeFileSync(fpath, $.html(), 'utf8')
  }
  return;
}

console.log(`@59: this file has been already fixed.
  -stop-`)
  return;

/*****************
  HERE revision-id
*****************/

let v =null;
const selector = `section#new-products div.row`
try {
  v = $('body').find(selector);
  console.log(`found ${v.length}`)
  // Get inner-html
//  const html = v.html();
//    console.log(`data():`,v.data())
//    console.log(`data('sku'):`,v.data('sku'))
//  console.log(`inner-html:`,html)
//  return html
  console.log({v})
  const list = v.children();
//  console.log({list})

  const l2 = v.find('article');
  console.log('articles:',l2.length)

  const h = {}
  l2.each((i,e)=>{
    console.log(`i:${i} data:${$(e).data().sku}`)
    const sku = $(e).data().sku;
    assert(sku)
    h[sku] && console.log(`alert duplicate entry ${sku}`)
    h[sku] = e;
  })
}
catch(err) {
  console.log({selector})
  console.log({err})
}


function get_meta($, key) {
  // return document.getElementsByTagName('meta').e3root.content;
  return $('meta[name="e3:revision"]').attr('content');
}

function set_meta($, key, value) {
  const _value = get_meta($, key);
  if (!_value) {
    const md = $('<meta>')
      .attr('name', 'e3:revision')
      .attr('content','1.0');
    $('head').append(md)
//console.log($('head meta'))
//    $('head').append(`<meta property="${key}" value="${value}">`)
  } else {
    $('meta[property="e3:revision"]').attr('content',value);
  }
}

/*
    Upgrade new-products
    - locate section#new-products
    - for each article, collect sku, id and rewrite in correct syntax
    - add script new-products.js at end of body.
    - write meta-tag revison 1.0
*/

function upgrade_new_products($) {
  const imax = 1199;
  const v = $('body').find('section#new-products').find('article')
  console.log(`found ${v.length} articles`)
  v.each((i,e)=>{
    const id = $(e).attr('id');
    const sku = $(e).data('sku');
//    console.log(`id:${id} sku[${i}]:${sku}`)
//    console.log(`id:${id} sku[${i}]:${e.data}`)
//    console.log({e})

    if (true || !id) {
//      $(e).attr('id',`${imax-i}~${sku}`);
      $(e).attr('id',imax-i);
      $(e).addClass('js-e3dkz')
      $(e).removeClass('e3dkz')
    }
    // add "js-e3dkz"



    console.log(`id:${$(e).attr('id')} sku[${i}]:${sku}`)

  })



  set_meta($,'e3:revision', '1.0')
  console.log(`e3:revision: ${get_meta($,'e3:revision')}`);
}
