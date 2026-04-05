import re

def debug_table(name, start_idx):
    with open("u430492535_2ndriun (1).sql", "r", encoding="latin-1") as f:
        lines = f.readlines()
        
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
        
        if values_started and ";" in line:
            break
            
    content = buffer.strip()
    if content.endswith(";"): content = content[:-1]
    found = re.findall(r"\((.*?)\)(?:,\n|\s*;|,|$)", content, re.S)
    print(f"--- {name} ---")
    print(f"Found {len(found)} rows")
    if found:
        print(f"First row: {repr(found[0])}")

if __name__ == "__main__":
    debug_table("categories", 1704)
    debug_table("services", 6130)
    debug_table("translations", 6636)
