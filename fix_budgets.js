const fs = require('fs');
const path = require('path');

// Read the budgets list file
const filePath = path.join(__dirname, 'views', 'individualUser', 'budgets', 'list.ejs');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);

// Fix ALL multi-line EJS tags
// Fix 1: "over budget" string (same as dashboard)
content = content.replace(/<%=\s*remaining\s*>=\s*0\s*\?\s*'remaining'\s*:\s*'over\s+budget'\s*%>/gs,
    "<%= remaining >= 0 ? 'remaining' : 'over budget' %>");

// Fix 2: Any multi-line toFixed calls
content = content.replace(/<%=\s*([^%]+)\n\s*\.toFixed\(([^)]+)\)\s*%>/gs,
    "<%= $1.toFixed($2) %>");

// Fix 3: Any multi-line date formatting
content = content.replace(/<%=\s*new\s+Date\(([^)]+)\)\.toLocaleDateString\(([^)]+)\)\s*%>/gs, (match) => {
    return match.replace(/\s+/g, ' ');
});

// Fix 4: Any multi-line ternary operators with split strings
content = content.replace(/<%=\s*([^?]+)\?\s*\n\s*([^:]+):\s*\n\s*([^%]+)%>/gs,
    "<%= $1 ? $2 : $3 %>");

// Fix 5: General cleanup - remove excessive whitespace in EJS tags
content = content.replace(/<%=\s+/g, '<%= ');
content = content.replace(/\s+%>/g, ' %>');

console.log('Fixed file size:', content.length);

// Write the clean file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed budgets/list.ejs file');
console.log('Verifying no multi-line string issues remain...');

// Verify no split strings remain
const hasIssues = content.match(/'[^']*\n[^']*'/g);
if (hasIssues) {
    console.log('⚠️ WARNING: Found potential multi-line strings:', hasIssues.length);
    hasIssues.slice(0, 5).forEach((issue, i) => console.log(`  ${i + 1}:`, issue.substring(0, 60).replace(/\n/g, '↵')));
} else {
    console.log('✅ No multi-line string issues found');
}
