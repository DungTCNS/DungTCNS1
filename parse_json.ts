import fs from 'fs';

let data = fs.readFileSync('sheet2.json', 'utf8');
data = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1);
const obj = JSON.parse(data);

const columns = obj.table.cols.map(c => c ? c.label : null);

const records = obj.table.rows.map(row => {
  const record: any = {};
  row.c.forEach((cell, idx) => {
    if (columns[idx]) {
      // Use formatted value if available, else raw value
      record[columns[idx]] = cell ? (cell.f ? cell.f : cell.v) : null;
    }
  });
  return record;
});

// Write as JSON to src directory
fs.writeFileSync('src/data.json', JSON.stringify(records.filter(r => r['MSNV']), null, 2));
console.log('Formatted JSON exported');
