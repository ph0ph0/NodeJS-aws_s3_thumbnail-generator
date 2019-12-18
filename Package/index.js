const AWS = require("aws-sdk");
const sharp = require("sharp");

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

  //Sanity check: ensure source and destination are different
  if (sourceBucket == destinationBucket) {
    const error = new Error("source and desitnation buckets were the same");
    throw error;
  }

  try {
    const uploadedImage = await s3
      .getObject({ Bucket: sourceBucket, Key: sourceKey })
      .promise();

    // console.log("Uploaded image body: " + uploadedImage);

    sharp(uploadedImage.Body)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "contain"
      })
      .toBuffer()
      .then(data => {
        s3.putObject({
          Bucket: destinationBucket,
          Key: destinationKey,
          Body: data
        });
      })
      .then(() => {
        console.log("Success!");
      });

    // const imageSize = await gm(uploadedImage.body).size((error, size) => {
    //   console.log("width: " + size.width + " height: " + size.height);
    //   const scalingFactor = Math.min(
    //     MAX_HEIGHT / size.height,
    //     MAX_WIDTH / size.width
    //   );
    //   const width = scalingFactor * size.width;
    //   const height = scalingFactor * size.height;

    //   console.log(
    //     "Scaling factor: %j",
    //     scalingFactor,
    //     " width: %j",
    //     width,
    //     " height: %j",
    //     height
    //   );
    //   return width;
    // });
    // console.log("imageSize: %j", +imageSize);

    // const imageBuffer = gm(resizedImage).toBuffer;
    // const thumbnailImage = await s3.putObject({
    //   Bucket: destinationBucket,
    //   Key: destinationKey,
    //   Body: imageBuffer
    // });
    // console.log("Successfully wrote image, path: %j", thumbnailImage);
    // return thumbnailImage;
  } catch (error) {
    console.log("ERROR!: " + error);
    throw error;
  }
};
