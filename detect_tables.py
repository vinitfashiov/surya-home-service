import re
import os

def main():
    sql_file = "u430492535_2ndriun (1).sql"
    if not os.path.exists(sql_file):
        print(f"Error: {sql_file} not found.")
        return

    table_counts = {}
    with open(sql_file, "r", encoding="latin-1") as f:
        for line in f:
            match = re.search(r"INSERT INTO `(\w+)`", line, re.I)
            if match:
                tbl = match.group(1)
                table_counts[tbl] = table_counts.get(tbl, 0) + 1

    for tbl, count in sorted(table_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"{tbl}: {count}")

if __name__ == "__main__":
    main()
