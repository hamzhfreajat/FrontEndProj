import os
import re
import glob

pages_dir = r"D:\open\classifieds-app\dashboard-frontend\src\pages"

# Pattern matches <h1>...</h1> followed optionally by <p>...</p>
pattern = re.compile(r'<h1[^>]*>[\s\S]*?</h1>\s*(?:<p[^>]*>[\s\S]*?</p>\s*)?')

# Pattern to clean up empty header divs left behind
empty_header_pattern1 = re.compile(r'<div className="page-header">\s*</div>')
empty_header_pattern2 = re.compile(r'<div className="inbox-header">\s*</div>')
empty_header_pattern3 = re.compile(r'<div className="dashboard-header">\s*</div>')
empty_header_pattern4 = re.compile(r'<div className="header-section">\s*</div>')

for filepath in glob.glob(os.path.join(pages_dir, "*.js*")):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub('', content)
    new_content = empty_header_pattern1.sub('', new_content)
    new_content = empty_header_pattern2.sub('', new_content)
    new_content = empty_header_pattern3.sub('', new_content)
    new_content = empty_header_pattern4.sub('', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Modified {os.path.basename(filepath)}")

