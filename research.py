import re
import os

sql_file = "u430492535_2ndriun (1).sql"
with open(sql_file, "r", encoding="latin-1") as f:
    content = f.read()

# 1. Variations (Packages/Tiers)
print("--- VARIATIONS (Packages) ---")
v_matches = re.findall(r"INSERT INTO `variations`.*?VALUES\s*(.*?);", content, re.S | re.I)
if v_matches:
    print(v_matches[0][:2000])

# 2. Translations (Names) - to see what exists
print("\n--- TRANSLATIONS (Sample) ---")
t_matches = re.findall(r"INSERT INTO `translations`.*?VALUES\s*(.*?);", content, re.S | re.I)
if t_matches:
    print(t_matches[0][:2000])

# 3. Categories Check
print("\n--- CATEGORIES RAW ---")
c_matches = re.findall(r"INSERT INTO `categories`.*?VALUES\s*(.*?);", content, re.S | re.I)
if c_matches:
    print(c_matches[0][:2000])
