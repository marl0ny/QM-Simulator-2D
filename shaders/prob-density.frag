#define NAME probDensityFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;


void main() {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    vec4 col3 = texture2D(tex3, fragTexCoord);
    float probDensity = col2.r*col2.r + col1.g*col3.g;
    gl_FragColor = vec4(probDensity, 0.0, 0.0, 1.0);
}