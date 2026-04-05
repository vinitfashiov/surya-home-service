import re
import os

def get_list():
    sql_file = "u430492535_2ndriun (1).sql"
    with open(sql_file, "r", encoding="latin-1") as f:
        categories = []
        services = []
        for line in f:
            # Look for translation rows manually
            # Example: (25, 'App\\Models\\Category', '8d1c79e6-0b1a-47d9-9f7e-fb89cfa25e81', 'en', 'name', 'Photography')
            if "App\\\\Models\\\\Category" in line and "'name'" in line:
                m = re.search(r", 'name', '(.*?)'\)", line)
                if m: categories.append(m.group(1))
            if "App\\\\Models\\\\Service" in line and "'name'" in line:
                m = re.search(r", 'name', '(.*?)'\)", line)
                if m: services.append(m.group(1))

    print("--- CATEGORIES FOUND ---")
    for c in sorted(list(set(categories))):
        print(f"- {c}")
    
    print("\n--- SERVICES FOUND ---")
    list_services = sorted(list(set(services)))
    for s in list_services[:100]:
        print(f"- {s}")
    if len(list_services) > 100:
        print(f"... and {len(list_services)-100} more")

if __name__ == "__main__":
    get_list()
