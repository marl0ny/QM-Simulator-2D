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
uniform int width;
uniform int height;

vec2 revBitSort2(vec2 uv) {
    vec2 uv2 = vec2(0.0, 0.0);
    int indexU = int(floor(uv[0]*float(width)));
    int indexV = int(floor(uv[1]*float(height)));
    int rev = int(0), i = indexU;
    for (int asc = 1, des = width/2; des > 0; des /= 2, asc *= 2) {
        if (i/des > 0) {
            rev += asc;
            i -= des;
        }
    }
    uv2[0] = (float(rev) + 0.5)/float(width);
    rev = 0, i = indexV;
    for (int asc = 1, des = height/2; des > 0; des /= 2, asc *= 2) {
        if (i/des > 0) {
            rev += asc;
            i -= des;
        }
    }
    uv2[1] = (float(rev) + 0.5)/float(height);
    return uv2;
}

void main() {
     fragColor = texture2D(tex, revBitSort2(UV));
}