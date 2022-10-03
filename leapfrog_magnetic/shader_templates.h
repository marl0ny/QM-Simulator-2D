#ifdef __cplusplus
extern "C" {
#endif

#ifndef _CUSTOM_SHADER_TEMPLATE_
#define _CUSTOM_SHADER_TEMPLATE_

const char CUSTOM_POTENTIAL_0[] = ""
    "#version 330 core\n"
    "precision highp float;\n"
    "in vec2 UV;\n"
    "out vec4 fragColor;\n"
    "uniform float c;\n"
    "uniform float q;\n"
    "uniform float m;\n"
    "uniform float hbar;\n"
    "uniform float width;\n"
    "uniform float height;\n"
    "\n"
    "void main() {\n"
    "    float u = UV[0] - 0.5;\n"
    "    float v = UV[1] - 0.5;\n"
    "    float x = width*u;\n"
    "    float y = height*v;\n";

const char CUSTOM_POTENTIAL_1[] = ""
    "    float ax = ";

const char CUSTOM_POTENTIAL_2[] = ""
    "     + 0.0;\n"
    "    float ay = ";

const char CUSTOM_POTENTIAL_3[] = ""
    "     + 0.0;\n"
    "    float phi = ";

const char CUSTOM_POTENTIAL_4[] = ""
    "    + 0.0;\n"
    "    float a2 = q*q*hbar/(2.0*m*c*c)*(ax*ax + ay*ay);\n"
    "    fragColor = vec4(ax, ay, 0.0, phi + a2);\n"
    "}\n";

#endif

#ifdef __cplusplus
}
#endif