uniform mat4 Projection, ModelView;
in vec4 vPosition;
in vec4 normal;
out vec3 R; //reflection vector
void main(void)
{
gl_Position = Projection*ModelView*vPosition;
vec3 N = normalize(ModelView*normal);
vec4 eyePos = ModelView*vPosition;
R = reflect(-eyePos.xyz, N);
}
