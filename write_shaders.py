#!/usr/bin/python3
"""
Write the shaders from the shaders folder into a shaders.js file.
"""
import glob
import re


def write_isw_energy_eigenstates_shader(empty=False):
    with open('./shaders/isw-energy-eigenstates.frag', 'r') as f:
        text = ''.join([line for line in f])
    coeff_uniforms = ''
    estates_string = ''
    if not empty:
        for i in range(25):
            for j in range(25):
                coeff = f'c{i+1}d{j+1}'
                coeff_uniforms += f'uniform float {coeff};\n'
                estates_string += f'E = hbar*hbar/(2.0*m)*'
                estates_string += f'({(i+1.0)**2}*pi*pi/(w*w) '
                estates_string += f'+ {(j+1.0)**2}*pi*pi/(h*h));\n'
                estates_string += f'psin0 = sin({i+1.0}*pi*x/w)*'
                estates_string += f'sin({j+1.0}*pi*y/h);\n'
                estates_string += f'psi += {coeff}*vec2(psin0*cos(-E*t/hbar), '
                estates_string += f'-psin0*sin(E*t/hbar));\n'
    else:
        coeff_uniforms = '\n \n'
        estates_string = '\n \n'
    text2 = re.sub(
        '// COEFFICIENTS HERE[ ]*[a-zA-Z0-9;\s]*// COEFFICIENTS END', 
        f'// COEFFICIENTS HERE\n{coeff_uniforms}// COEFFICIENTS END',
        text)
    text3 = re.sub(
        '// ADD EIGENSTATES HERE[ ]*(?:.|\s)*// ADD EIGENSTATES END', 
        f'// ADD EIGENSTATES HERE\n{estates_string}// ADD EIGENSTATES END',
        text2)
    with open('./shaders/isw-energy-eigenstates.frag', 'w') as f:
        f.write(text3)


if __name__ == '__main__':

    write_isw_energy_eigenstates_shader(empty=True)

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
