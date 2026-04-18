import https from 'https';
import fs from 'fs';

function downloadHtml() {
  const url = 'https://docs.google.com/spreadsheets/d/1WSJZviTYSUXOsBLlTIMq-bJpeCQXdWQ8/export?format=html&gid=1626085521'; // try random gid if not zero, actually just export HTML without gid gives all sheets
  const htmlUrl = 'https://docs.google.com/spreadsheets/d/1WSJZviTYSUXOsBLlTIMq-bJpeCQXdWQ8/export?format=html';
  const file = fs.createWriteStream("spreadsheet.html");
  https.get(htmlUrl, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
       https.get(res.headers.location, (res2) => {
           res2.pipe(file);
           file.on('finish', () => {
             console.log('Saved spreadsheet.html');
             file.close();
           });
       });
    } else {
        res.pipe(file);
        file.on('finish', () => {
          console.log('Saved spreadsheet.html');
          file.close();
        });
    }
  }).on('error', (err) => {
    console.error(err.message);
  });
}

downloadHtml();
