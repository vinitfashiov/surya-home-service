import os

def main():
    sql_file = "u430492535_2ndriun (1).sql"
    if not os.path.exists(sql_file):
        print(f"Error: {sql_file} not found.")
        return

    with open(sql_file, "rb") as f:
        # Go to line 6131 approximately
        # We'll just read and count lines
        count = 0
        for line in f:
            count += 1
            if count == 6131:
                print(f"Line 6131 (hex): {line[:100].hex()}")
                print(f"Line 6131 (raw): {line[:100]}")
                break

if __name__ == "__main__":
    main()
