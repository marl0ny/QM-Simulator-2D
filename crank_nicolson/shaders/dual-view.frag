#VERSION_NUMBER_PLACEHOLDER

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#define texture2D texture
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform sampler2D tex1;
uniform sampler2D tex2;

void main() {
    vec2 coord1 = vec2(2.0*UV.x, UV.y);
    vec4 view1 = texture2D(tex1, coord1);
    vec4 view2 = texture2D(tex2, coord1 - vec2(2.0, 0.0));
    if (coord1.x >= 0.0 && coord1.x < 1.0 && coord1.y >= 0.0 && coord1.y < 1.0)
        fragColor = view1;
    else
        fragColor = view2;
    
}
