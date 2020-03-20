const assert = require('assert')
const request = require("request");
const Minio = require('minio')

let minioClient = null;
const endPoint = 'us-east-1.linodeobjects.com';

function connect() {
  if (!minioClient) {
    minioClient = new Minio.Client({
    //    endPoint: 'play.min.io',
    //    port: 9000,
    //    useSSL: true,
        endPoint,
        accessKey: "ID01M05FP8QHB0SMKT0G",
        secretKey: "AXMv62ilg8swaEtP912MkcXAdMyIsBeKRudvKXfF",
    //    region: "your region",
    });
//    minioClient.get_Object = wget; // get_Object;
//    minioClient.list_Objects = list_Objects;
//    minioClient.list_Buckets = list_Buckets;
    Object.assign(minioClient, {
      list_Buckets,
      list_Objects,
      upload_file,
      get_Object: wget,
      fGet_Object, fPut_Object,
    })
    console.log(`Connected to ${endPoint}`)
  }
  return minioClient;
}

connect();




function test() {
  assert(minioClient);
  try {
    const stream1 = minioClient.listObjects('jpci-assets','11',false);

    stream1.on('data', function(obj) { console.log(obj) } )
    stream1.on('error', function(err) { console.log(err) } )

  } catch(err) {
    console.log(`@24: error:`,err)
  }
}


function list_Buckets() {
  assert(minioClient);

  return new Promise((resolve,reject)=>{
    minioClient.listBuckets()
    .then(buckets => {
    //    if (!_.find(buckets, { name: bucketName })) done(new Error('bucket not found'))
    //    done()
        console.log(`buckets:`,buckets)
        resolve({buckets})
    })
    .catch(error =>{
      console.log({error})
    })
  })
} // list_Buckets

function list_Objects({bucket,prefix,recursive=false}) {
  assert(minioClient);
  return new Promise((resolve,reject)=>{
    let etime = new Date().getTime();
    const list = [];
    var stream = minioClient.listObjects(bucket, prefix, recursive)
    stream.on('data', function(obj) {
//      console.log(`@54: data=>`,obj)
      list.push(obj)
    })
    stream.on('error', function(err) {
      console.log(error)
      reject({error})
    })
    stream.on('end', function(x) {
//      console.log(`@62: end x =>`,x)
      resolve({
        list,
        etime: new Date().getTime()-etime,
      })
    })
  })
}

function listObjectsV2() {
  assert(minioClient);
  throw 'TODO'
}


function wget({bucket,key}) { // must be --acl-public !!
  return new Promise((resolve,reject)=>{
    let etime = new Date().getTime();
    const url = `http://${bucket}.us-east-1.linodeobjects.com/${key}`
    request(url, function(error, res, body) {
      if (error) {
        reject({error})
        return;
      }
      etime = new Date().getTime() - etime;
      console.log({etime})
      resolve({data:body, etime, error:null})
    });
  })
}
function get_Object({bucket,key}) {
  assert(minioClient);
  return new Promise((resolve,reject)=>{
    let etime = new Date().getTime();
    let size =0;
    const blist = [];
    minioClient.getObject(bucket, key, function(error, dataStream){
      if (error) {
        console.log(`@88 error:`,{bucket,key})
        console.log(`@88 error:`,error)
        reject({error})
        return
      }
      dataStream.on('data', function(chunk) {
        console.log(`@94 get_Object --chunk.size:${chunk.length}`)
        blist.push(chunk)
         size += chunk.length
       })
       dataStream.on('end', function() {
         etime = new Date().getTime() - etime;
         console.log(`End. (${etime}ms) Total size = ${size}`)
         resolve({size,
           data: Buffer.concat(blist),
           etime
         })
       })
       dataStream.on('error', function(error) {
         console.log(error)
         reject({error})
       })
    })


   }) // promise
} // get_Object

function putObject() {
  assert(minioClient);
  throw 'TODO'
}

function removeObject() {
  assert(minioClient);
  throw 'TODO'
}

async function upload_file({bucket, key, fpath, meta}) {
  return new Promise((resolve,reject)=>{
    minioClient.fPutObject(bucket, key, fpath, meta, function(error, etag) {
      if (error) {reject(error); return;}
      console.log({etag})
      resolve(etag);
    }) // fPut
  }) // promise
} // upload_file

async function fPut_Object({bucket, key, fpath, meta}) {
  meta = meta || {};
  return new Promise((resolve,reject)=>{
    minioClient.fPutObject(bucket, key, fpath, meta, function(error, etag) {
      if (error) {reject(error); return;}
      console.log({etag})
      resolve(etag);
    }) // fPut
  }) // promise
} // upload_file

async function fGet_Object(args) {
  const {bucket, key, fpath} = args;
  return new Promise((resolve,reject)=>{
    minioClient.fGetObject(bucket, key, fpath, function(error, etag) {
      if (error) {
        console.log({error})
        console.log({args})
        reject(error);
        return;
      }
      console.log({etag})
      resolve(etag);
    }) // fPut
  }) // promise
} // upload_file


module.exports = {
  connect,
  list_Objects,
  listObjectsV2,
  get_Object,
  putObject,
  removeObject,
  fGet_Object, fPut_Object,
}
