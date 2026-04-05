import re
import os

sql_file = "u430492535_2ndriun (1).sql"

def get_insert_blocks(content, table_name):
    pattern = rf"INSERT INTO [`\"]?{table_name}[`\"]?.*?VALUES\s*(.*?);"
    return re.findall(pattern, content, re.S | re.I)

def split_segments(values_str):
    segments = []
    current = []
    bracket_level = 0
    in_quotes = False
    quote_char = ""
    escape = False
    for char in values_str:
        if escape:
            current.append(char)
            escape = False
            continue
        if char == "\\":
            current.append(char)
            escape = True
            continue
        if char in ("'", '"'):
            if not in_quotes:
                in_quotes = True
                quote_char = char
            elif char == quote_char:
                in_quotes = False
        if not in_quotes:
            if char == "(": bracket_level += 1
            elif char == ")": bracket_level -= 1
            if char == "," and bracket_level == 0:
                segments.append("".join(current).strip())
                current = []
                continue
        current.append(char)
    if current: segments.append("".join(current).strip())
    return segments

def main():
    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    # 1. Map Names from Translations
    print("Mapping names from translations...")
    name_map = {} # (Type, ID) -> Name
    trans_blocks = get_insert_blocks(content, "translations")
    for block in trans_blocks:
        segments = split_segments(block)
        for seg in segments:
            if seg.startswith("(") and seg.endswith(")"):
                inner = seg[1:-1]
                parts = []
                curr_p = []
                iq = False
                qc = ""
                for c in inner:
                    if c in ("'", '"'):
                        if not iq: iq = True; qc = c
                        elif c == qc: iq = False
                    if c == "," and not iq:
                        parts.append("".join(curr_p).strip().strip("'\""))
                        curr_p = []
                    else: curr_p.append(c)
                parts.append("".join(curr_p).strip().strip("'\""))
                
                if len(parts) >= 6:
                    t_type = parts[1].replace("\\\\", "\\")
                    t_id = parts[2]
                    key = parts[4]
                    value = parts[5]
                    if key == "name":
                        name_map[(t_type, t_id)] = value

    # 2. Get Categories
    print("Extracting categories...")
    categories = []
    cat_blocks = get_insert_blocks(content, "categories")
    for block in cat_blocks:
        segments = split_segments(block)
        for seg in segments:
            if seg.startswith("(") and seg.endswith(")"):
                parts = seg[1:-1].split(",")
                cid = parts[0].strip().strip("'\"")
                name = name_map.get(('App\\Models\\Category', cid))
                if name: categories.append(name)

    # 3. Get Services
    print("Extracting services...")
    services = []
    svc_blocks = get_insert_blocks(content, "services")
    for block in svc_blocks:
        segments = split_segments(block)
        for seg in segments:
            if seg.startswith("(") and seg.endswith(")"):
                parts = seg[1:-1].split(",")
                sid = parts[0].strip().strip("'\"")
                name = name_map.get(('App\\Models\\Service', sid))
                if name: services.append(name)

    # 4. Get Zones
    print("Extracting zones...")
    zones = []
    zone_blocks = get_insert_blocks(content, "zones")
    for block in zone_blocks:
        segments = split_segments(block)
        for seg in segments:
            if seg.startswith("(") and seg.endswith(")"):
                parts = seg[1:-1].split(",")
                if len(parts) >= 2:
                    zname = parts[1].strip().strip("'\"")
                    zones.append(zname)

    print("\n--- RESULTS ---")
    print(f"Zones: {', '.join(zones)}")
    print(f"Categories Count: {len(set(categories))}")
    print(f"Services Count: {len(set(services))}")

    with open("final_audit.md", "w", encoding="utf-8") as out:
        out.write("# SQL Data Audit\n\n")
        out.write(f"## Zones\n{', '.join(zones)}\n\n")
        out.write("## Categories\n")
        for c in sorted(list(set(categories))):
            out.write(f"- {c}\n")
        out.write("\n## Services\n")
        for s in sorted(list(set(services))):
            out.write(f"- {s}\n")

    print("Audit saved to final_audit.md")

if __name__ == "__main__":
    main()
