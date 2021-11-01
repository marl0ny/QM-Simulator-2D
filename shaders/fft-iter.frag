precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex;
uniform float blockSize;
uniform int isVertical;
uniform float angleSign;
uniform float size;
uniform float scale;
const float tau = 6.283185307179586;

vec3 getOdd1(float x, float y) {
    return (isVertical == 0)? texture2D(tex, vec2(x + blockSize/2.0, y)).rgb:
                              texture2D(tex, vec2(x, y + blockSize/2.0)).rgb;
}

vec3 getEven2(float x, float y) {
    return (isVertical == 0)? texture2D(tex, vec2(x - blockSize/2.0, y)).rgb:
                              texture2D(tex, vec2(x, y - blockSize/2.0)).rgb;
}

void main() {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    float val = (isVertical == 0)? mod(x, blockSize): mod(y, blockSize);
    // even lower half
    vec3 even1 = texture2D(tex, fragTexCoord).rgb;
    vec3 odd1 = getOdd1(x, y);
    float phi1 = angleSign*tau*(val - 0.5/size)/(blockSize);
    float cos_val1 = cos(phi1);
    float sin_val1 = sin(phi1);
    vec3 expOdd1 = vec3(odd1.r*cos_val1 - odd1.g*sin_val1,
                        odd1.r*sin_val1 + odd1.g*cos_val1,
                        0.0);
    vec3 out1 = scale*(even1 + expOdd1);
    // odd upper half
    vec3 even2 = getEven2(x, y);
    vec3 odd2 = texture2D(tex, fragTexCoord).rgb;
    float phi2 = angleSign*tau*((val - 0.5/size) - blockSize/2.0)/(blockSize);
    float cos_val2 = cos(phi2);
    float sin_val2 = sin(phi2);
    vec3 expOdd2 = vec3(odd2.r*cos_val2 - odd2.g*sin_val2,
                        odd2.r*sin_val2 + odd2.g*cos_val2,
                        0.0);
    vec3 out2 = scale*(even2 - expOdd2);
    fragColor = (val <= blockSize/2.0)? vec4(out1, 1.0): vec4(out2, 1.0);

}