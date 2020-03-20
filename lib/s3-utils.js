const assert = require('assert');
const s3 = require('s3-client');

let client = null;

function connect() {
  var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
      accessKeyId: "ID01M05FP8QHB0SMKT0G",
      secretAccessKey: "AXMv62ilg8swaEtP912MkcXAdMyIsBeKRudvKXfF",
  //    region: "your region",
      endpoint: 'us-east-1.linodeobjects.com',
      // sslEnabled: false
      // any other options are passed to new AWS.S3()
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    },
  });

  return client;
}

client = connect();


async function download_file({bucket, s3key, localFile}) {
  return new Promise((resolve,reject)=>{
    var params = {
      s3Params: {
        Bucket: bucket,
        Key: s3key,
        // other options supported by getObject
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
      },
      localFile
    };

    var downloader = client.downloadFile(params);
    downloader.on('error', function(err) {
      console.error("unable to download:", err.stack);
      reject(err)
    });
    downloader.on('progress', function() {
      console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    downloader.on('end', function() {
      console.log("done downloading");
      resolve({size:downloader.progressTotal})
    });
  })
} // get_file


async function get_Object({bucket, s3key}) {
  return new Promise((resolve,reject)=>{

    var params = {
        Bucket: bucket,
        Key: s3key,
    };

    var downloader = client.downloadBuffer(params);
    downloader.on('error', function(err) {
      console.error("unable to download:", err.stack);
      reject(err)
    });
    downloader.on('progress', function() {
      console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    downloader.on('end', function(buf) {
      console.log("done getting Object");
//      console.log({downloader})
//      console.log(`buf:`,buf.toString())
      resolve({size:downloader.progressTotal, data: buf.toString()})
    });
  })
} // get_Object


async function list_Objects({bucket, s3key, recursive=false}) {
  assert(bucket)

  return new Promise((resolve,reject)=>{
    /*
    var params = {
        Bucket: bucket,
        Key: s3key,
        recursive
    };*/

    var params = {
      s3Params: {
        Bucket: bucket,
    //    Key: s3key,
        Delimiter: '/',
        Prefix: s3key,
        // other options supported by getObject
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
        // Marker, Prefix
      },
      recursive

    };
    var downloader = client.listObjects(params);
    downloader.on('error', function(err) {
      console.error("unable to download:", err.stack);
      reject(err)
    });
    downloader.on('progress', function() {
      console.log("progress", downloader.progressAmount, downloader.progressTotal, downloader.dirsFound);
    });
    downloader.on('data', function(data) {
    //  console.log("--data: ", data.Contents);
      console.log("--data: ", data.Contents.length);
      data.Contents.forEach((it,j)=>{
        console.log(`--(${j})--`,it)
      })
    });
    downloader.on('end', function(buf) {
      console.log("done getting listObjects");
      console.log("progress", downloader.progressAmount, downloader.progressTotal, downloader.dirsFound);
//      console.log({downloader})
      console.log(`buf:`,buf);
      resolve({size:downloader.progressTotal})
    });
  })
} // get_Object




module.exports = {
  connect,
  download_file,
  get_Object,
  list_Objects
}
