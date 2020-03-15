const marked = require('marked');
const renderer = new marked.Renderer();
const yaml = require('js-yaml');
const assert = require('assert')


function fix_yaml(data) { // NO.
throw 'Obsolete@8';
  const v = data.split(/\-\-\-/g);
  assert(!v[0])
  assert(v.length == 3)
  v[1] = v[1].replace(/^([^:]*):\s*/gm,'$1<<>>').replace(/:/g,'~!~').replace(/<<>>/g,': ')
//  console.log(v.join('---'))
  return v.join('---')
}


function fix_metadata(s) {
  const v = s.split('\n');
  v.forEach((li,j) =>{
    v[j] = li.replace(/^([^:]*):\s*/gm,'$1<<>>').replace(/:/g,'~!~').replace(/<<>>/g,': ')
  })
  return v.join('\n')
}


function md2html(data) {
//  data = fix_yaml(data);
  const v = data.trim().split(/\-\-\-/g); //match(yamlBlockPattern);
  assert(!v[0])
  assert(v.length == 3)

  //console.log(v[1]);
  //console.log(v[2]);

  v[1] = fix_metadata(v[1]) // :::: only 1 per line.

  var json = yaml.safeLoad(v[1], 'utf8');


  //console.log({json})
  if (json.format == 'raw-html') {
    return {data:json, html:v[2]}
  }

  const html = marked(v[2], { renderer: renderer });

  return {data:json, html}

}

module.exports = md2html;
