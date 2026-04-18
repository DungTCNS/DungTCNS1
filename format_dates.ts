import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

data.forEach((emp: any) => {
    // format date fields dynamically
    const dateFields = ["Ngày, tháng, năm sinh", "Ngày vào Ngành điện", "Năm vào đảng"];
    
    dateFields.forEach(field => {
        if (emp[field]) {
            let val = emp[field];
            // if it's ISO string
            if (val.includes('T')) {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    emp[field] = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
                }
            } else if (val.includes('/')) {
                // assume it might be M/D/YYYY from sheet value
                // In Google Sheets CSV, it often comes out as M/D/YYYY if locale is US.
                // E.g. "12/11/1972" -> could be Dec 11 or Nov 12. 
                // Let's check a clear one in data if we have "5/16/1973"
                // Yes! "5/16/1973" is in the data, which means month is first!
                const parts = val.split(/[\/\-]/);
                if (parts.length === 3) {
                    let m = parseInt(parts[0]);
                    let d = parseInt(parts[1]);
                    let y = parseInt(parts[2]);
                    
                    if (y < 100) y += 1900; // Just in case
                    emp[field] = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
                }
            }
        }
    });

    // Make sure we have the correct image
    // The previous mapping logic was applied, but let's make sure it's accurate.
});

fs.writeFileSync('src/data.json', JSON.stringify(data, null, 2));
console.log('Finished updating dates in data.json');
