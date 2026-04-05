import re
import os

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

def analyze_sql():
    sql_file = "u430492535_2ndriun (1).sql"
    if not os.path.exists(sql_file):
        print("SQL file not found.")
        return

    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    trans_matches = re.findall(r"INSERT INTO `translations`.*?VALUES\s*(.*?);", content, re.S | re.I)
    categories = []
    services = []
    
    if trans_matches:
        for block in trans_matches:
            segments = split_sql_segments(block)
            for seg in segments:
                # Remove outer parens
                seg = seg.strip()
                if seg.startswith("(") and seg.endswith(")"):
                    inner = seg[1:-1]
                    # Split inner by comma but respect quotes
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
                        
                        if "Category" in t_type and key == "name":
                            categories.append(f"{value} (ID: {t_id})")
                        elif "Service" in t_type and key == "name":
                            services.append(f"{value} (ID: {t_id})")

    with open("audit_data.txt", "w", encoding="utf-8") as out:
        out.write("--- CATEGORIES ---\n")
        out.write("\n".join(sorted(list(set(categories)))))
        out.write("\n\n--- SERVICES ---\n")
        out.write("\n".join(sorted(list(set(services)))))
    
    print(f"Extraction complete. Found {len(set(categories))} categories and {len(set(services))} services.")

if __name__ == "__main__":
    analyze_sql()
