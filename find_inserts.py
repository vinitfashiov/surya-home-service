def find_table_lines():
    with open("u430492535_2ndriun (1).sql", "r", encoding="latin-1") as f:
        for i, line in enumerate(f):
            if "INSERT INTO" in line:
                if "`translations`" in line: print(f"translations: {i}")
                if "`categories`" in line: print(f"categories: {i}")
                if "`services`" in line: print(f"services: {i}")
                if "`variations`" in line: print(f"variations: {i}")

if __name__ == "__main__":
    find_table_lines()
