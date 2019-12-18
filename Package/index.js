const AWS = require("aws-sdk");
const gm = require("gm").subClass({ imageMagick: true });

const s3 = new AWS.S3();

//Constants
const MAX_WIDTH = 175;
const MAX_HEIGHT = 123;

exports.handler = async (event, context) => {
  console.log("Intercepted S3 upload, event: %j", event);

  const sourceBucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;
  const destinationBucket = "thumbnails" + sourceBucket;
  const destinationKey = destinationBucket + sourceKey;

  //Sanity check: ensure source and destination are different
  if (sourceBucket == destinationBucket) {
    const error = new Error("source and desitnation buckets were the same");
    throw error;
  }

  try {
    const uploadedImage = await s3
      .getObject({ Bucket: sourceBucket, key: sourceKey })
      .promise();
    const image = gm(uploadedImage.body);
    const imageSize = gm(image).size();
    console.log("Current image size: %j", imageSize);

    const scalingFactor = Math.min(
      MAX_HEIGHT / imageSize.height,
      MAX_WIDTH / imageSize.width
    );
    const width = scalingFactor * imageSize.width;
    const height = scalingFactor * imageSize.height;

    const resizedImage = gm(image).resize(width, height);
    const imageBuffer = gm(resizedImage).toBuffer;
    // const thumbnailImage = await s3.putObject({
    //   Bucket: destinationBucket,
    //   Key: destinationKey,
    //   Body: imageBuffer
    // });
    console.log("Successfully converted image to thumbnail!");
    return "Success!";
  } catch (error) {
    console.log("ERROR!: %j", error);
    throw error;
  }
};
