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

    // console.log("Uploaded image body: " + uploadedImage);

    const imageToUpload = await sharp(uploadedImage.Body)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        // fit: "contain"
      })
      .toBuffer();

    console.log("Got imageToUpload");

    const thumbnailKey = await s3
      .putObject({
        Bucket: destinationBucket,
        Key: destinationKey,
        Body: imageToUpload
      })
      .promise();
    context.done(null, thumbnailKey);

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
    context.done(error, null);
    // throw error;
  }
};
