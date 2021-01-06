#!/usr/bin/python3

import re
import glob

with open('shaders.js', 'w') as f1:
    for shader in glob.glob("./shaders/*", recursive=True):
        with open(shader, 'r') as f2:
            shader_txt = ''.join([line for line in f2])
            var_name = re.findall('#[ ]*define[ ]*NAME[ ]*[a-zA-Z0-9]+[ ]*', 
                                shader_txt)[0].split(' ')[-1]
            f1.write("const "+ var_name + " = `" + shader_txt + "`;\n\n\n")
