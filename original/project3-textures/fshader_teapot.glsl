#version 150 
in vec3 R;
uniform samplerCube texMap;
void main(void)
{
gl_FragColor = texture(texMap, R);
}
