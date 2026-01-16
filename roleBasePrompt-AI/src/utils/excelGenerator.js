const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

async function generateExcel(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data");

  sheet.columns = Object.keys(rows[0]).map(key => ({
    header: key,
    key,
    width: 25,
  }));

  rows.forEach(row => sheet.addRow(row));

  const dirPath = path.join(__dirname, "../../uploads/xlsx");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `AI_XLS_${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

module.exports = { generateExcel };
