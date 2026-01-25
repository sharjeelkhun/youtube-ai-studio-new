import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    brackets = {')': '(', '}': '{', ']': '['}
    
    for line_num, line in enumerate(lines, 1):
        for char_num, char in enumerate(line, 1):
            if char in '({[':
                stack.append((char, line_num, char_num))
            elif char in ')}]':
                if not stack:
                    print(f"Extra closing bracket '{char}' at line {line_num}, col {char_num}")
                    return
                opening, o_line, o_col = stack.pop()
                if opening != brackets[char]:
                    print(f"Mismatched bracket '{char}' at line {line_num}, col {char_num}, matches '{opening}' from line {o_line}, col {o_col}")
                    return
    
    if stack:
        print("Unclosed opening brackets:")
        for char, line, col in stack:
            print(f"  '{char}' at line {line}, col {col}")
    else:
        print("All brackets are balanced!")

if __name__ == "__main__":
    check_balance(sys.argv[1])
