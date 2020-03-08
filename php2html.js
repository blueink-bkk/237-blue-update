const fs = require('fs')
const cheerio = require('cheerio');

function strip(fpath) {

  const html = fs.readFileSync(fpath,'utf8')
//      .replace(/^[^]*<!DOCTYPE/mi,'<!DOCTYPE')
  .replace(/<\?= base_url; \?>/g, '') // must be first
  .replace(/<\?php include\('head.php'\); \?>/g, '')
  .replace(/<\?php include\('header.php'\); \?>/g, '')
  .replace(/<\?php include\('footer.php'\); \?>/g, '')
  .replace(/<\?php include\('sidebar.php'\); \?>/g, '')
  return html;
}

function scan(fpath, {
  every_article,
  every_img,
  every_href}) {
  const html = strip(fpath);
//  console.log(html)
  const $ = cheerio.load(html)
  const selector = `section#new-products div.row`
  const v = $('body').find(selector);
  console.log(`found ${v.length} new-products in actual HTML page.`)
//  console.log(v)
  const listp = v.children();
//  console.log(`@25: `, listp)

  listp.each((i,e)=>{
    const article = $(e).find('article');
    let ai = $(article).attr('id');
    const sku = $(article).data().sku;
    const span = $(e).find('span.number-btn');
    const xid = span.text()
//    console.log(`-- ai:${ai} sku:${sku} xid:${xid}`)

    // BUILD THE MD

    const yaml = `---
xid: ${xid}
article_id: ${ai}
sku: ${sku}
format: raw-html
---
`
    const html = article.html().replace(/^\s*/gm,' ');

//    console.log(md)

  every_article({ai,xid,yaml,html}) // create folder.

  const list_img = $(article).find('img').each(function() {
    every_img({xid, fn:$(this).attr('src').trim()});
  })

  $(article).find('a').each(function() {
    //console.log(`href:`,$(this))
    every_href({xid, fn:$(this).attr('href').trim()});
  })



  })

return;
  listp.each((i,e)=>{
    console.log('--------------')
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

    if (false){
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
  } }
})

}

module.exports = {
  scan
}
