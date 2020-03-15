#!/usr/bin/env node

var s3 = require('s3');

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

console.log(client)

const x = s3.getPublicUrl('jpci-assets', 'index.html')
console.log(`public-url:`,x)

const v = client.listObjects({
  s3Params: {
    Bucket: "jpci-assets",
//    Key: "",
    // other options supported by getObject
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
  }
})
v.on('progress', function() {
  console.log("progress", v.progressAmount, v.progressTotal);
});



console.log({v})

return;

var params = {
  localFile: "./index2.html",

  s3Params: {
    Bucket: "jpci-assets",
    Key: "index.html",
    // other options supported by getObject
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
  },
};
var downloader = client.downloadFile(params);
downloader.on('error', function(err) {
  console.error("unable to download:", err.stack);
});
downloader.on('progress', function() {
  console.log("progress", downloader.progressAmount, downloader.progressTotal);
});
downloader.on('end', function() {
  console.log("done downloading");
});
