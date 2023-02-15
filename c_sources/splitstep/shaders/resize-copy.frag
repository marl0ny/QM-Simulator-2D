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

uniform sampler2D tex;
uniform vec2 offset;
uniform float xTransform;
uniform float yTransform;

void main() {
    vec2 coord = offset + vec2(xTransform*UV.x, yTransform*UV.y);
    vec4 view = texture2D(tex, offset + vec2(xTransform*UV.x, 
                                             yTransform*UV.y));
    if (coord.x >= 0.0 && coord.x < 1.0 && coord.y >= 0.0 && coord.y < 1.0)
        fragColor = view;
    else
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    
}