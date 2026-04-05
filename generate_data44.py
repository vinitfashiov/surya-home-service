import re
from collections import defaultdict

def scan_sql(file_path):
    # Data containers
    data = defaultdict(list)
    cols = {}
    
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
        
    tables = ['categories', 'services', 'translations', 'variations']
    
    for table in tables:
        # 1. Find columns
        # Pattern: INSERT INTO `table` (`col1`, `col2`, ...) VALUES
        col_match = re.search(rf"INSERT INTO `{table}` \((.*?)\) VALUES", content, re.IGNORECASE)
        if col_match:
            cols[table] = [c.strip(" `") for c in col_match.group(1).split(",")]
            
        # 2. Extract Values using the balanced parenthesis scanner
        # Pattern: INSERT INTO `table` (...) VALUES (...), (...);
        start_pattern = rf"INSERT INTO `{table}`"
        for match in re.finditer(start_pattern, content, re.IGNORECASE):
            # Find the start of VALUES block
            val_start = content.find("VALUES", match.end())
            if val_start == -1: continue
            
            # Scan from val_start + 6
            ptr = val_start + 6
            while ptr < len(content):
                # Skip to next row start
                while ptr < len(content) and content[ptr] != "(":
                    if content[ptr] == ";": break
                    ptr += 1
                if ptr >= len(content) or content[ptr] == ";": break
                
                # We are at '(', scan until balanced ')'
                row_start = ptr
                depth = 0
                in_str = False
                while ptr < len(content):
                    char = content[ptr]
                    if char == "'" and (ptr == 0 or content[ptr-1] != "\\"):
                        in_str = not in_str
                    elif not in_str:
                        if char == "(": depth += 1
                        elif char == ")":
                            depth -= 1
                            if depth == 0:
                                # Found the row!
                                row_str = content[row_start+1:ptr]
                                # Split by comma but respect quotes
                                parts = []
                                current = ""
                                in_q = False
                                for c in row_str:
                                    if c == "'" and (len(current) == 0 or current[-1] != "\\"):
                                        in_q = not in_q
                                        current += c
                                    elif c == "," and not in_q:
                                        parts.append(current.strip())
                                        current = ""
                                    else:
                                        current += c
                                parts.append(current.strip())
                                
                                # Clean parts
                                cleaned = []
                                for p in parts:
                                    if p.startswith("'") and p.endswith("'"):
                                        p = p[1:-1].replace("\\'", "'").replace("\\\\", "\\")
                                    cleaned.append(p)
                                data[table].append(cleaned)
                                break
                    ptr += 1
                ptr += 1
                
    # Build Map
    output = []
    
    # Names Map
    names = {} # (type, id) -> name
    if 'translations' in cols:
        t_cols = cols['translations']
        try:
            type_idx = t_cols.index('translationable_type')
            id_idx = t_cols.index('translationable_id')
            # Look for 'value' or 'name' or 4th/5th col
            name_idx = t_cols.index('name') if 'name' in t_cols else (t_cols.index('value') if 'value' in t_cols else 4)
            for r in data['translations']:
                if len(r) > max(type_idx, id_idx, name_idx):
                    names[(r[type_idx].replace("\\\\", "\\"), r[id_idx])] = r[name_idx]
        except Exception as e:
            print(f"Error mapping translations: {e}")

    # Categories
    cat_tree = {}
    if 'categories' in cols:
        c_cols = cols['categories']
        id_idx = c_cols.index('id')
        pid_idx = c_cols.index('parent_id')
        for r in data['categories']:
            cid = r[id_idx]
            pid = r[pid_idx]
            name = names.get(('App\\Models\\Category', cid), f"Cat {cid}")
            cat_tree[cid] = {'name': name, 'pid': pid, 'subcats': [], 'services': []}

    # Services
    svc_tree = {}
    if 'services' in cols:
        s_cols = cols['services']
        id_idx = s_cols.index('id')
        cat_idx = s_cols.index('category_id')
        for r in data['services']:
            sid = r[id_idx]
            cid = r[cat_idx]
            name = names.get(('App\\Models\\Service', sid), f"Service {sid}")
            svc_tree[sid] = {'name': name, 'variants': []}
            if cid in cat_tree:
                cat_tree[cid]['services'].append(sid)

    # Variations
    if 'variations' in cols:
        v_cols = cols['variations']
        sid_idx = v_cols.index('service_id')
        name_idx = v_cols.index('name') if 'name' in v_cols else (v_cols.index('variant') if 'variant' in v_cols else 3)
        price_idx = v_cols.index('default_price') if 'default_price' in v_cols else (v_cols.index('price') if 'price' in v_cols else 2)
        for r in data['variations']:
            sid = r[sid_idx]
            if sid in svc_tree:
                svc_tree[sid]['variants'].append({'name': r[name_idx], 'price': r[price_idx]})

    # Fill subcats
    roots = []
    for cid, c in cat_tree.items():
        if c['pid'] == '0' or c['pid'] not in cat_tree:
            roots.append(cid)
        else:
            cat_tree[c['pid']]['subcats'].append(cid)

    # Markdown Content
    md = ["# FULL SERVICE DATA EXPORT\n"]
    for rcid in sorted(roots):
        root = cat_tree[rcid]
        md.append(f"## Category: {root['name']}")
        
        # Services in Root
        for sid in sorted(root['services']):
            s = svc_tree[sid]
            md.append(f"### Service: {s['name']} (Direct)")
            if s['variants']:
                md.append("| Package | Price |")
                md.append("| :--- | :--- |")
                for v in s['variants']:
                    md.append(f"| {v['name']} | {v['price']} |")
            md.append("")
            
        # Subcategories
        for scid in sorted(root['subcats']):
            sub = cat_tree[scid]
            md.append(f"### Subcategory: {sub['name']}")
            for sid in sorted(sub['services']):
                s = svc_tree[sid]
                md.append(f"#### Service: {s['name']}")
                if s['variants']:
                    md.append("| Package | Price |")
                    md.append("| :--- | :--- |")
                    for v in s['variants']:
                        md.append(f"| {v['name']} | {v['price']} |")
                md.append("")
        md.append("---\n")

    return "\n".join(md)

if __name__ == "__main__":
    sql_path = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/u430492535_2ndriun (1).sql"
    result = scan_sql(sql_path)
    with open("data44.md", "w", encoding="utf-8") as f:
        f.write(result)
    print("Done! data44.md created.")
