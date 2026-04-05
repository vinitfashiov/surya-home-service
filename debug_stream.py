import sys

def debug_stream():
    with open("u430492535_2ndriun (1).sql", "r", encoding="latin-1") as f:
        count = 0
        for i, line in enumerate(f):
            if "INSERT INTO" in line:
                print(f"Line {i}: {repr(line[:100])}")
                count += 1
                if count > 50: break

if __name__ == "__main__":
    debug_stream()
