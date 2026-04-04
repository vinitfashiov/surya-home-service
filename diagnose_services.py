import re
import os

def parse_sql_values(block):
    pattern = r"\((?P<vals>.*?)\)(?=\s*[,;]|$)"
    matches = re.finditer(pattern, block, re.S)
    extracted = []
    for match in matches:
        raw_vals = match.group('vals')
        # ... (same parsing logic)
        parts = []
        current = ""
        in_string = False
        i = 0
        while i < len(raw_vals):
            char = raw_vals[i]
            if char == "'":
                if i + 1 < len(raw_vals) and raw_vals[i+1] == "'":
                    current += "'"
                    i += 1 
                else:
                    in_string = not in_string
            elif char == "," and not in_string:
                parts.append(current.strip())
                current = ""
            else:
                current += char
            i += 1
        parts.append(current.strip())
        cleaned_parts = []
        for p in parts:
            p = p.strip()
            if p.upper() == "NULL":
                cleaned_parts.append(None)
            elif p.startswith("'") and p.endswith("'"):
                val = p[1:-1].replace("''", "'")
                cleaned_parts.append(val)
            else:
                cleaned_parts.append(p)
        extracted.append(cleaned_parts)
    return extracted

def main():
    sql_file = "u430492535_2ndriun (1).sql"
    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    table_name = "services"
    pattern = rf"INSERT INTO\s+[`\"']?{table_name}[`\"']?\s+"
    segments = re.split(pattern, content, flags=re.I)
    print(f"Number of segments for {table_name}: {len(segments)}")
    
    for i, seg in enumerate(segments[1:]):
        print(f"Segment {i} head: {seg[:200]!r}")
        val_idx = seg.find("VALUES")
        if val_idx == -1:
            print(f"Segment {i}: VALUES NOT FOUND")
            # Try finding where ( starts
            paren_idx = seg.find("(")
            if paren_idx != -1:
                print(f"Segment {i}: Found '(' at {paren_idx}. Attempting manual block.")
                semi_idx = seg.find(";", paren_idx)
                if semi_idx != -1:
                    block = seg[paren_idx : semi_idx]
                    extracted = parse_sql_values(block)
                    print(f"Segment {i}: Found {len(extracted)} rows manually.")
        else:
            semi_idx = seg.find(";", val_idx)
            if semi_idx != -1:
                block = seg[val_idx + 6 : semi_idx]
                extracted = parse_sql_values(block)
                print(f"Segment {i}: Found {len(extracted)} rows.")

if __name__ == "__main__":
    main()
