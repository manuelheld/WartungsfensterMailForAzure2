import * as XLSX from 'xlsx';
import * as fs from 'fs';

const fileData = fs.readFileSync('OU-Site.xlsx');
const wb = XLSX.read(fileData, { type: 'buffer' });
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

const mapping = {};

// skip header
data.slice(1).forEach((row) => {
    const div = row[0];
    const loc = row[1];

    if (div && loc) {
        if (!mapping[div]) {
            mapping[div] = [];
        }
        mapping[div].push(loc);
    }
});

fs.writeFileSync('src/data/ouSites.json', JSON.stringify(mapping, null, 2));
console.log('Successfully wrote src/data/ouSites.json');
