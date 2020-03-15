#!/usr/bin/env node

/*
    (1) scan folder ya-store, and index products h[ai]
    (2) scan files /en/new-products.html#(ai).md, and remove them from h[ai]
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


const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('c','js-class')
  .alias('i','input') // path to new-products.html
  .alias('o','output') // path to new-products.html
  .alias('n','dry-run')
  .options({
    'dry-run':  {type:'boolean', default:false},
    'force': {type:'boolean', default:false},
  }).argv;

const {verbose, 'input':fpath, output, 'dry-run':dry_run, 'js-class':js_class = 'js-e3article'} = argv;

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


const h =[]; // /en/new-products.html~1200.md

/*
      scan "/www/ultimheat.co.th/en" for new-products MD files.
      get the basename
*/

const {dir} =path.parse(fpath)

console.log(`@57: folder to scan <${dir}>`)
const v2 = fs.readdirSync(dir)
for (let fn of v2) {
  const retv = fn.match(/^new-products.html\#(\d+)\.md$/)
  if (!retv) {
//    console.log(`Invalid file syntax: <${fn}>`)
    continue;
  }

  const ai = retv[1]; // article-id
  h[ai] = fn;
  (verbose>0) && console.log(`md-file ai:${ai} <${fn}>`)
}

console.log(`@71: found ${Object.keys(h).length} files.`)

//console.log(`@69 -stop-`); return;
/*

    PHASE 2 :


    here we have list of products in MD files.
    maybe some legacy products not there... <1200

    NEXT: cheerio on section#new-products articles

*/


const html = fs.readFileSync(fpath,'utf8');
console.log('page.length:', html.length)
const $ = cheerio.load(html)

const rev = get_meta($, 'e3:revision')
console.log(`e3:revison:${rev}`); // signal a virgin html => insert scripts ++


const selector = `section#new-products div.row`
const v = $('body').find(selector);
console.log(`@94: found ${v.length} new-products in actual HTML page.`)
// Get inner-html
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
    if (!dry_run) {
      fs.writeFileSync(path.join(dir,`new-products.html#${ai}.md`),
      `---
      article_id: ${ai}
      sku: ${sku}
      format: raw-html
      ---
      ` + article.html().replace(/^\s*/gm,' '),'utf8');
        h[ai] = path.join(fpath,`new-products.html#${ai}.md`);
    }
  } else {
  // do nothing.
  }
})


if (!rev) {
  /***********************
    insert the scripts
  ************************/
  const head = $('head');
  console.log(`@152: head:`,$(head).html());
  head.append($('\n<script type="text/javascript" src="/dkz-double-click.js"></script>'))
  head.append($('\n<link rel="stylesheet" src="/dkz.css">'))
  head.append($('\n<meta name="e3:version" content="1.0">\n\n'))
  console.log(`@155: head:`,$(head).html());

  $('body').append($('\n<script type="text/javascript" src="/new-products.js"></script>\n\n'))
}

if (output) {
  fs.writeFileSync(output, $.html(),'utf8');
  console.log(`@165: pass1 written on file <${output}>`)
} else {
  if (!dry_run) {
    fs.writeFileSync(fpath,$.html(),'utf8');
    console.log(`@165: pass1 written on file <${fpath}>`)
  } else {
    console.log(`@168: DRY-RUN nothing written`)
  }
}


/*
    Here we will remove all products and reload from MD => new-products3.html
*/

v.empty()

const revlist = Object.keys(h).reverse();

/*
    revuild everything.
*/

revlist.forEach(ai =>{
  const {data, html} = read_md_file(path.join(fpath,`new-products.html#${ai}.md`));
  if (data.format == 'raw-html') {
//    console.log({html})
    v.append(`<div class="col-lg-4 col-md-6">
    <article id="${ai}" class="card new-card js-e3article">
    ${html}
    </article>
    </div>
      `)
    return;
  }

  //

  v.append(`<div class="col-lg-4 col-md-6">
  <article id="${ai}" class="card new-card js-e3article">
  <img src="/new-images/${data.img}" class="card-imgs mb-2">
  <small class="text-grey mb-2"><b>${data.sku}</b> </small>
  ${html}
  <div class="btns">
  <a href="./pdf/${data.pdf}" target="_blank" class="btn-red">Download PDF</a>
  <span class="number-btn">${ai}</span>
  </div>
  </article>
  </div>
    `)
})


if (output) {
  fs.writeFileSync(output, $.html(),'utf8');
  console.log(`@220: pass2 written on file <${output}>`)
} else {
  if (!dry_run) {
    fs.writeFileSync(fpath,$.html(),'utf8');
    console.log(`@224: pass2 written on file <${fpath}>`)
  } else {
    console.log(`@168: DRY-RUN nothing written`)
  }
}


function read_md_file(fp) {
  const md = fs.readFileSync(fp,'utf8');
return md2html(md);
/*
  const {data, html} = md2html(md); // if raw-html yaml not used.
  console.log ({data});
  console.log({html})
*/
}


function get_meta($, key) {
  // return document.getElementsByTagName('meta').e3root.content;
  const selector = `meta[name="${key}"]`
  return $(selector).attr('content');
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
