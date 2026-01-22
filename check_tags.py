import sys
import re

def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Find all <div or </div
    tags = re.findall(r'<(/?div|/?motion.div|/?Portal|/?AnimatePresence)', content)
    
    stack = []
    for tag in tags:
        if tag.startswith('/'):
            if not stack:
                print(f"Extra closing tag: {tag}")
                continue
            last = stack.pop()
            if last != tag[1:]:
                print(f"Mismatched tag: open {last}, close {tag}")
        else:
            # Check for self-closing in content (approximate)
            # Find the tag in content to see if it has a />
            # This is hard with regex, so let's just use the stack for now and assume they are not self-closing unless known
            if tag in ['div', 'motion.div', 'Portal', 'AnimatePresence']:
                stack.append(tag)

    if stack:
        print(f"Unclosed tags: {stack}")

check_file('src/features/groups/pages/GroupDetails.tsx')
