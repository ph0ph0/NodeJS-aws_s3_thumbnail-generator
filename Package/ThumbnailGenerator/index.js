const { getScaledWidthAndHeight, transform } = require("../Utils");

const THUMBNAIL_MAX_WIDTH = 175;
const THUMBNAIL_MAX_HEIGHT = 123;

module.exports.thumbnailGenerator = async image => {
  try {
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

    return thumbnailImage;
  } catch (error) {
    throw error;
  }
};
