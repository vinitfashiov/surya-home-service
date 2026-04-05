import re

def split_sql_segments(values_str):
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
        if char in ("'", '"') and not escape:
            if not in_quotes:
                in_quotes = True
                quote_char = char
            elif char == quote_char:
                in_quotes = False
        
        if not in_quotes:
            if char == "(":
                bracket_level += 1
            elif char == ")":
                bracket_level -= 1
            
            if char == "," and bracket_level == 0:
                segments.append("".join(current).strip())
                current = []
                continue
        
        current.append(char)
    
    if current:
        segments.append("".join(current).strip())
    return segments

def get_list():
    sql_file = "u430492535_2ndriun (1).sql"
    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    # Get translations
    trans_matches = re.findall(r"INSERT INTO `translations`.*?VALUES\s*(.*?);", content, re.S | re.I)
    name_map = {}
    for block in trans_matches:
        segments = split_sql_segments(block)
        for seg in segments:
            seg = seg.strip()
            if seg.startswith("(") and seg.endswith(")"):
                inner = seg[1:-1]
                # Split by comma
                parts = []
                curr_part = []
                iq = False
                qc = ""
                for c in inner:
                    if c in ("'", '"'):
                        if not iq:
                            iq = True
                            qc = c
                        elif c == qc:
                            iq = False
                    if c == "," and not iq:
                        parts.append("".join(curr_part).strip().strip("'\""))
                        curr_part = []
                    else:
                        curr_part.append(c)
                parts.append("".join(curr_part).strip().strip("'\""))
                
                if len(parts) >= 6:
                    t_type = parts[1]
                    t_id = parts[2]
                    key = parts[4]
                    value = parts[5]
                    if key == "name":
                        name_map[(t_type, t_id)] = value

    # Get Categories
    cat_names = []
    cat_matches = re.findall(r"INSERT INTO `categories`.*?VALUES\s*(.*?);", content, re.S | re.I)
    for block in cat_matches:
        segments = split_sql_segments(block)
        for seg in segments:
            seg = seg.strip()
            if seg.startswith("(") and seg.endswith(")"):
                inner = seg[1:-1]
                parts = inner.split(",") # Category IDs are likely the first part
                cat_id = parts[0].strip().strip("'\"")
                name = name_map.get(('App\\\\Models\\\\Category', cat_id)) or name_map.get(('App\\Models\\Category', cat_id))
                if name: cat_names.append(name)

    # Get Services
    svc_names = []
    svc_matches = re.findall(r"INSERT INTO `services`.*?VALUES\s*(.*?);", content, re.S | re.I)
    for block in svc_matches:
        segments = split_sql_segments(block)
        for seg in segments:
            seg = seg.strip()
            if seg.startswith("(") and seg.endswith(")"):
                inner = seg[1:-1]
                parts = inner.split(",") 
                svc_id = parts[0].strip().strip("'\"")
                name = name_map.get(('App\\\\Models\\\\Service', svc_id)) or name_map.get(('App\\Models\\Service', svc_id))
                if name: svc_names.append(name)

    print("--- CATEGORIES ---")
    for n in sorted(list(set(cat_names))): print(f"- {n}")
    print("\n--- SERVICES ---")
    for n in sorted(list(set(svc_names))): print(f"- {n}")

if __name__ == "__main__":
    get_list()
