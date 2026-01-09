const fs = require('fs');
const path = require('path');

// Read the backup file
const backupPath = path.join(__dirname, 'views', 'individualUser', 'dashboard.ejs.bak');
let content = fs.readFileSync(backupPath, 'utf8');

console.log('Original file size:', content.length);

// Fix ALL multi-line EJS tags
// Fix 1: "over budget" string
content = content.replace(/<%=\s*remaining\s*>=\s*0\s*\?\s*'remaining'\s*:\s*'over\s+budget'\s*%>/gs,
    "<%= remaining >= 0 ? 'remaining' : 'over budget' %>");

// Fix 2: Daily expenses amount
content = content.replace(/Ksh\s*<%=\s*data\.dailyExpenses\s*\?\s+data\.dailyExpenses\.toFixed\(2\)\s*:\s*'0\.00'\s*%>/gs,
    "Ksh <%= data.dailyExpenses ? data.dailyExpenses.toFixed(2) : '0.00' %>");

// Fix 3: Monthly expenses amount  
content = content.replace(/Ksh\s*<%=\s*data\.totalExpenses\s*\?\s+data\.totalExpenses\.toFixed\(2\)\s*:\s*'0\.00'\s*%>/gs,
    "Ksh <%= data.totalExpenses ? data.totalExpenses.toFixed(2) : '0.00' %>");

// Fix 4: Any remaining multi-line date formatting
content = content.replace(/<%=\s*new\s+Date\([^)]+\)\.toLocaleDateString\([^)]+\)\s*%>/gs, (match) => {
    return match.replace(/\s+/g, ' ');
});

// Fix 5: Any remaining multi-line toFixed calls
content = content.replace(/<%=\s*[^%]+\.toFixed\([^)]+\)\s*%>/gs, (match) => {
    return match.replace(/\s+/g, ' ');
});

console.log('Fixed file size:', content.length);

// Write the clean file
const outputPath = path.join(__dirname, 'views', 'individualUser', 'dashboard.ejs');
fs.writeFileSync(outputPath, content, 'utf8');

console.log('✅ Created clean dashboard.ejs file');
console.log('Checking for remaining multi-line issues...');

// Verify no split strings remain
const hasIssues = content.match(/'[^']*\n[^']*'/g);
if (hasIssues) {
    console.log('⚠️ WARNING: Found potential multi-line strings:', hasIssues.length);
    hasIssues.forEach((issue, i) => console.log(`  ${i + 1}:`, issue.substring(0, 50)));
} else {
    console.log('✅ No multi-line string issues found');
}
