#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const find = require('find');

const ya_store = '/www/ultimheat.co.th/ya-store/';
const dest_folder = '/www/ultimheat.co.th/pdf-links/';

const files = find.fileSync(/\.jpg$/, ya_store);

//console.log(files)

const h ={};
let nc =0;

files.forEach(file =>{
  const {base} = path.parse(file)
  h[base] = h[base] || [];
  h[base].push(file);
  if (h[base].length>1) console.log(`ALERT COLLISION`)
//  console.log(base)
  fs.linkSync(file, path.join(dest_folder,base))
})
