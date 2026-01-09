const fs = require('fs');
const path = require('path');

// Read the dashboard file
const filePath = path.join(__dirname, 'views', 'individualUser', 'dashboard.ejs');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the multi-line "over budget" string
// Pattern matches the EJS tag with 'over' and 'budget' split across lines
const pattern = /<%=\s+remaining\s*>=\s*0\s*\?\s*'remaining'\s*:\s*'over\s+budget'\s*%>/gs;
const replacement = "<%= remaining >= 0 ? 'remaining' : 'over budget' %>";

content = content.replace(pattern, replacement);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log("Fixed 'over budget' multi-line EJS tag");
