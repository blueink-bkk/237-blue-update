function article_innerHtml({meta, md_code, verbose=0})=>{
//  ;(verbose >0) &&console.log(`}/${data.img}>`)

  const img_src = `https://jpci-assets.us-east-1.linodeobjects.com/${xid}/${data.img}`
  const href_pdf = `https://jpci-assets.us-east-1.linodeobjects.com/${xid}/${data.pdf}`

  return `
    <img src="${img_src}" class="card-imgs mb-2">
    <small class="text-grey mb-2"><b>${data.sku}</b> </small>
    ${html}
    <div class="btns">
    <a href="${href_pdf}" target="_blank" class="btn-red">Download PDF</a>
    <span class="number-btn">${xid4}</span>
    </div>
    `)
}

module.exports = {
  article_innerHtml,
}
