import fs from 'fs';
import fetch from 'node-fetch';

async function download() {
    console.log('Downloading...');
    const res = await fetch('https://docs.google.com/spreadsheets/d/1WSJZviTYSUXOsBLlTIMq-bJpeCQXdWQ8/export?format=xlsx');
    const buffer = await res.buffer();
    fs.writeFileSync('spreadsheet_downloaded.xlsx', buffer);
    console.log('Downloaded spreadsheet_downloaded.xlsx', buffer.length, 'bytes');
}
download();
