const AWS = require("aws-sdk");
const gm = require("gm").subClass({ imageMagick: true });

const s3 = new AWS.S3();

//Constants
const MAX_WIDTH = 175;
const MAX_HEIGHT = 123;

exports.handler = (event, context) => {};
