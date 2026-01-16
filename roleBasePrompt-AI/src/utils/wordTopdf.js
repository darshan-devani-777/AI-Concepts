const writeTempAndConvert = require("./writeTempAndConvert");

exports.wordToPdf = async (file) => {
  return writeTempAndConvert(file);
};
