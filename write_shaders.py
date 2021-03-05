#!/usr/bin/python3
"""
Write the shaders from the shaders folder into a shaders.js file.
"""
import glob


with open('shaders.js', 'w') as f1:
    for shader in glob.glob("./shaders/*", recursive=True):
        with open(shader, 'r') as f2:
            shader_txt = ''.join([line for line in f2])
            tokens = shader.split('/')[-1].split('.')
            filetype = tokens.pop()
            tokens = ''.join(tokens).split('-')
            for i, tok in enumerate(tokens):
                if i != 0:
                    tokens[i] = tok[0].upper() + tok[1:]
            if filetype == 'frag':
                tokens.append('FragmentSource')
            elif filetype == 'vert':
                tokens.append('ShaderSource')
            var_name = ''.join(tokens)
            f1.write("const " + var_name + " = `" + shader_txt + "`;\n\n\n")
