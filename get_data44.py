import re
import os

def extract_rows(file_path, table_name):
    rows = []
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
        # Find the INSERT INTO statement for the table
        pattern = rf"INSERT INTO `{table_name}` VALUES (.*?);"
        matches = re.finditer(pattern, content, re.DOTALL)
        for match in matches:
            values_str = match.group(1)
            # Split by ),( but be careful of quotes. 
            # A simpler way: find all (...) blocks
            row_matches = re.findall(r"\((.*?)\)(?:,|$)", values_str, re.DOTALL)
            for row_str in row_matches:
                # Split by comma but respect single quotes
                parts = []
                current = ""
                in_quote = False
                i = 0
                while i < len(row_str):
                    char = row_str[i]
                    if char == "'" and (i == 0 or row_str[i-1] != "\\"):
                        in_quote = not in_quote
                        current += char
                    elif char == "," and not in_quote:
                        parts.append(current.strip())
                        current = ""
                    else:
                        current += char
                    i += 1
                parts.append(current.strip())
                # Clean quotes
                cleaned = [p.strip("'") if p.startswith("'") and p.endswith("'") else p for p in parts]
                rows.append(cleaned)
    return rows

sql_file = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/u430492535_2ndriun (1).sql"

print("Parsing SQL file...")
categories_raw = extract_rows(sql_file, 'categories')
services_raw = extract_rows(sql_file, 'services')
translations_raw = extract_rows(sql_file, 'translations')
variations_raw = extract_rows(sql_file, 'variations')

# Map IDs to Names
names = {} # (type, id) -> name
for t in translations_raw:
    # translations: [id, translationable_type, translationable_id, locale, name, ...]
    # The structure might vary, let's look at it. 
    # Usually: [id, translationable_type, translationable_id, locale, name]
    # In this SQL: (1,'App\\Models\\Category','1','en','Camera','2023-10-18 11:29:43','2023-10-18 11:29:43')
    if len(t) >= 5:
        ttype = t[1].replace("\\\\", "\\")
        tid = t[2]
        tname = t[4]
        names[(ttype, tid)] = tname

# Build Categories
cats = {} # id -> {name, parent_id, subcats, services}
for c in categories_raw:
    cid = c[0]
    pid = c[1]
    name = names.get(('App\\Models\\Category', cid), f"Cat {cid}")
    cats[cid] = {'name': name, 'parent_id': pid, 'subcats': [], 'services': []}

# Build Services
svcs = {} # id -> {name, variants}
for s in services_raw:
    sid = s[0]
    cid = s[1]
    name = names.get(('App\\Models\\Service', sid), f"Service {sid}")
    svcs[sid] = {'name': name, 'variants': []}
    if cid in cats:
        cats[cid]['services'].append(sid)

# Add Variants
for v in variations_raw:
    # variations: [id, service_id, default_price, name, ...]
    sid = v[1]
    price = v[2]
    vname = v[3]
    if sid in svcs:
        svcs[sid]['variants'].append({'name': vname, 'price': price})

# Organize Hierarchy
roots = [cid for cid, c in cats.items() if c['parent_id'] == '0' or c['parent_id'] not in cats]
for cid, c in cats.items():
    pid = c['parent_id']
    if pid in cats and pid != '0':
        cats[pid]['subcats'].append(cid)

md = ["# Full Service Inventory (Source: Legacy SQL)\n"]

for rcid in roots:
    root = cats[rcid]
    md.append(f"## {root['name']}")
    
    # Direct services
    for sid in root['services']:
        s = svcs[sid]
        md.append(f"### Service: {s['name']}")
        if s['variants']:
            md.append("| Package Name | Price |")
            md.append("| :--- | :--- |")
            for var in s['variants']:
                md.append(f"| {var['name']} | {var['price']} |")
        md.append("")
        
    # Subcategories
    for scid in root['subcats']:
        sub = cats[scid]
        md.append(f"### Subcategory: {sub['name']}")
        for sid in sub['services']:
            s = svcs[sid]
            md.append(f"#### Service: {s['name']}")
            if s['variants']:
                md.append("| Package Name | Price |")
                md.append("| :--- | :--- |")
                for var in s['variants']:
                    md.append(f"| {var['name']} | {var['price']} |")
            else:
                md.append("*No packages*")
            md.append("")
    md.append("---\n")

output_path = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/data44.md"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(md))

print(f"Done! Created {output_path}")
