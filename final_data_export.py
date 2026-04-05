import re
import os

def parse_sql_dump(file_path):
    tables = {}
    current_table = None
    columns = []
    
    # We'll use a simple state machine to find INSERT INTO ... VALUES (...)
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
        
    # Find all INSERT statements
    # Pattern: INSERT INTO `table` (`col1`, `col2`) VALUES (val1, val2), (val3, val4);
    # Some values might span multiple lines.
    insert_pattern = re.compile(r"INSERT INTO `(\w+)` \((.*?)\) VALUES\s*(.*?);", re.DOTALL)
    
    for match in insert_pattern.finditer(content):
        table_name = match.group(1)
        cols = [c.strip(" `") for c in match.group(2).split(",")]
        values_block = match.group(3)
        
        if table_name not in tables:
            tables[table_name] = {'cols': cols, 'rows': []}
            
        # Parse the values block: (v1, v2, ...), (v3, v4, ...)
        # This is tricky because of strings containing commas and parentheses.
        # We can use a simple scanner.
        rows = []
        current_row = []
        current_val = ""
        in_string = False
        in_row = False
        i = 0
        while i < len(values_block):
            char = values_block[i]
            if char == "'" and (i == 0 or values_block[i-1] != "\\"):
                in_string = not in_string
                current_val += char
            elif not in_string:
                if char == "(":
                    in_row = True
                    current_row = []
                elif char == ")":
                    if in_row:
                        current_row.append(current_val.strip())
                        rows.append(current_row)
                        current_val = ""
                        in_row = False
                elif char == ",":
                    if in_row:
                        current_row.append(current_val.strip())
                        current_val = ""
                else:
                    current_val += char
            else:
                current_val += char
            i += 1
            
        # Clean values (strip quotes)
        cleaned_rows = []
        for r in rows:
            cleaned_row = []
            for v in r:
                if v.startswith("'") and v.endswith("'"):
                    v = v[1:-1].replace("\\'", "'").replace("\\\\", "\\")
                elif v.upper() == "NULL":
                    v = None
                cleaned_row.append(v)
            cleaned_rows.append(cleaned_row)
            
        tables[table_name]['rows'].extend(cleaned_rows)
        
    return tables

def get_data44():
    sql_file = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/u430492535_2ndriun (1).sql"
    print(f"Parsing {sql_file}...")
    tables = parse_sql_dump(sql_file)
    
    if not tables:
        print("No tables found!")
        return

    # Extract mapping
    # categories: id, parent_id
    # services: id, category_id
    # translations: translationable_type, translationable_id, name
    # variations: service_id, name, default_price
    
    # 1. Names from translations
    translations = tables.get('translations', {'rows': []})
    names = {} # (type, id) -> name
    # translations cols: ['id', 'translationable_type', 'translationable_id', 'locale', 'name', ...]
    cols = tables['translations']['cols']
    type_idx = cols.index('translationable_type')
    id_idx = cols.index('translationable_id')
    name_idx = cols.index('name')
    
    for r in translations['rows']:
        ttype = r[type_idx].replace("\\\\", "\\")
        tid = r[id_idx]
        tname = r[name_idx]
        names[(ttype, tid)] = tname

    # 2. Categories
    categories = tables.get('categories', {'rows': []})
    cat_list = {}
    cols = tables['categories']['cols']
    id_idx = cols.index('id')
    pid_idx = cols.index('parent_id')
    
    for r in categories['rows']:
        cid = r[id_idx]
        pid = r[pid_idx]
        name = names.get(('App\\Models\\Category', cid), f"Category {cid}")
        cat_list[cid] = {'name': name, 'pid': pid, 'subcats': [], 'services': []}

    # 3. Services
    services = tables.get('services', {'rows': []})
    svc_list = {}
    cols = tables['services']['cols']
    id_idx = cols.index('id')
    cat_idx = cols.index('category_id')
    
    for r in services['rows']:
        sid = r[id_idx]
        cid = r[cat_idx]
        name = names.get(('App\\Models\\Service', sid), f"Service {sid}")
        svc_list[sid] = {'name': name, 'variants': []}
        if cid in cat_list:
            cat_list[cid]['services'].append(sid)

    # 4. Variations
    variations = tables.get('variations', {'rows': []})
    cols = tables['variations']['cols']
    svc_id_idx = cols.index('service_id')
    name_idx = cols.index('name')
    price_idx = cols.index('default_price')
    
    for r in variations['rows']:
        sid = r[svc_id_idx]
        vname = r[name_idx]
        vprice = r[price_idx]
        if sid in svc_list:
            svc_list[sid]['variants'].append({'name': vname, 'price': vprice})

    # Build hierarchy
    roots = []
    for cid, c in cat_list.items():
        pid = c['pid']
        if pid == '0' or pid not in cat_list:
            roots.append(cid)
        else:
            cat_list[pid]['subcats'].append(cid)

    # Format output
    md = ["# FULL DATA EXPORT (Source: Legacy SQL Dump)\n"]
    
    for rcid in sorted(roots):
        root = cat_list[rcid]
        md.append(f"## {root['name']}")
        
        # Subcategories
        for scid in sorted(root['subcats']):
            sub = cat_list[scid]
            md.append(f"### Subcategory: {sub['name']}")
            
            # Services in this subcategory
            for sid in sorted(sub['services']):
                svc = svc_list[sid]
                md.append(f"#### Service: {svc['name']}")
                if svc['variants']:
                    md.append("| Package Name | Price |")
                    md.append("| :--- | :--- |")
                    for v in svc['variants']:
                        md.append(f"| {v['name']} | {v['price']} |")
                md.append("")
        
        # Direct services in root category
        for sid in sorted(root['services']):
            svc = svc_list[sid]
            md.append(f"### Direct Service: {svc['name']}")
            if svc['variants']:
                md.append("| Package Name | Price |")
                md.append("| :--- | :--- |")
                for v in svc['variants']:
                    md.append(f"| {v['name']} | {v['price']} |")
            md.append("")
            
        md.append("---\n")

    output_path = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/data44.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"File created successfully at {output_path}")

if __name__ == "__main__":
    get_data44()
