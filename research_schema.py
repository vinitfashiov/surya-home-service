import re

def get_schemas(file_path, table_names):
    schemas = {}
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
        for table in table_names:
            pattern = rf"CREATE TABLE `{table}` \((.*?)\) ENGINE"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                schemas[table] = match.group(1).strip()
    return schemas

sql_file = "d:/PY/anti-gravity-google-app and improvement project for storekriti/vibe-service/u430492535_2ndriun (1).sql"
tables = ['categories', 'services', 'translations', 'variations']
schemas = get_schemas(sql_file, tables)
for table, schema in schemas.items():
    print(f"--- {table} ---")
    print(schema)
    print("\n")
