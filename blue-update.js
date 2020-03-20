#!/usr/bin/env node

/*
        (1) identify sku and md2html convert MD+YAML file into HTML
        (2) locate article and insert html code into web-page at the right place.
*/

const fs = require('fs');
const path = require('path')
const assert = require('assert')
const cheerio = require('cheerio');
const find = require('find');
const md2html = require('./md2html.js');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
const yargs = require('yargs')
.alias('v','verbose').count('verbose')
.alias('i','instance_name')
.argv;


const env = yaml.safeLoad(fs.readFileSync('./.env.yaml', 'utf8'));

const web_page = yargs.web_page || env.web_page;
const watch_folder = path.join(path.resolve(yargs.watch_folder || web_page.replace(/\.html/,'')),"*.md");
console.log(`blue-update watching <${watch_folder}>`)

const log = console.log.bind(console);
// GIVE FULL PATH...

//const watcher = chokidar.watch('/home/dkz/tmp/224-co.th/www/new-index/*.md', {});
const watcher = chokidar.watch(path.resolve(watch_folder), {});


var watchedPaths = watcher.getWatched();
console.log(`watched:`,watchedPaths)

/*
watcher
.on('change', (path) => {
  log(`File ${path} has been changed`)
//  update_index(path)
}) */


watcher.on('change', (path, stats) => {
  if (stats) console.log(`File ${path} changed size to ${stats.size}`);
  update_web_page(path)
});


function update_web_page(filename) {
  const {html,sku} = md2html(fs.readFileSync(filename, 'utf8'));
  console.log({sku})
  const page = fs.readFileSync(web_page,'utf8');
  console.log('page.length:', page.length)
  const $ = cheerio.load(page)
  const section = $('section#tests-ya');
  console.log(`found ${section.length} sections.`)
  assert(section.length ==1)
//      replace_product({sku, section, html});
  const v = $(section).find(`article[sku="${sku}"]`);
  if (v.length <=0) {
    console.log(`This product ${sku} is not found in blue-section.`)
    return
  }
  //console.log(v)
  v.empty().append(html);

  const output = $.html()
  fs.writeFileSync(web_page, output, 'utf8');
}
