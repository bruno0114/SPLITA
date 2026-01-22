import sys

def find_mismatch(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Remove self-closing tags
    content = sys.stdin.read() # Read from stdin if piped
    
import re
def process(text):
    # This regex handles simple nested divs. Not perfect but useful.
    opens = [m.start() for m in re.finditer(r'<div', text)]
    closes = [m.start() for m in re.finditer(r'</div', text)]
    
    # Filter out self-closing
    real_opens = []
    for o in opens:
        tag_end = text.find('>', o)
        if tag_end != -1 and text[tag_end-1] != '/':
            real_opens.append(o)
            
    print(f"Opens: {len(real_opens)}, Closes: {len(closes)}")
    
    # Find first mismatch
    stack = []
    for i in range(len(text)):
        if text[i:i+4] == '<div':
            tag_end = text.find('>', i)
            if tag_end != -1 and text[tag_end-1] != '/':
                stack.append(i)
        elif text[i:i+5] == '</div':
            if not stack:
                print(f"Extra closing div at char {i}")
            else:
                stack.pop()
    
    for s in stack:
        # Find line number
        line = text.count('\n', 0, s) + 1
        print(f"Unclosed div at line {line}: {text[s:s+50]}")

with open('src/features/groups/pages/GroupDetails.tsx', 'r') as f:
    process(f.read())
