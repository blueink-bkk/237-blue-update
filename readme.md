# `Ultimheat.co.th` Operations

## LiveUpdate on new-products

1. check you have webmaster privilege
2. visit page `https://ultimheat.co.th/en/new-products.html` or (th)
3. position cursor on notice to update
4. double-click : codeMirror editor opens in a new tab
5. edit metadata and/or markdown code
6. control-S to save your modifs
7. go back to (2) and verify your changes.

## How to add a new product

1. create a folder
2. add the pdf
3. add the jpeg
4. create a md file (see ex. below)
```
1282^Cat32-Ultimheat-EN-P63-BZ-20200116
-- Cat32-Ultimheat-EN-P63-BZ-20200116.jpg
-- Cat32-Ultimheat-EN-P63-BZ-20200116.md
-- Cat32-Ultimheat-EN-P63-BZ-20200116.pdf
```
5. using **fileZilla** upload the folder on Caltek.net
6. website will be updated in a few minutes.

## How to remove a product

1. follow procedure **LiveUpdate**
2. edit the metadata
3. insert delete instruction `deleted: true` (see ex. below)
4. save document (control-S)

```
---
article_id:  1282-BZ
img:  Cat32-Ultimheat-EN-P63-BZ-20200116.jpg
pdf:  Cat32-Ultimheat-EN-P63-BZ-20200116.pdf
format:  diva-v1
sku:  Type BZ
deleted: true
---
```

### Complete example of Markdown file and metadata
```
---
article_id:  6YTPEM24
img:  Cat32-Ultimheat-EN-P76-6YTPEM24-20200123.jpg
pdf:  Cat32-Ultimheat-EN-P76-6YTPEM24-20200123.pdf
format:  diva-v1
sku:  Type 6YTPEM24
---

# M24 cable gland, short thread, in black PA6
This cable gland has been developed for applications in which the standard M25 
model is too bulky. The reduced length of the thread (8.5mm) makes it possible 
to mount it on enclosures with thin walls, without too much encroaching on the 
interior space. It has an O-ring to ensure the tightness with the enclosure, 
and the nut is self-locking. It allows passing cable diameters up to 14mm 
and also oblong cables used in heat tracing. Made in PA6 UL94V2. Gaskets 
are available in 65 shore silicone or NBR 70 shore.  
Options: Flat external gasket and counter nut in PA6.  
```
