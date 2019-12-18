const AWS = require("aws-sdk");
const gm = require("gm").subClass({ imageMagick: true });
const async = require("async");

const s3 = new AWS.S3();

//Constants
const MAX_WIDTH = 175;
const MAX_HEIGHT = 123;

exports.handler = async (event, context) => {
  console.log("Intercepted S3 upload, event: %j", event);

  const sourceBucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;

  const lastSlash = sourceKey.lastIndexOf("/");
  const fileName = sourceKey.substring(lastSlash);
  const destinationBucket = sourceBucket + "/subjectPictures-thumbnails/";
  const destinationKey = "public/subjectPictures-thumbnails" + fileName;

  const lastDot = fileName.lastIndexOf(".");
  const fileType = fileName.substring(lastDot);
  console.log("fileType: " + fileType);

  //Sanity check: ensure source and destination are different
  if (sourceBucket == destinationBucket) {
    const error = new Error("source and desitnation buckets were the same");
    throw error;
  }

  async.waterfall(
    [
      function downloadImage(callback) {
        s3.getObject({ Bucket: sourceBucket, Key: sourceKey }, callback);
      },
      function transform(response, callback) {
        gm(response.body).size((error, size) => {
          console.log("Size of image: " + size);

          const scalingFactor = Math.min(
            MAX_HEIGHT / size.height,
            MAX_WIDTH / size.width
          );
          const width = scalingFactor * size.width;
          const height = scalingFactor * size.height;

          console.log(
            "Scaling factor: %j",
            scalingFactor,
            " width: %j",
            width,
            " height: %j",
            height
          );

          this.resize(width, height).toBuffer(fileType, (error, buffer) => {
            console.log("resized image, now buffering...");
            if (error) {
              callback(error);
            } else {
              callback(null, response.ContentType, buffer);
            }
          });
        });
      },
      function upload(contentType, data, callback) {
        console.log("uploading to S3...");
        s3.putObject(
          {
            Bucket: destinationBucket,
            Key: destinationKey,
            Body: data,
            ContentType: contentType
          },
          callback
        );
      }
    ],
    function(err) {
      if (err) {
        console.log("Error in waterfall: " + error);
      } else {
        console.log("Successfully created thumbnail");
      }
      callback(null, message);
    }
  );
};
