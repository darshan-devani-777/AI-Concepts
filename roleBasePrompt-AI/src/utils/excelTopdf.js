const writeTempAndConvert = require("./writeTempAndConvert");

exports.excelToPdf = async (file) => {
  return writeTempAndConvert(file);
};
