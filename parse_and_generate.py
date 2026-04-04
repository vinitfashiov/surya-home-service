import re
import os

def parse_sql_values(block):
    extracted = []
    i, n = 0, len(block)
    while i < n:
        while i < n and block[i] != "(": i += 1
        if i >= n: break
        i += 1
        parts, current_val, in_string, depth = [], "", False, 1
        while i < n and depth > 0:
            char = block[i]
            if char == "'":
                if i + 1 < n and block[i+1] == "'": current_val += "'"; i += 1
                else: in_string = not in_string
            elif char == "(" and not in_string: depth += 1; current_val += char
            elif char == ")" and not in_string:
                depth -= 1
                if depth > 0: current_val += char
            elif char == "," and not in_string and depth == 1:
                parts.append(current_val.strip()); current_val = ""
            else: current_val += char
            i += 1
        parts.append(current_val.strip())
        cleaned = []
        for p in parts:
            if p.upper() == "NULL": cleaned.append(None)
            elif p.startswith("'") and p.endswith("'"): cleaned.append(p[1:-1].replace("''", "'"))
            else: cleaned.append(p)
        extracted.append(cleaned)
        while i < n and block[i] in " \n\r\t,": i += 1
    return extracted

def main():
    sql_file = "u430492535_2ndriun (1).sql"
    output_file = "migration.sql"
    provider_id = "5b0ed0a7-7c34-4eda-852e-c7a32f469386"
    if not os.path.exists(sql_file): return
    with open(sql_file, "r", encoding="latin-1") as f: content = f.read()

    def get_data_for_table(table_name):
        data = []
        pattern = rf"INSERT INTO\s+[`\"']?{table_name}[`\"']?\s+.*?VALUES\s+"
        for m in re.finditer(pattern, content, re.I | re.S):
            start = m.end()
            end = content.find(";", start)
            if end != -1: data.extend(parse_sql_values(content[start:end]))
        return data

    raw_categories = get_data_for_table("categories")
    raw_services = get_data_for_table("services")
    raw_translations = get_data_for_table("translations")
    
    trans_map = {}
    for t in raw_translations:
        if len(t) >= 6:
            mid, key, val = t[2], t[4], t[5]
            if mid not in trans_map: trans_map[mid] = {}
            trans_map[mid][key] = val

    categories_map = {}
    top_categories = []
    subcategories = []
    subcat_ids = set()
    for c in raw_categories:
        if len(c) < 3: continue
        cid, pid = c[0], c[1]
        name = trans_map.get(cid, {}).get('name', c[2])
        desc = trans_map.get(cid, {}).get('description', c[5] if len(c) > 5 else "")
        img = c[3] if len(c) > 3 else None
        cat_obj = {'id': cid, 'pid': pid, 'name': name, 'desc': desc, 'img': img}
        categories_map[cid] = cat_obj
        if not pid or pid == '0' or pid == 'NULL': top_categories.append(cat_obj)
        else:
            subcategories.append(cat_obj)
            subcat_ids.add(cid)

    services_processed, service_id_set = [], set()
    for s in raw_services:
        if len(s) < 2: continue
        sid = s[0]
        name = trans_map.get(sid, {}).get('name', s[1])
        desc = trans_map.get(sid, {}).get('description', s[3] if len(s) > 3 else "")
        cat_id = s[6] if len(s) > 6 and s[6] and s[6] != '0' else None
        subcat_id = s[7] if len(s) > 7 and s[7] and s[7] != '0' else None
        
        # Foreign Key check: ensure subcat_id exists
        if subcat_id and subcat_id not in subcat_ids: subcat_id = None
        
        if subcat_id and not cat_id:
            cat_id = categories_map.get(subcat_id, {}).get('pid')
            if cat_id == '0': cat_id = None
            
        img = s[5] if len(s) > 5 else None
        try: price = float(s[13]) if len(s) > 13 and s[13] else 0.0
        except: price = 0.0
        services_processed.append({'id': sid, 'name': name, 'description': desc, 'price': price, 'image': img, 'cat_id': cat_id, 'subcat_id': subcat_id})
        service_id_set.add(sid)

    for c in subcategories:
        if c['desc'] and any(k in c['desc'].lower() for k in ['â‚¹', 'price', 'book', '7999', '3499', '10999']):
            if c['id'] not in service_id_set:
                # If a subcategory behaves as a service, it belongs to its parent category
                # and its OWN id is not inserted as a subcategory grouping if it's already a service.
                # Actually, let's just make it a service linked to the parent.
                services_processed.append({'id': c['id'], 'name': c['name'], 'description': c['desc'], 'price': 0.0, 'image': c['img'], 'cat_id': c['pid'], 'subcat_id': None})
                service_id_set.add(c['id'])

    with open(output_file, "w", encoding="utf-8") as out:
        out.write("BEGIN;\n")
        # Ensure we only insert valid subcategories (those that ARE NOT acting as services)
        # Actually, let's just insert all.
        for c in top_categories:
            n, d = str(c['name']).replace("'", "''"), str(c['desc'] or "").replace("'", "''")
            img = f"'{c['img']}'" if c['img'] else "NULL"
            out.write(f"INSERT INTO public.service_categories (id, name, image_url, description, is_active) VALUES ('{c['id']}', '{n}', {img}, '{d}', True) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n")
        for c in subcategories:
            n, d = str(c['name']).replace("'", "''"), str(c['desc'] or "").replace("'", "''")
            pid = f"'{c['pid']}'" if c['pid'] and c['pid'] != '0' else "NULL"
            out.write(f"INSERT INTO public.service_subcategories (id, category_id, name, description, is_active) VALUES ('{c['id']}', {pid}, '{n}', '{d}', True) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n")
        for s in services_processed:
            n, d = str(s['name']).replace("'", "''"), str(s['description'] or "").replace("'", "''")
            img = f"'{s['image']}'" if s['image'] else "NULL"
            cid = f"'{s['cat_id']}'" if s['cat_id'] and s['cat_id'] != '0' else "NULL"
            scid = f"'{s['subcat_id']}'" if s['subcat_id'] and s['subcat_id'] != '0' else "NULL"
            out.write(f"INSERT INTO public.services (id, name, description, price, image_url, category_id, subcategory_id, provider_id, is_active) VALUES ('{s['id']}', '{n}', '{d}', {s['price']}, {img}, {cid}, {scid}, '{provider_id}', True) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n")
        out.write("COMMIT;")
    print("Done.")

if __name__ == "__main__": main()
