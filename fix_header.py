import os

filepath = 'src/components/Header.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    '''                  <CloudCheck,
  Smartphone,
  Monitor className="w-3.5 h-3.5 text-emerald-600" />''',
    '''                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />'''
)

with open(filepath, 'w') as f:
    f.write(content)
