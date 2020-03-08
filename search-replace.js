#!/usr/bin/env node

// global search/replace eglogics


const fs = require('fs-extra');
const path = require('path')
const walk = require('klaw-sync')
//const root_folder = '/www/ultimheat2.co.th';
const root_folder = '/www/ultimheat3.co.th';


walk(root_folder).forEach(file =>{
  if (file.path.endsWith('.html')) {
//    console.log('==================\n'+file.path+'\n=====================')
    console.log(file.path)
    const html = fs.readFileSync(file.path,'utf8')
      .replace(/http:\/\/design.eglogics.website\/ultimheat\//g,'https://ultimheat.co.th/')
    fs.outputFileSync(file.path, html, 'utf8');
  } // html
}) // walk
