const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

//Constants
const THUMBNAIL_MAX_WIDTH = 175;
const THUMBNAIL_MAX_HEIGHT = 123;
const DETAIL_MAX_WIDTH = 670;
const DETAIL_MAX_HEIGHT = 460;

exports.handler = async (event, context) => {
  console.log("Intercepted S3 upload, event: %j", event);

  const sourceBucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;
  const lastSlash = sourceKey.lastIndexOf("/");
  const fileName = sourceKey.substring(lastSlash + 1);
  const destinationBucket = sourceBucket;
  const thumbnailDestinationKey =
    "public/subjectPictures-thumbnails_175x123/" + fileName;
  const detailImageDestinationKey =
    "public/subjectPictures-detailImages_670x460/" + fileName;

  //Prevent Recursion: Ensure lambda only triggered on initial upload
  if (sourceKey.includes("thumbnails")) {
    const error = new Error("Preventing recursion on uploaded thumbnail");
    context.done(error, null);
    throw error;
  }

  try {
    console.log("Processing images");
    const uploadedImage = await s3
      .getObject({ Bucket: sourceBucket, Key: sourceKey })
      .promise();
    const image = uploadedImage.Body;

    //Get scaled thumbnail width and height
    console.log("Getting scaled thumbnail width and height");
    const thumbnailScaledDimensions = await getScaledWidthAndHeight(
      image,
      THUMBNAIL_MAX_WIDTH,
      THUMBNAIL_MAX_HEIGHT
    );

    //Create buffer of thumbnailImage
    console.log("Creating buffer of thumbnailImage");
    const thumbnailImage = await transform(
      image,
      thumbnailScaledDimensions.width,
      thumbnailScaledDimensions.height
    );

    console.log("Uploading thumbnail");
    await s3
      .putObject({
        Bucket: destinationBucket,
        Key: thumbnailDestinationKey,
        Body: thumbnailImage
      })
      .promise();

    //Get scaled detailImage width and height
    console.log("Getting scaled detailImage width and height");
    const detailImageScaledDimensions = await getScaledWidthAndHeight(
      image,
      DETAIL_MAX_WIDTH,
      DETAIL_MAX_HEIGHT
    );

    //Create buffer of detailImage
    console.log("Creating buffer of detailImage");
    const detailImage = await transform(
      image,
      detailImageScaledDimensions.width,
      detailImageScaledDimensions.height
    );

    //Upload detailImage
    console.log("Uploading detail image");
    await s3
      .putObject({
        Bucket: destinationBucket,
        Key: detailImageDestinationKey,
        Body: detailImage
      })
      .promise();

    console.log("DONE!");
    return;
  } catch (error) {
    console.log("ERROR!: " + error);
    throw error;
  }
};

const getSize = image => {
  return new Promise((resolve, reject) => {
    console.log("getting size...");
    sharp(image).toBuffer((err, data, info) => {
      if (err) reject(err);
      else resolve(info);
    });
  });
};

const getScaledWidthAndHeight = async (image, max_width, max_height) => {
  const imageSize = await getSize(image);
  console.log(
    "imageSize, width: " + imageSize.width + " height: " + imageSize.height
  );
  const scalingFactor = Math.min(
    max_width / imageSize.width,
    max_height / imageSize.height
  );
  console.log("scalingFactor: " + scalingFactor);

  const width = Math.round(scalingFactor * imageSize.width);
  const height = Math.round(scalingFactor * imageSize.height);
  console.log("scaledWidth: " + width + ", scaledHeight: " + height);

  return {
    width: width,
    height: height
  };
};

const transform = async (image, width, height) => {
  return await sharp(image)
    .resize(width, height, {
      fit: "contain"
    })
    .toBuffer();
};
