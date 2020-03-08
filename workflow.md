# blueink new website : `ultimheat.co.th`

## Gateway to import new products
- folder `ya-store` contains the new products
- each new product is made of 3 files: pdf, jpeg, md into a subfolder.
- see below for examples.
- each folder has a unique numeric prefix. (here 1282^)

##### folder new-product
```
1282^Cat32-Ultimheat-EN-P63-BZ-20200116
-- Cat32-Ultimheat-EN-P63-BZ-20200116.jpg
-- Cat32-Ultimheat-EN-P63-BZ-20200116.md
-- Cat32-Ultimheat-EN-P63-BZ-20200116.pdf
```

##### file: Cat32-Ultimheat-EN-P63-BZ-20200116.md
```
---
article_id:  1282-BZ
img:  Cat32-Ultimheat-EN-P63-BZ-20200116.jpg
pdf:  Cat32-Ultimheat-EN-P63-BZ-20200116.pdf
format:  diva-v1
sku:  Type BZ
---
# Ceramic cable outlets

Ceramic cable outlet for ovens and kilns and furnaces, allows 
to pass electrical conductors through a metal wall in areas where 
the temperature is too high for plastics. The temperature resistance 
is given by the material of the nut: 230°C with nickel-plated brass nut, 
500°C with stainlessenroll-new-products 
```

## Enrolling new products
- use javascript `./224-blue-update/enroll-new-products.js`
- to be _published_ products in `ya-store` must be referenced in the `new-products` directory.
- `enroll-new-products` is in charge of finding products is `ya-store` not yet referenced.
- for each pdf we create a hard link in `./en/pdf`
- for each jpg we create a hard link in `./new-images`
- for each md we create a hard link in `./en`

## Rebuild html page : `new-products.html`
- use javascript `./224-blue-update/add-products.js`
- _cheerio_ locate `section#new-products` and empty the html content.
- then, `new-products` directory is scanned in reverse order (enrolled products)
- each product has an ID (sequential number) and a sku.
- for each enrolled product, we add a `article#ID` html element with content found in _markdown_ (`.md`) file.
- if format specified in metadata is not `raw-html`, a _renderer_ is applied to `.md` file.
- The renderer is a md2html converter (_markdown_ to _html_) specialized for the given format.
- the only renderer so far is `divya-v1`.


## How to make an html element _editable_ ?
- **MUST** have an ID.
- **MUST** be class `js-e3article`
- tagName is abitrary : div, article, section.
- each element `js-e3article` is called _editable content_ and will be highlighted on a mouse _hover_.
- a double-click on an highlighted element will start the editing process (`https://editora.us/edit-article`) web-application.
- a page visitor must have some privileges to see the highlight and be able to edit an element. (see below)
- each editable element (`js-e3article`) is stored in a _markdown_ file with metadata.
- metadata are in YAML format.
- both markdown code (MD-content), and metadata (YAML) are editable.
- when `metadata.format` is `raw-html` the MD-content must be pure html code, and will used without transformation.

##### Example:
```
<html>
  <head>...</head>
  <body>
  ...
     <article id="1234X" class="js-e3article">...</article>
     <div id="1235" class="js-e3article" data-sku="Y2K20">...</div>     
  ...
  </body>
</html>
```



## How to give _edit_ permission ? (webmaster)
- add query parameter to any URL - ex: `?p=XXXXX` with code provided by website admin.
- To add permanent privilege, visit `https://ultimheat.co.th/allow-double-click?p=XXXXX`


## Where are the editable-elements stored ?
- once edited, an editable-element is stored in MD format, _next_ to the html page (_see below_)
- 

##### Ex : file name convention-1 for md files.
```
./en/new-produts.html
./en/new-products.html^2029-Y2k3.MD
```
##### Ex : file name convention-2 for md files.
```
./en/new-produts.html
./en/new-products
./en/new-products/2029-Y2k3.MD
```

## Specialized renderers.
- in most of the cases, a standard renderer (_markdown_ to _html_) is used.
- if specific styling is required, it's always possible to add some css code. (see below)
- for more complex situations, a specialized renderer (javascript) might be required.
- parameters required for the specialized renderer must be set in MD metadata. (see below)
- in some cases, markdown-code of MD file could be empty. The renderer then has to build the html code from metadata only. 
- a specialized renderer produces html code in 2 steps:
  - (1) specialized markdown renderer using renderer hooks produces html code.
  - (2) metadata and html from (1) are injected in a javascript template.

##### Ex : metadata for specialized renderer
```
---
color1: rgb(10,30,67)
width1: 300px;
price: $23.00
sku: Y2K20
---
```

## Workflow

#### (1) Update php files
- repository: `https://github.com/kavendraespl/224-co.th.git`
```
$ git pull
```

#### (2) Rebuild HTML file
- repository: `https://github.com/blueink-bkk/224-blue-update.git`
- each PHP file is converted into HTML by interpreting `<?php include('***.php'); ?>`
- 
```
$ ~/224-blue-update/php2html.js
```
#### (3) Create links into `ya-store`
- create 3 hard links for each folder in `ya-store`
- hard link to pdf into ./en/pdf
- hard link to jpg into ./new-images
- hard link to y2k3.md into ./en/new-products.html#1234-y2k3.md
```
$ ~/224-blue-update/enroll-new-products.js
```


#### (4) Rebuild `new-produits` section
- using `cheerio`, locate, empty and rebuild `section#new-products row`
- scan existing articles in section, **create a MD file** if that article is not found as `new-products.html#xxx.md`
```
$ ~/224-blue-update/add-products.js
```

#### New GitHub Repository : `abatros-blueink`

```
$ git pull
$ git remote add abatros-blueink https://github.com/blueink-bkk/224-co.th.git
$ git push abatros-blueink
```

![pull-push](IMG_20200130_100514-2.jpg)


