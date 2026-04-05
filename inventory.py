import re
import sys

# Ensure stdout uses UTF-8 to prevent UnicodeEncodeError on Windows
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def get_full_inventory():
    sql_file = "u430492535_2ndriun (1).sql"
    with open(sql_file, "r", encoding="latin-1") as f:
        content = f.read()

    # Step 1: Translations to names
    trans_pattern = r"\(\d+, '(.*?)', '(.*?)', 'en', 'name', '(.*?)'\)"
    translations = re.findall(trans_pattern, content)
    
    cat_names = set()
    svc_names = set()
    
    for t_type, t_id, value in translations:
        if "Category" in t_type:
            cat_names.add(value)
        elif "Service" in t_type:
            svc_names.add(value)

    # Step 2: Variations
    # Variations are in the format (id, variant, variant_key, service_id, zone_id, price, ...)
    # Let's use a simpler match for variants
    var_pattern = r"INSERT INTO `variations`.*?VALUES\s*(.*?);"
    var_blocks = re.findall(var_pattern, content, re.S | re.I)
    variant_names = set()
    if var_blocks:
        for block in var_blocks:
            # Match (id, 'variant', ...)
            rows = re.findall(r"\(\d+, '(.*?)',", block)
            for r in rows:
                variant_names.add(r)

    print("--- CATEGORIES ---")
    for n in sorted(list(cat_names)): print(f"- {n}")
    print("\n--- SERVICES ---")
    for n in sorted(list(svc_names)): print(f"- {n}")
    print("\n--- VARIATIONS (Packages) ---")
    for n in sorted(list(variant_names)): print(f"- {n}")

if __name__ == "__main__":
    get_full_inventory()
