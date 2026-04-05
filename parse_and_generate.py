import re
import uuid
import sys

# Configuration
SQL_FILE = "u430492535_2ndriun (1).sql"
OUTPUT_SQL = "migration_bihar_all.sql"
PROVIDER_ID = "5b0ed0a7-7c34-4eda-852e-c7a32f469386"
SUPABASE_BIHAR_ZONE_ID = "5ce29515-d1ff-403a-899b-564996753fa9"
LEGACY_BIHAR_ZONE_ID = "e5d1d616-130b-4b76-a578-53c7e12b3ceb"

# Target INSERT line numbers
TARGET_LINES = {
    'categories': [1704],
    'services': [6130, 6146],
    'variations': [8319]
}

def parse_val(val):
    val = val.strip()
    if val.startswith("'") and val.endswith("'"):
        # Handle escaped quotes for MySQL
        return val[1:-1].replace("''", "'").replace("\\'", "'")
    if val.upper() == 'NULL':
        return None
    return val

def split_sql_row(row):
    # Robust CSV splitter that respects escaping and quotes
    parts = []
    current = []
    in_quotes = False
    escaped = False
    for char in row:
        if char == "\\" and not escaped:
            escaped = True
            current.append(char)
            continue
        if char == "'" and not escaped:
            in_quotes = not in_quotes
        if char == "," and not in_quotes:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)
        escaped = False
    parts.append("".join(current).strip())
    return parts

def get_buffer(lines, start_idx):
    values_started = False
    buffer = ""
    for i in range(start_idx, len(lines)):
        line = lines[i].strip()
        if not values_started:
            if "VALUES" in line:
                values_started = True
                buffer = line.split("VALUES", 1)[1]
        else:
            buffer += " " + line
        if values_started and line.endswith(";"):
            break
    content = buffer.strip()
    if content.endswith(";"): content = content[:-1]
    return content

def extract_rows(content):
    # Balanced parenthesis scanner to reliably extract (row1), (row2)
    rows = []
    current_row = []
    depth = 0
    in_quotes = False
    escaped = False
    for char in content:
        if char == "\\" and not escaped:
            escaped = True
            current_row.append(char)
            continue
        if char == "'" and not escaped:
            in_quotes = not in_quotes
        if not in_quotes:
            if char == "(":
                depth += 1
                if depth == 1: 
                    current_row = []
                    continue
            elif char == ")":
                depth -= 1
                if depth == 0:
                    rows.append("".join(current_row))
                    current_row = []
                    continue
        current_row.append(char)
        escaped = False
    return rows

def parse_all():
    with open(SQL_FILE, "r", encoding="latin-1") as f:
        lines = f.readlines()

    print("Parsing variations for Bihar...")
    bihar_variations = {}
    bihar_service_ids = set()
    for start in TARGET_LINES['variations']:
        content = get_buffer(lines, start)
        rows = extract_rows(content)
        for row in rows:
            parts = [parse_val(p) for p in split_sql_row(row)]
            if len(parts) >= 6:
                # (id, variant, variant_key, service_id, zone_id, price)
                v_name, s_id, z_id, price = parts[1], parts[3], parts[4], parts[5]
                if z_id == LEGACY_BIHAR_ZONE_ID:
                    if s_id not in bihar_variations: bihar_variations[s_id] = []
                    bihar_variations[s_id].append({'name': v_name, 'price': float(price)})
                    bihar_service_ids.add(s_id)
    print(f"Found {len(bihar_service_ids)} services with variations in Bihar.")

    print("Parsing services...")
    services_dict = {}
    for start in TARGET_LINES['services']:
        content = get_buffer(lines, start)
        rows = extract_rows(content)
        for row in rows:
            parts = [parse_val(p) for p in split_sql_row(row)]
            if len(parts) >= 8:
                # (id, name, short_desc, desc, cover, thumb, cat_id, subcat_id)
                s_id, name, s_desc, desc, cat_id, subcat_id = parts[0], parts[1], parts[2], parts[3], parts[6], parts[7]
                if s_id in bihar_service_ids:
                    services_dict[s_id] = {
                        'name': name, 'description': desc or s_desc,
                        'category_id': cat_id, 'subcategory_id': subcat_id
                    }
    print(f"Loaded {len(services_dict)} services for Bihar.")

    print("Parsing categories...")
    hierarchy = {}
    for start in TARGET_LINES['categories']:
        content = get_buffer(lines, start)
        rows = extract_rows(content)
        for row in rows:
            parts = [parse_val(p) for p in split_sql_row(row)]
            if len(parts) >= 7:
                # (id, parent_id, name, image, position, description, is_active)
                c_id, p_id, name, desc, active = parts[0], parts[1], parts[2], parts[5], parts[6]
                hierarchy[c_id] = {
                    'name': name, 
                    'parent_id': p_id if p_id != '0' else None, 
                    'is_active': active == '1'
                }
    print(f"Loaded {len(hierarchy)} total categories.")

    return hierarchy, services_dict, bihar_variations

def generate_sql(hierarchy, services, variations):
    print(f"Generating {OUTPUT_SQL}...")
    sql_lines = [
        "-- Migration for Bihar Services (All categories and services from SQL)",
        "BEGIN;",
        f"-- Provider: Digital Studio ({PROVIDER_ID})",
        f"-- Zone: Bihar ({SUPABASE_BIHAR_ZONE_ID})",
        "\n-- 1. Insert Categories"
    ]

    # Map legacy IDs to new UUIDs
    cat_uuid_map = {}
    
    # First, collect categories needed by services
    needed_cats = set()
    for s_id, s_data in services.items():
        needed_cats.add(s_data['category_id'])
        if s_data['subcategory_id']:
            needed_cats.add(s_data['subcategory_id'])
            # Ensure parent is also included
            sub_data = hierarchy.get(s_data['subcategory_id'])
            if sub_data and sub_data['parent_id']:
                needed_cats.add(sub_data['parent_id'])

    # Insert Root Categories
    for c_id in sorted(needed_cats):
        data = hierarchy.get(c_id)
        if data and data['parent_id'] is None:
            new_id = str(uuid.uuid4())
            cat_uuid_map[c_id] = new_id
            name = data['name'].replace("'", "''")
            sql_lines.append(f"INSERT INTO public.service_categories (id, name, is_active) VALUES ('{new_id}', '{name}', {str(data['is_active']).lower()}) ON CONFLICT DO NOTHING;")

    sql_lines.append("\n-- 2. Insert Subcategories")
    subcat_uuid_map = {}
    for c_id in sorted(needed_cats):
        data = hierarchy.get(c_id)
        if data and data['parent_id'] is not None:
            parent_id = data['parent_id']
            parent_uuid = cat_uuid_map.get(parent_id)
            if parent_uuid:
                new_id = str(uuid.uuid4())
                subcat_uuid_map[c_id] = new_id
                name = data['name'].replace("'", "''")
                sql_lines.append(f"INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('{new_id}', '{parent_uuid}', '{name}', {str(data['is_active']).lower()}) ON CONFLICT DO NOTHING;")

    sql_lines.append("\n-- 3. Insert Services & Variants")
    svc_count = 0
    var_count = 0
    for s_id, s_data in services.items():
        vars = variations[s_id]
        base_price = vars[0]['price'] if vars else 0
        
        # Determine category and subcategory UUIDs
        cat_uuid = cat_uuid_map.get(s_data['category_id'])
        subcat_uuid = subcat_uuid_map.get(s_data['subcategory_id'])
        
        # If the category_id from service is actually a subcategory
        if not cat_uuid and subcat_uuid:
            subcat_data = hierarchy.get(s_data['subcategory_id'])
            if subcat_data and subcat_data['parent_id']:
                cat_uuid = cat_uuid_map.get(subcat_data['parent_id'])

        if cat_uuid:
            svc_uuid = str(uuid.uuid4())
            name = s_data['name'].replace("'", "''")
            desc = s_data['description'].replace("'", "''") if s_data['description'] else ""
            subcat_val = f"'{subcat_uuid}'" if subcat_uuid else "NULL"
            sql_lines.append(f"INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('{svc_uuid}', '{cat_uuid}', {subcat_val}, '{PROVIDER_ID}', '{SUPABASE_BIHAR_ZONE_ID}', '{name}', '{desc}', {base_price}, true) ON CONFLICT DO NOTHING;")
            svc_count += 1
            for v in vars:
                v_name = v['name'].replace("'", "''")
                sql_lines.append(f"INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('{svc_uuid}', '{v_name}', {v['price']}, true) ON CONFLICT DO NOTHING;")
                var_count += 1

    sql_lines.append("COMMIT;")
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Summary: Generated {svc_count} services and {var_count} variants for Bihar.")

if __name__ == "__main__":
    h, s, v = parse_all()
    generate_sql(h, s, v)
