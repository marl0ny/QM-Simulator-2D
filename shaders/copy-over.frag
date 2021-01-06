#define NAME copyOverFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform sampler2D tex1;
uniform sampler2D tex2;

void main () {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    gl_FragColor = vec4(col1.rgb + col2.rgb, 1.0); 
}
