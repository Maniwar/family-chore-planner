with open('src/components/ChoreCard.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == "import { Avatar }":
        lines[i] = "import { Avatar } from './Avatar';\n"
    if line.strip() == "import { BottomSheetGrabber } from './Avatar';":
        lines[i] = "import { BottomSheetGrabber } from './BottomSheetGrabber';\n"

with open('src/components/ChoreCard.tsx', 'w') as f:
    f.writelines(lines)
