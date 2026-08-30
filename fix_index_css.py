import re
import os

filepath = 'src/index.css'
with open(filepath, 'r') as f:
    content = f.read()

# Glacial Ice Light
content = content.replace(
    "rgba(240, 249, 255, 0.25) 0%, rgba(224, 242, 254, 0.10) 50%, rgba(240, 249, 255, 0.15) 100%",
    "rgba(240, 249, 255, 0.12) 0%, rgba(224, 242, 254, 0.02) 50%, rgba(240, 249, 255, 0.05) 100%"
)

# Glacial Ice Dark
content = content.replace(
    "rgba(8, 28, 48, 0.35) 0%, rgba(14, 46, 74, 0.25) 100%",
    "rgba(8, 28, 48, 0.15) 0%, rgba(14, 46, 74, 0.08) 100%"
)

# Frosted Glass Light
content = content.replace(
    "rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.10) 100%",
    "rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%"
)

# Frosted Glass Dark
content = content.replace(
    "rgba(15, 23, 42, 0.35) 0%, rgba(30, 41, 59, 0.20) 100%",
    "rgba(15, 23, 42, 0.15) 0%, rgba(30, 41, 59, 0.08) 100%"
)

with open(filepath, 'w') as f:
    f.write(content)
