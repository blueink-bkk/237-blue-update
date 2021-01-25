/***********


<img
  src="https://jpci-assets.us-east-1.linodeobjects.com/1538^Cat22-2-Ultimheat-EN-P15-P16-9SFT402-20200311/Cat22-2-Ultimheat-EN-P15-P16-9SFT402-20200311.jpg"
  class="card-imgs mb-2">
<small class="text-grey mb-2"><b>
  Type 9SFT402
</b> </small>
<h1 id="renewable-energy-114-immersion-heaters-12-and-24v-power-supply-with-connection-box">
  Renewable energy 1"1/4 immersion heaters, 12 and 24V power supply, with connection box
</h1>
<p>
  Main application: direct use of low voltage electricity produced by wind turbines or
  photovoltaic solar panels, for heating liquids, domestic hot water circuits,
  hot water tanks.<br>Heater tube mater<span class="moreellipses">...&nbsp;</span>
  <span class="morecontent"><span>
  rial: dia. 8mm heating elements in AISI 304.<br>Fitting material: Brass, brazed on tubes.<br>
  Enclosure: dia. 58mm x 75mm, black PA66 fiber glass reinforced, with gasket.
  <br>Ingress protection class: IP66.<br>Thermowell: Includes one stainless steel thermowell 7mm ID.
  <br>Not heating immersed zone: 50mm</span>&nbsp;&nbsp;
  <a href="" class="morelink">more</a></span>
</p>

<div class="btns">
  <a href="https://jpci-assets.us-east-1.linodeobjects.com/1538^Cat22-2-Ultimheat-EN-P15-P16-9SFT402-20200311/Cat22-2-Ultimheat-EN-P15-P16-9SFT402-20200311.pdf"
  target="_blank" class="btn-red">
  Download PDF
  </a>
  <span class="number-btn">1538</span>
</div>

************/


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
