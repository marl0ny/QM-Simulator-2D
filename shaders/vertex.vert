#define NAME vertexShaderSource
attribute vec3 pos;
varying highp vec2 fragTexCoord;

void main() {
    gl_Position = vec4(pos.xyz, 1.0);
    fragTexCoord = vec2(0.5, 0.5) + pos.xy/2.0;
}