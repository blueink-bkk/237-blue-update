#!/usr/bin/env node

/*
    402-rebuild-new-products.js

    get a product from ya-store
    and update new-products.html.

    (1) check if the product exists in s3://ya-store or the database (ADOC)
    (2) get the html from s3::/blueink
    (3) use cheerio to get actual list, then locate the product (xid)
    (4) replace product
    (5) put html back into s3://blueink

*/

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


async function main() {
  console.log(`Going async`);

  if (false) {
    const {list,etime} = await s3client.list_Objects({bucket:'jpci-assets', prefix:'11', recursive:true});
    console.log(list)
    console.log(`etime:${etime}`)
  }

  /*******************************************
    from ya-store, open md-file, get metadata.
  ********************************************/

  const xv = xid.split('^');
  const {data:md_data, etime:etime1, error:error1} = await s3client.get_Object({bucket:'jpci-assets', key: `${xid}/${xv[1]}.md`});
  console.log(`@75 `,{error1})
  console.log(`@75 `,{xid})
  console.log(`@100: data ready. data.length:${md_data.length}`);
      console.log(`@76 `,md_data.toString());
  const v = md_data.split(/\-\-\-/g);
  assert(!v[0])
  assert(v.length == 3)
  let meta = yaml.safeLoad(v[1], 'utf8');
  let md_code = v[2];

  /*******************************************
    from jspi-assets get html, build article-directory (optional)
  ********************************************/


  const {data:html, etime:etime2} = await s3client.get_Object({bucket:'blueink', key:'en/new-products.html'});
  console.log(`@100: data ready. data.length:${html.length}`);
  //    console.log(data.toString());

  const $ = cheerio.load(html);
  const div_row = $('body').find('section#new-products div.row');
  const articles = $('body').find('section#new-products article');
  const h ={};
  articles.each((i,article)=>{
    // console.log(`--${i}-- `, article.attribs.id)
    const _xid = article.attribs.id;
    if(h[_xid]) {
      console.log(`@90 collision _xid:${_xid}`)
    }
    h[_xid] = article;
  })


  /*******************************************
    from jspi-assets get html,
      -- locate article#xid
      -- empty
      -- check meta.format
      -- rebuild the article according to format (raw-html or diva1)

  ********************************************/


  if (xid) {
    const xid4 = xid.substring(0,4)
    if (!h[xid4]) {
      console.log(`@94 article xid:${xid} not-found in html`)
      return;
    }
    console.log(`replacing article <${xid4}>`)
    const selector = `section#new-products article#${xid4}`
    const article1 = $('body').find(selector);


    console.log(article1.html())
    article1.empty();
    console.log(`@105 :`,article1.html())

    const html2 = md2html({meta,md_code})
  } // --xid
}

main();


function md2html({meta,md_code}) {
  switch (meta.format) {
    case 'raw-html':
      console.log(`${meta.format} - no template.`)
    break

    case '':
    default:
    console.log(`format:${meta.format}`)
  } // switch format

}


return;

///////////////////////////////////////////////////////////////////////////////

let {output} =  env;
let {ya_store} =  env; // where to look for MD-files
assert(ya_store)
const fpath = argv._[0];

if (!fpath) {
  console.log(`Missing path to <new-products/index.html> or <new-products.html>`)
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
!!!

  ya-store is where we look for md.
*****************************/

if (!ya_store) {
  let {dir:ya_store, base} = path.parse(fpath);
  console.log(`@103: ya-store:${ya_store}`)
}




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

if (false) {
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
        ya_store = path.join(dir,name)
      } else {
        ya_store = dir
      }

      // in all cases, output should be new-products/index.html

    break;


    default:
      console.log(`@144: Unknown e3_version <${e3_version}>
        FATAL`);
      return;
  }
}


/*******************************

  Analyse directory

********************************/

const walk = require('klaw-sync')

let aCount =0;

const h ={};
walk(ya_store).forEach(file =>{
  if (file.path.endsWith('index.md')) {
    ;(verbose >0) && console.log(`@76: <${file.path}>`)
    /*
    const [p,xid] = /\/([0-9]+)\/index.md$/.exec(file.path);
    ;(verbose >0) && console.log(`@187: xid:${xid}`)
    */
    const {dir:xid,base} = path.parse(path.relative(ya_store,file.path))
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
//  const {data, html} = read_md_file(path.join(ya_store, xid, 'index.md'));
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

  /****
  // should be applied only for certain versions.
  let xdir = xid;
  if (h[xid].indexOf('^') >=0) {
    const {dir} = path.parse(h[xid].split('^')[1]); // horrible trick.
    xdir += '^' + dir
  }
  *****/

  const xid4 = xid.substring(0,4)

  if (false) {
    div_row.append(`<div class="col-lg-4 col-md-6">
    <article id="${xid4}" class="card new-card js-e3article">
    <img src="./${xid}/${data.img}" class="card-imgs mb-2">
    <small class="text-grey mb-2"><b>${data.sku}</b> </small>
    ${html}
    <div class="btns">
    <a href="./${xid}/${data.pdf}" target="_blank" class="btn-red">Download PDF</a>
    <span class="number-btn">${xid}</span>
    </div>
    </article>
    </div>
      `)
  } else {
    ;(verbose>1) &&console.log(`@301: img <${xid}/${data.img}>`)
    const img_src = `https://jpci-assets.us-east-1.linodeobjects.com/${xid}/${data.img}`
    const href_pdf = `https://jpci-assets.us-east-1.linodeobjects.com/${xid}/${data.pdf}`
    div_row.append(`<div class="col-lg-4 col-md-6">
    <article id="${xid4}" class="card new-card js-e3article">
    <img src="${img_src}" class="card-imgs mb-2">
    <small class="text-grey mb-2"><b>${data.sku}</b> </small>
    ${html}
    <div class="btns">
    <a href="${href_pdf}" target="_blank" class="btn-red">Download PDF</a>
    <span class="number-btn">${xid4}</span>
    </div>
    </article>
    </div>
      `)
  }
})


if (!output) {
  switch (e3_version) {
    case 'editora':
      output = path.join(ya_store,'index.html')
    break
    default:
      throw '@256: fatal'
  }
}

if (!dry_run) {
  if (!output) {
      fs.writeFileSync(fpath, $.html(), 'utf8');
      console.log(`@248: original file <${fpath}> is updated.`)
  } else {
    fs.writeFileSync(output, $.html(), 'utf8');
    console.log(`@254: html-file written on <${output}>`)
  }

} else {
  console.log(`@250: DRY-RUN - results not written on file system.`)
}


console.log(`@338: return... to check`)
return;

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
