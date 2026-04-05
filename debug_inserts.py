import re

def debug_inserts():
    with open("u430492535_2ndriun (1).sql", "r", encoding="latin-1") as f:
        content = f.read()

    tables = ["categories", "services", "translations", "variations"]
    for tbl in tables:
        # Match INSERT INTO `table` ... VALUES ( ... );
        pattern = rf"INSERT INTO\s*[`]?{tbl}[`]?.*?VALUES\s*(.*?);"
        matches = re.search(pattern, content, re.S | re.I)
        if matches:
            print(f"--- Found {tbl} ---")
            print(matches.group(0)[:200], "...")
        else:
            print(f"--- {tbl} NOT found ---")

if __name__ == "__main__":
    debug_inserts()
