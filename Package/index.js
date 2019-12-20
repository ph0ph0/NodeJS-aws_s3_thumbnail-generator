const { thumbnailGenerator } = require("./ThumbnailGenerator");
const { detailImageGenerator } = require("./DetailImageGenerator");
const { eventDetails, downloadImage, uploadImage } = require("./Utils");

exports.handler = async event => {
  console.log("Intercepted S3 upload, event: %j", event);

  const {
    sourceBucket,
    sourceKey,
    destinationBucket,
    thumbnailDestinationKey,
    detailImageDestinationKey
  } = eventDetails(event);

  try {
    //Download the newly added image from storage
    console.log("Processing images");

    const image = await downloadImage(sourceKey, sourceBucket);

    const thumbnailImage = await thumbnailGenerator(image);

    await uploadImage(
      thumbnailImage,
      thumbnailDestinationKey,
      destinationBucket
    );

    const detailImage = await detailImageGenerator(image);

    await uploadImage(
      detailImage,
      detailImageDestinationKey,
      destinationBucket
    );

    console.log("DONE ALL!");
    return;
  } catch (error) {
    console.log("ERROR!: " + error);
    throw error;
  }
};
