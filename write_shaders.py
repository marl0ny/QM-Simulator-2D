#!/usr/bin/python3
"""
Write the shaders from the shaders folder into a shaders.js file.
"""
import glob


with open('./scripts/shaders.js', 'w') as f1:
    for shader in glob.glob("./shaders/*", recursive=True):
        with open(shader, 'r') as f2:
            lines = []
            for line in f2:
                line_texts = line.split('//')
                new_line = line_texts[0].strip('\n').strip(' ')
                new_line = ('\n' + new_line + '\n' 
                            if '#' in new_line else new_line)
                if (lines and lines[-1] and new_line and 
                    lines[-1][-1] == '\n' and new_line[0] == '\n'):
                    new_line = new_line[1::]
                lines.append(new_line)
            shader_txt = ''.join(lines)
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
            f1.write("const " + var_name + " = `" + shader_txt + "`;\n")
