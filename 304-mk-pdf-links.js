#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const find = require('find');

const ya_store = '/home/dkz/tmp/224-co.th-dkz/en/en/pdf/';
const dest_folder = '/home/dkz/tmp/304-pdf-links';

const files = find.fileSync(/\.pdf$/, ya_store);

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
