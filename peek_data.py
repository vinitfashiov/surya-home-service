import re

def peek_inserts(file_path, tables):
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
        for table in tables:
            pattern = rf"INSERT INTO `{table}` (.*?) VALUES"
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                print(f"--- {table} ---")
                print(match.group(0)) # Header
                # Print first row
                start = match.end()
                end = content.find(";", start)
                print(content[start:start+500] + "...")
                print("\n")

sql_file = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/u430492535_2ndriun (1).sql"
peek_inserts(sql_file, ['categories', 'services', 'translations', 'variations'])
