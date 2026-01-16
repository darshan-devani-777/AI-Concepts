const writeTempAndConvert = require("./writeTempAndConvert");

exports.pptToPdf = async (file) => {
  return writeTempAndConvert(file);
};
