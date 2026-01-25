import sys
import re

def check_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find JSX tags, including self-closing ones
    # Group 1: closing slash (/), Group 2: tag name, Group 3: attributes, Group 4: self-closing slash (/)
    tag_pattern = re.compile(r'<(/?[a-zA-Z0-9\.]+)([^>]*?)(/?)>')
    
    stack = []
    
    # Track line and column numbers
    line_starts = [0]
    for m in re.finditer(r'\n', content):
        line_starts.append(m.end())
    
    def get_pos(offset):
        line = 1
        for i, start in enumerate(line_starts):
            if start > offset:
                line = i
                break
        else:
            line = len(line_starts)
        col = offset - line_starts[line-1] + 1
        return line, col

    for match in tag_pattern.finditer(content):
        tag_full = match.group(1)
        attrs = match.group(2)
        self_closing = match.group(3)
        
        offset = match.start()
        line, col = get_pos(offset)
        
        if tag_full.startswith('/'):
            name = tag_full[1:]
            if not stack:
                print(f"Extra closing tag </{name}> at line {line}, col {col}")
                return
            opening_name, o_line, o_col = stack.pop()
            if opening_name != name:
                print(f"Mismatched tag </{name}> at line {line}, col {col}, expected </{opening_name}> (opened at line {o_line}, col {o_col})")
                return
        else:
            name = tag_full
            if self_closing == '/' or name in ['img', 'br', 'hr', 'input']:
                # Self-closing
                continue
            stack.append((name, line, col))
    
    if stack:
        print("Unclosed tags:")
        for name, line, col in stack:
            print(f"  <{name}> at line {line}, col {col}")
    else:
        print("All tags are balanced!")

if __name__ == "__main__":
    check_tags(sys.argv[1])
