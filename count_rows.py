import re
import os

def main():
    sql_file = "u430492535_2ndriun (1).sql"
    if not os.path.exists(sql_file): 
        print("File not found.")
        return

    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    # Find services table blocks
    # Using the split method for reliability
    pattern = rf"INSERT INTO\s+[`\"']?services[`\"']?\s+"
    segments = re.split(pattern, content, flags=re.I)
    total_service_rows = 0
    for seg in segments[1:]:
        val_idx = seg.find("VALUES")
        if val_idx == -1: continue
        semi_idx = seg.find(";", val_idx)
        if semi_idx == -1: continue
        block = seg[val_idx + 6 : semi_idx]
        # Count tuples: (val, val, ...)
        matches = list(re.finditer(r"\(", block))
        total_service_rows += len(matches)
        print(f"Statement found with {len(matches)} service rows.")
    
    print(f"Total service rows in dump: {total_service_rows}")

if __name__ == "__main__":
    main()
