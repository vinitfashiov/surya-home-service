import re
import os

def main():
    sql_file = "u430492535_2ndriun (1).sql"
    if not os.path.exists(sql_file):
        print(f"Error: {sql_file} not found.")
        return

    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    # Find all table names in INSERT statements
    # Using a loose regex to catch variations
    tables = re.findall(r"INSERT INTO\s+[`\"']?(\w+)[`\"']?\s+", content, re.I)
    from collections import Counter
    counts = Counter(tables)
    print("Tables found in INSERT statements:")
    for tbl, count in counts.most_common():
        print(f"  {tbl}: {count}")

if __name__ == "__main__":
    main()
