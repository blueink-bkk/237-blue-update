#!/usr/bin/env node

/*
  300-mk-page-folder

  from
      .../kavendra/en/new-products.php

  create
      ya-new-products/en
          index.html    // template v.empty()
          <xid> folder
              index.md (type:raw-html)

  scan folder /www/ultimheat.co.th/ya-store/<pageno>

  for each product, create a link file in /article/:
    /www/ultimheat.co.th/en/article/<pageno>

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
const yaml = require('js-yaml');

const regex = /^(\d+)\^.*/; // ya-format
//en/new-products.html';


const env = {
//  'ya_store' : '/www/ultimheat.co.th/ya-store';
//  'en_fpath' : '/www/ultimheat.co.th/en'
}

const env_yaml = (fs.existsSync('./.env.yaml'))?
    yaml.safeLoad(fs.readFileSync('./.env.yaml')):{};

//console.log({env})
Object.assign(env, env_yaml)
//console.log({env})


const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('i','input')
  .alias('s','soft-links')
  .alias('o','output')
//  .boolean('pg-monitor')
//  .boolean('commit')
  .alias('f','force') // create output folder
  .options({
    'force': {type:'boolean', default:false},
  }).argv;

Object.assign(env, argv);

const {verbose, input:www_root, output, assets, force} = env;

if (argv._.length <=0) {
  console.log(`missing php-file to process.
    ex: $ ./300-mk-page-folder ~/tmp/224-co.th-kavendra/en/new-products.php
    -exit-
    `);
  return;
}

const fpath = argv._[0];

if (!fpath.endsWith('.php')) {
  console.log(`ALERT: not-a-php file
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


/******************
  NEED a destination
*******************/

if (!fs.existsSync(output)){
  if (!force) {
    console.log(`-o destination (--output) must exists!
     <${path.resolve(output)}>
      -exit-
      `);
    return;
  } else {
    console.log(`@106: create destination folder <${path.resolve(output)}>`)
    fs.mkdirSync(output, {recursive:true})
  }
}


/******************

  (1) create folder  <output>/new-products
  (2) move html into index.html -NO NEED : just create link.
  (3) make link

********************/

const {basename} = path.parse(fpath); // =>new-products.php

let alerts =0;
function safe_relink(src, dest, xid) {
  if (!fs.existsSync(src)) {
    alerts ++;
    console.log(`@170: ALERT #${alerts} @xid:${xid} safe_relink file-not-found src:<${src}>`)
    return;
  }
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
  }
  fs.linkSync(src,dest)
}


const html = require('./php2html.js').scan(fpath, {
  every_article: function(a){
    ;(verbose >0) && console.log(`-- every-article xid:`,a.xid)
    /*
        process <img> and <pdf> relative path.
        <img src="new-images/BY.jpg"
        <img src="./${xid}/BY.jpg"
    */
    const md = a.html
      .replace(/<img src="new-images\//g,`<img src="./${a.xid}/`)
      .replace(/<a href="en\//g, '<a href="../en/')
//    console.log(md)

    /*****************
    CREATE A FOLDER
    ******************/

    const xid_dir = path.join(output,`${a.xid}`);
    if (!fs.existsSync(xid_dir)) {
      (verbose >0) && console.log(`$141: create dir <${xid_dir}>`)
      fs.mkdirSync(xid_dir)
    }

    const md_fn = path.join(xid_dir,'index.md');
    fs.writeFileSync(path.join(xid_dir,'index.md'),a.yaml+md,'utf8');
  },
every_img: ({xid,fn})=>{
    ;(verbose >0) && console.log(`every-img:${fn}`)
    const {dir, base} = path.parse(fn);
    const src = path.join('/home/dkz/tmp/224-co.th-dkz',dir,base);
    const dest = path.join(output,xid,base)
    ;(verbose >0) && console.log(`every-img:${fn} ln <${src}> <${dest}>`)
    safe_relink(src,dest,xid)
  },
every_href: ({xid,fn})=>{
    ;(verbose >0) && console.log(`every-href xid:${xid} <${fn}>`)
    const {dir, base} = path.parse(fn);
    ;(verbose >0) && console.log(`every-href dir:${dir} base:${base}`)
    if (dir == 'en/pdf') {
      const src = path.join('/home/dkz/tmp/224-co.th-dkz',dir,base);
      const dest = path.join(output,xid,base)
      safe_relink(src,dest,xid)
      //console.log(`@178: hard-link <${dest}>`)
    }
  } // href
}) // scan

console.log(`found ${alerts} ALERT.`)
throw 'exit'


// touch index.html <= section.empty()

const dir = fpath.replace(/\.html$/,'')
;(verbose >0) && console.log(`@101: create folder <${dir}>`)

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const index_html = path.join(dir,'index.html');

if (fs.existsSync(index_html)){
  fs.unlinkSync(index_html);
}

fs.linkSync(fpath, index_html)



console.log(`@67: `,argv._)

return;


  const v = fs.readdirSync(path.join(env.ya_store, ya_store[ai]))
//  console.log({v})
  v.forEach(fn =>{
    /**************
    if (fn.endsWith('.pdf')) {
      const dest = path.join(env.articles,'/pdf',fn)
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
    } else */

    if (fn.endsWith('.md')) {
      const dest = path.join(env.articles,  `${ai}/index.md`);
      (verbose >0) && console.log(`@210:`,{dest})
      try {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        const from = path.join(env.ya_store, ya_store[ai],fn);
        if (!fs.existsSync(from)) throw 'fatal-at-214'
        // create /article/<pageno>
        const adir = path.join(env.articles,`${ai}`);
        if (!fs.existsSync(adir))
            fs.mkdirSync(adir);
        fs.linkSync(from, dest)
        console.log(`${from} => ${dest}`)
        u_Count ++;
      } catch(err) {
        console.log(`@214: `,err)
      }
    } else {
      console.log(`ignoring:`,{fn})
    }
  })


if (u_Count >0) {
  console.log(`${u_Count} files enrolled`)
} else {
  console.log(`Already up to date`)
}
