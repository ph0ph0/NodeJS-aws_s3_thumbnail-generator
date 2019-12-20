const { getScaledWidthAndHeight, transform } = require("../Utils");

const DETAIL_MAX_WIDTH = 670;
const DETAIL_MAX_HEIGHT = 460;

module.exports.detailImageGenerator = async image => {
  try {
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

    return detailImage;
  } catch (error) {
    throw error;
  }
};
