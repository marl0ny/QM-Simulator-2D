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

uniform float xAmplitude;
uniform float yAmplitude;
uniform float c;
uniform float hbar;
uniform float q;
uniform float m;
uniform float width;
uniform float height;
uniform int which;


#define ZERO 0
#define LINEAR 1
#define QUADRATIC 2
#define SYMMETRIC 3
#define AX_IS_Y2 4
#define AX_IS_Y2_AY_IS_NEG_X2 5

float getSquaredTerm(float ax, float ay, float az) {
    return q*q*hbar/(2.0*m*c*c)*(ax*ax + ay*ay + az*az);
}

void main() {
    float u = UV[0] - 0.5; // u = x/width
    float v = UV[1] - 0.5; // v = y/height
    float x = u*width; // is there any off by ones ?
    float y = v*height;
    float ax, ay, phi;
    vec4 potential;
    switch(which) {
        case LINEAR:
            potential = vec4(0.0, 0.0, 0.0, xAmplitude*u + yAmplitude*v);
            break;
        case QUADRATIC:
            potential = vec4(0.0, 0.0, 0.0, xAmplitude*u*u + yAmplitude*v*v);
            break;
        case SYMMETRIC:
            ax = q*c*xAmplitude*v, ay = -q*c*yAmplitude*u;
            potential = vec4(ax, ay, 0.0, getSquaredTerm(ax, ay, 0.0));
            break;
        case AX_IS_Y2:
            // ax = q*c*xAmplitude*y^2/height^2
            ax = q*c*xAmplitude*v*v;
            potential = vec4(ax, 0.0, 0.0, 0.0);
            break;
        case AX_IS_Y2_AY_IS_NEG_X2:
            ax = q*c*xAmplitude*v*v;
            ay = -q*c*yAmplitude*u*u;
            potential = vec4(ax, ay, 0.0, getSquaredTerm(ax, ay, 0.0));
            break;
        default:
            potential = vec4(0.0, 0.0, 0.0, 0.0);
    }
    fragColor = potential;
}