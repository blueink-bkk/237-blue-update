#!/usr/bin/env node

/*
  ENROLL:  (301)

  - input: ya-store (ex: /www/ultimheat.co.th/ya-store/<pageno>)
  - output: www-root (ex: /www/ultimheat.co.th/en/)

  for each product <xid> found in ya-store (new-products):
    create a folder /new-products/article/<xid>

  /www/ultimheat.co.th/en/
                          new-products.html
                          new-products/
                              /article
                                  8765
                                    index.md
                                    123.jpeg -> link
                                  8766
                                    index.md
                                    8766.jpeg -> link

  for a footer it could be:

  /www/ultimheat.co.th/en/
                          footer
                            index.html
                            top1.jpeg
                            bot2.jpeg
                            index.md

  /www/ultimheat.co.th/en/
                          footer
                            footer.html
                            footer1.jpeg
                            footer2.jpeg
                            footer.md

  /www/ultimheat.co.th/en/
                          new-products
                            index.html
                            article         // signal an iterative (list)
                              8765
                                  index.md
                                  8765.jpeg
                                  8765.pdf
                              8766
                                  index.md
                                  8766.jpeg
                                  8766.pdf

   EVERYTHING RELATED TO AN ARTICLE IS IN A FOLDER.


  Objective:
    for each page, pdf and jpeg are relative to this html page.
    par ex: pour new-products.html
    <img src="8765/8765.jpeg">
    <img src="8766/8766-ignition-123.jpeg">

  For footer:
    <div id="footer" class="e3:editora">
      ... will be rebuilt from /en/footer/index.md
      <img src="top1.jpeg"> .. in /en/footer/top1.jpeg
      <img src="bot2.jpeg">
    </div>

  WHAT IF:
      header
        index.html
      footer
        index.html
        index.md    for    ... <div class="e3:editora"></div>
        side.md    for    ... <div class="e3:editora" fp="side.md"></div>
      constact-us
        index.html
      new-products
        index.html => rebuilt from articles and ax-707
          up-707.md  for ... <div class="e3:editora" fp="up-707.md"></div>
          section-1 // do we need this ? YES to tell which section to fill.
            1234 // to keep things together.
              index.md
              abc.jpg
            7654
          section-2
            ax101
              index.md
              ax101.jpeg
            ax102
              ax102.md (second choice)
              ax102-ignition-reduced.jpeg

  THAT MEANS:

  in footer.html somewhere...
    <article class="e3:editora" fp="main.md">
    ... will be rebuilt from ./.editora/main.md
    </article>

    <section class="e3:editora">
    ... will be rebuilt from ./.editora/index.md
    </section>

  in new-products.html

    <section class="e3:editora" fp="main-section"> // declare an iterative.....
    ... will be rebuilt from all articles found in
    ... en/new-products/main-section/.../index.md
    ... except if exists en/new-products/main-section/index.md
    ... md files should exist only at the same level.
    </section>

  and (in new-products) each article will be something like:

    <article class="e3:editora" fp="main-section/8765">
    ...
    </article>

  then, double-click will look at:
      en/new-products/main-section/8765/index.md (first essai)
      en/new-products/main-section/8765/8765.md (second essai)
      then consider en/new-products/main-section/8765/ as another list... :(

  another situation:

  <article class="e3:editora" fp="main-section/8765/8765.md">
  ...
  </article>



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

const pool_images = '/www/ultimheat.co.th/new-images'
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
  .alias('o','output')
  .alias('s','soft-links')
//  .boolean('pg-monitor')
//  .boolean('commit')
//  .option('force', {type:'boolean'})
  .options({
    'force': {type:'boolean', default:false},
    'pg-monitor': {default:true},
//    'limit': {default:99999}, // stop when error, if --no-stop, show error.
//    'zero-auteurs': {default:false}, //
  }).argv;

Object.assign(env, argv);

const {verbose, root:www_root, assets, force} = env;


/*
    Each folder in ya-store start with <pageno>
    create an index h[pageno] => folder
*/


const ya_store ={}; // ya-store (minus) /en/new-products.html~1200.md
const v = fs.readdirSync(env.ya_store);
(verbose >0) && console.log(`@65 ya-store dir:${v.length}`)

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

  if (!fs.lstatSync(path.join(env.ya_store,fpath)).isDirectory()) {
    console.log(`@44 ALERT NOT A FOLDER:`, fpath)
  //    enroll_product(fpath)
  continue;
  }

  const iSeq = retv[1]
  ya_store[iSeq] = fpath; // h[iSeq] => folder name.
} // loop ya-store files.

(verbose >0) && console.log(`@96 index.length:${Object.keys(ya_store).length}`)

/*
    HERE: h[pageno] => path-to-folder
*/


/*
    REMOVE EXISTING FROM THE LIST FOUND IN YA-STORE.

    EXISTING : do we want to override ? default : NO

    SCAN existing MD++ files.
    if MD++ file exists in {h} => REMOVE from {h}
    THIS MEANS NO UPDATE.
    just new products.
*/


const v2 = fs.readdirSync(env.articles); // EXISTING
(verbose >0) && console.log(`@112 existing articles.length:${v2.length}`)

for (let iSeq of v2) {
//  (verbose>0) && console.log(`md-file iSeq:${iSeq} <${fn}>`)

  if (ya_store[iSeq]) {
    (verbose>0) && console.log(`found ya_store[${iSeq}] => removed`)
    if (false) {
      ya_store[iSeq] = null; // ya-store cannot be loaded twice.
      // MEANS NO UPDATE...........
    }
  } else {
    (verbose>0) && console.log(`alert ya_store[${iSeq}] not in ya-store => ignored`)
  }
}

/*
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
*/

/*
    here, h[] contains only new products, to be enrolled.
    i.e:  ya-store (-) /en/new-products
*/

let u_Count =0;
for (const ai of Object.keys(ya_store)) {

  /*
      if already exists and NO --force then skip
  */

  if (!env.force && fs.existsSync(path.join(env.articles, `${ai}/index.md`))) {
    continue;
  }

  if (!ya_store[ai]) {
    continue;
  }
//  if (!h[ai]) continue;

  (verbose >0) && console.log(`ya_store[${ai}] => ya-folder ${ya_store[ai]}`)

  /*
      open ya-store folder - and link files.
      ADD links in /new-products (pdf)
      ADD link in /new-images (jpeg)
  */

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
      const dest = path.join(pool_images,fn);
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
}

if (u_Count >0) {
  console.log(`${u_Count} files enrolled`)
} else {
  console.log(`Already up to date`)
}
