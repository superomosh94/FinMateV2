import re

# Read the dashboard file
with open(r'c:\Users\ADMIN\Documents\prooooojects\FinMateV2\views\individualUser\dashboard.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the multi-line "over budget" string
# Pattern matches the EJS tag with 'over' and 'budget' split across lines
pattern = r"<%=\s+remaining\s*>=\s*0\s*\?\s*'remaining'\s*:\s*'over\s+budget'\s*%>"
replacement = "<%= remaining >= 0 ? 'remaining' : 'over budget' %>"

content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# Write back
with open(r'c:\Users\ADMIN\Documents\prooooojects\FinMateV2\views\individualUser\dashboard.ejs', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed 'over budget' multi-line EJS tag")
