import os
import re
import glob

css_files = glob.glob(r"D:\open\classifieds-app\dashboard-frontend\src\pages\*.css")

for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace common large paddings
    new_content = content.replace('padding: 24px;', 'padding: 16px;')
    new_content = new_content.replace('padding: 20px 24px;', 'padding: 12px 16px;')
    new_content = new_content.replace('padding: 16px 24px;', 'padding: 12px 16px;')
    new_content = new_content.replace('padding: 32px;', 'padding: 16px;')
    
    # Table specific
    new_content = new_content.replace('padding: 16px;', 'padding: 12px;')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Compacted {os.path.basename(filepath)}")
