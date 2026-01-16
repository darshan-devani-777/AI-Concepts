const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const LIBREOFFICE_BIN =
  process.platform === "darwin"
    ? "/Applications/LibreOffice.app/Contents/MacOS/soffice"
    : "libreoffice";

module.exports = function officeToPdf(inputPath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "../../uploads/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const ext = path.extname(inputPath).toLowerCase();

    let filter = "writer_pdf_Export";
    let filterOptions = "";

    if (ext === ".ppt" || ext === ".pptx") {
      filter = "impress_pdf_Export";
    }

    if (ext === ".xls" || ext === ".xlsx") {
      filter = "calc_pdf_Export";
      filterOptions = ':{"ScaleToPagesX":1}';
    }

    const cmd = `"${LIBREOFFICE_BIN}" --headless --nologo --nofirststartwizard \
--convert-to "pdf:${filter}${filterOptions}" \
"${inputPath}" \
--outdir "${outputDir}"`;

    exec(cmd, (err) => {
      if (err) return reject(err);

      const pdfName =
        path.basename(inputPath, path.extname(inputPath)) + ".pdf";

      resolve(path.join(outputDir, pdfName));
    });
  });
};
