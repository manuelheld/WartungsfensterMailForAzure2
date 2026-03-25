const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('test.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];

console.dir(sheet['A2'], {depth: null});
console.dir(sheet['B2'], {depth: null});
