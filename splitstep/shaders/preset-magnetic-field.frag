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


#define SYMMETRIC 3
#define AX_IS_Y2 4
#define AX_IS_Y2_AY_IS_NEG_X2 5

void main() {
    float x = width*(UV[0] - 0.5);
    float y = height*(UV[1] - 0.5);
    float dAxDy, dAyDx;
    vec3 magneticField;
    switch(which) {
        case SYMMETRIC:
            // Ax = q*c*xAmplitude*v = q*c*xAmplitude*y/height
            // Ay = q*c*xAmplitude*u = q*c*yAmplitude*x/width
            dAxDy = q*c*xAmplitude/height;
            dAyDx = -q*c*yAmplitude/width;
            magneticField = vec3(0.0, 0.0, dAyDx - dAxDy);
            break;
        case AX_IS_Y2:
            dAyDx = 0.0;
            dAxDy = 2.0*q*c*xAmplitude*y/(height*height);
            magneticField = vec3(0.0, 0.0, dAyDx - dAxDy);
            break;
        case AX_IS_Y2_AY_IS_NEG_X2:
            dAxDy = 2.0*q*c*xAmplitude*y/(height*height);
            dAyDx = -2.0*q*c*yAmplitude*x/(width*width);
            magneticField = vec3(0.0, 0.0, dAyDx - dAxDy);
            break;
        default:
            magneticField = vec3(0.0, 0.0, 0.0);
            break;
    }
    fragColor = vec4(magneticField, 1.0);
}