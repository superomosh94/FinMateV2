const fs = require('fs');
const path = require('path');

// Read the budgets list file
const filePath = path.join(__dirname, 'views', 'individualUser', 'budgets', 'list.ejs');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Searching for multi-line EJS tags in budgets/list.ejs...\n');

// Search for common patterns that cause syntax errors
const patterns = [
    { name: "'over budget' split string", regex: /'over\s+budget'/g },
    { name: "Multi-line toFixed calls", regex: /<%=\s*[^%]+\n[^%]*toFixed/g },
    { name: "Multi-line date formatting", regex: /<%=\s*new\s+Date[^%]*\n[^%]*%>/g },
    { name: "Multi-line ternary operators", regex: /<%=\s*[^%]*\?\s*\n[^%]*:/g },
];

let foundIssues = false;

patterns.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
        console.log(`✗ Found ${matches.length} instance(s) of: ${pattern.name}`);
        matches.forEach((match, i) => {
            console.log(`  ${i + 1}. ${match.substring(0, 80).replace(/\n/g, '↵')}`);
        });
        foundIssues = true;
    }
});

if (!foundIssues) {
    console.log('✓ No obvious multi-line EJS issues found');
    console.log('\nSearching for any <%= tags that span multiple lines...');

    // More general search
    const lines = content.split('\n');
    let inTag = false;
    let tagStart = -1;

    lines.forEach((line, i) => {
        if (line.includes('<%=') && !line.includes('%>')) {
            inTag = true;
            tagStart = i + 1;
        } else if (inTag && line.includes('%>')) {
            console.log(`  Lines ${tagStart}-${i + 1}: Multi-line <%= tag found`);
            inTag = false;
        }
    });
}
