import re
from collections import defaultdict

def detect_tables(file_path):
    table_counts = defaultdict(int)
    current_table = None
    
    with open(file_path, 'r', encoding='latin-1') as f:
        for line in f:
            if 'INSERT INTO' in line:
                # Find table name using more robust regex
                match = re.search(r"INSERT INTO `?(\w+)`?", line, re.I)
                if match:
                    current_table = match.group(1)
                
                # Count rows in this line (approximate by counting balancing parens)
                # This is just for detection
                rows = line.count("),(") + 1
                table_counts[current_table] += rows
                
    return dict(table_counts)

if __name__ == "__main__":
    sql_path = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/u430492535_2ndriun (1).sql"
    tables = detect_tables(sql_path)
    print("Tables found in SQL dump:")
    for t, c in sorted(tables.items()):
        print(f"{t}: ~{c} rows")
