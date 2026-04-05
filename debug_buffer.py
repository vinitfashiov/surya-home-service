import re

def debug_buffer():
    with open("u430492535_2ndriun (1).sql", "r", encoding="latin-1") as f:
        lines = f.readlines()
        
    start_idx = 8319 # Variations
    values_started = False
    buffer = ""
    for i in range(start_idx, len(lines)):
        line = lines[i].strip()
        if not values_started:
            if "VALUES" in line:
                values_started = True
                buffer = line.split("VALUES", 1)[1]
                print(f"Values started on line {i}")
        else:
            buffer += " " + line
        
        if values_started and ";" in line:
            print(f"Values ended on line {i}")
            break
            
    print(f"Buffer length: {len(buffer)}")
    print(f"Buffer start: {repr(buffer[:200])}")
    
    # Try regex on buffer
    found = re.findall(r"\((.*?)\)(?:,\n|\s*;|,|$)", buffer, re.S)
    print(f"Found {len(found)} rows with simple regex")
    if found:
        print(f"First row: {repr(found[0])}")

if __name__ == "__main__":
    debug_buffer()
