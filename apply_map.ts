import fs from 'fs';

const sheet2jsonStr = fs.readFileSync('sheet2.json', 'utf8');
const sheet2jsonData = sheet2jsonStr.substring(sheet2jsonStr.indexOf('{'), sheet2jsonStr.lastIndexOf('}') + 1);
const obj = JSON.parse(sheet2jsonData);
const rowMap = JSON.parse(fs.readFileSync('row_map.json', 'utf8'));

console.log('JSON Rows:', obj.table.rows.slice(0, 3).map((r: any) => r.c[1]?.v));

// We know obj.table.rows[0] is Header.
// obj.table.rows[1] is Duc.
// In rowMap, Excel Row 4 has image41.jpeg!
// So: ExcelRow = indexInJson + 3 !!

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));
data.forEach((emp: any) => {
    const rIdx = obj.table.rows.findIndex((r: any) => r.c[1] && r.c[1].v === emp.MSNV);
    if (rIdx !== -1) {
        const excelRow = rIdx + 3;
        if (rowMap[excelRow]) {
            emp.ImageFileName = rowMap[excelRow];
        }
    }
});
fs.writeFileSync('src/data.json', JSON.stringify(data, null, 2));

const withImg = data.filter((d: any) => d.ImageFileName);
console.log('Total data:', data.length);
console.log('Mapped images:', withImg.length);
