import XLSX from 'xlsx';

const filePath = './OU-Site.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Header:", jsonData[0]);
console.log("First 20 rows of data:");
jsonData.slice(1, 21).forEach((row, i) => {
    // Column J is index 9
    const otherImpacts = row[9];
    if (otherImpacts) {
        console.log(`Row ${i + 2}:`, otherImpacts);
    }
});
