#version 150 

in vec4 vPosition;
in vec3 vNormal;

out vec3 fN;
out vec3 fE;
out vec3 fL;

uniform mat4 model_view;
uniform mat4 projection;
uniform vec4 LightPosition;

void main() 
{
	vec3 pos = (model_view*vPosition).xyz;
fN = (model_view*vec4(vNormal, 0.0)).xyz ;
fE = -pos.xyz;
if (LightPosition.w!=0.0) //point light
fL = (model_view*LightPosition).xyz - pos;
else //distant light
fL = (model_view*LightPosition).xyz;
	gl_Position = projection*model_view*vPosition;
} 
