const AWS = require("aws-sdk");
const sharp = require("sharp");
const calipers = require("calipers")("png", "jpeg");

const s3 = new AWS.S3();

//Constants
const MAX_WIDTH = 175;
const MAX_HEIGHT = 123;

exports.handler = async (event, context) => {
  console.log("Intercepted S3 upload, event: %j", event);

  const sourceBucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;
  const lastSlash = sourceKey.lastIndexOf("/");
  const fileName = sourceKey.substring(lastSlash + 1);
  const destinationBucket = sourceBucket;
  const destinationKey = "public/subjectPictures-thumbnails/" + fileName;

  console.log(
    "Upload details, sourceBucket: " +
      sourceBucket +
      " sourceKey: " +
      sourceKey +
      " fileName: " +
      fileName +
      " destinationBucket: " +
      destinationBucket +
      " destinationKey " +
      destinationKey
  );

  //Prevent Recursion: Ensure lambda only triggered on initial upload
  if (sourceKey.includes("thumbnails")) {
    const error = new Error("Preventing recursion on uploaded thumbnail");
    context.done(error, null);
    throw error;
  }

  try {
    const uploadedImage = await s3
      .getObject({ Bucket: sourceBucket, Key: sourceKey })
      .promise();

    const imageSize = sizeOf(uploadedImage.Body);
    console.log(
      "Size, width: " + imageSize.width + " height: " + imageSize.height
    );

    const imageSize = sizeOf(uploadedImage.Body);
    console.log(
      "Size, width: " + imageSize.width + " height: " + imageSize.height
    );

    const imageToUpload = await sharp(uploadedImage.Body)
      .resize(MAX_WIDTH, MAX_HEIGHT)
      .toBuffer();

    console.log("Got imageToUpload");

    const thumbnailKey = await s3
      .putObject({
        Bucket: destinationBucket,
        Key: destinationKey,
        Body: imageToUpload
      })
      .promise();
    return thumbnailKey;
  } catch (error) {
    console.log("ERROR!: " + error);
    throw error;
  }
};
