const AWS = require("aws-sdk");
const sharp = require("sharp");
const s3 = new AWS.S3();

const getSize = image => {
  return new Promise((resolve, reject) => {
    console.log("getting size...");
    sharp(image).toBuffer((err, data, info) => {
      if (err) reject(err);
      else resolve(info);
    });
  });
};

module.exports.getScaledWidthAndHeight = async (
  image,
  max_width,
  max_height
) => {
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

module.exports.transform = async (image, width, height) => {
  return await sharp(image)
    .resize(width, height, {
      fit: "contain"
    })
    .toBuffer();
};

module.exports.eventDetails = event => {
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

  return {
    sourceBucket: sourceBucket,
    sourceKey: sourceKey,
    destinationBucket: destinationBucket,
    thumbnailDestinationKey: thumbnailDestinationKey,
    detailImageDestinationKey: detailImageDestinationKey
  };
};

module.exports.downloadImage = async (key, bucket) => {
  console.log("Downloading image: " + key);
  try {
    const uploadedImage = await s3
      .getObject({ Bucket: bucket, Key: key })
      .promise();
    const image = uploadedImage.Body;

    console.log("Downloaded image!");
    return image;
  } catch (error) {
    throw error;
  }
};

module.exports.uploadImage = async (
  image,
  destinationKey,
  destinationBucket
) => {
  try {
    console.log("Uploading image: " + destinationKey);
    await s3
      .putObject({
        Bucket: destinationBucket,
        Key: destinationKey,
        Body: image
      })
      .promise();

    console.log("Uploaded image!");
    return;
  } catch {
    throw error;
  }
};
