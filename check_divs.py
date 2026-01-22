import sys

def check_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    for i, line in enumerate(lines):
        # Very simple tag extractor (won't handle all cases like strings, but good enough)
        cursor = 0
        while True:
            open_tag = line.find('<div', cursor)
            close_tag = line.find('</div', cursor)
            
            if open_tag == -1 and close_tag == -1:
                break
                
            if close_tag != -1 and (open_tag == -1 or close_tag < open_tag):
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing div at line {i+1}")
                cursor = close_tag + 5
            else:
                # Check if self-closing
                tag_end = line.find('>', open_tag)
                if tag_end != -1 and line[tag_end-1] == '/':
                    pass # self-closing
                else:
                    stack.append(i+1)
                cursor = open_tag + 4
                
    if stack:
        for line_num in stack:
            print(f"Unclosed div starting at line {line_num}")

check_file('src/features/groups/pages/GroupDetails.tsx')
