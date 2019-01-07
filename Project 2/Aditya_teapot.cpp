
#include "Angel.h"
#include "loadModels.h"
#include <math.h> 

typedef Angel::vec4 color4;
typedef Angel::vec4 point4;
// the model
vector<vec4> vertices;
vector<GLushort> elements;
vector<vec3> normals;

GLuint  model_view;  // model-view matrix uniform shader variable location
GLuint  projection; // projection matrix uniform shader variable location

enum { ArrayBuffer, ElementBuffer, NumVertex };
float Atte = 0.5;
float tx,ty;
//
//----------------------------------------------------------------------------
//light properties
float lar = 0.1, lag = 0.1, lab = 0.1, lsr = 1.0, lsg = 1.0, lsb = 1.0;
float ldr = 1.0, ldg = 1.0, ldb = 1.0;

//material properties
float mar = 0.5, mag = 0.0, mab = 0.0, msr = 0.5, msg = 0.0, msb = 0.0;
float mdr = 0.5, mdg = 0.0, mdb = 0.0;

//light position
float xl = 0.0, yl = 0.0, zl = 1.0;



// OpenGL initialization
void
init()
{

    // Create a vertex array object
    GLuint vao;
    glGenVertexArrays( 1, &vao );
    glBindVertexArray( vao );

    // Load a model
    load_obj("../models/teapot.obj", vertices,elements,normals);
if ((vertices.size()==0) || (elements.size()==0)|| (normals.size()==0))
    cout << "Failed to read the model"<<endl;
else
    cout<< vertices.size()<<" "<<elements.size()<<endl;



    // Create and initialize a buffer object
   GLuint buffers[NumVertex];

    glGenBuffers( NumVertex, buffers );
    glBindBuffer( GL_ARRAY_BUFFER, buffers[ArrayBuffer] );
  glBufferData( GL_ARRAY_BUFFER, vertices.size()*sizeof(vec4),
		  &vertices[0], GL_STATIC_DRAW ); 
// glBufferData( GL_ARRAY_BUFFER, sizeof(vertices)+sizeof(normals),
	//	  NULL, GL_STATIC_DRAW );
	glBufferSubData(GL_ARRAY_BUFFER,0,sizeof(vertices),&vertices[0]);
	glBufferSubData(GL_ARRAY_BUFFER,vertices.size()*sizeof(vec4),normals.size()*sizeof(vec3),&normals[0]);

 glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, buffers[ElementBuffer] );
    glBufferData( GL_ELEMENT_ARRAY_BUFFER, elements.size()*sizeof(GLushort), &elements[0], GL_STATIC_DRAW );

    // Load shaders and use the resulting shader program
    GLuint program = InitShader( "vshader_teapot.glsl", "fshader_teapot.glsl");
    glUseProgram( program );

    // set up vertex arrays
    GLuint vPosition = glGetAttribLocation( program, "vPosition" );
    glEnableVertexAttribArray( vPosition );
    glVertexAttribPointer( vPosition, 4, GL_FLOAT, GL_FALSE, 0,
			   BUFFER_OFFSET(0) );
	
	GLuint vNormal = glGetAttribLocation( program, "vNormal" );
glEnableVertexAttribArray( vNormal );
glVertexAttribPointer( vNormal, 3, GL_FLOAT, GL_FALSE, 0,
BUFFER_OFFSET(sizeof(vertices)));

point4 light_position( xl, yl, zl, 0.0 );
color4 light_ambient( lar, lag, lab, 1.0 );
color4 light_diffuse( ldr, ldg, ldb, 1.0 );
color4 light_specular( lsr, lsg, lsb, 1.0 );

color4 material_ambient( mar, mag, mab, 1.0 );
color4 material_diffuse( mdr, mdg, mdb, 1.0 );
color4 material_specular( msr, msg, msb, 1.0 );
float material_shininess = 100.0;

GLfloat spot_direction[]= {5.0,5.0,5.0};

color4 ambient_product = light_ambient * material_ambient;
color4 diffuse_product = light_diffuse * material_diffuse;
color4 specular_product = light_specular * material_specular;

glUniform4fv( glGetUniformLocation(program, "AmbientProduct"),1, ambient_product );
glUniform4fv( glGetUniformLocation(program, "DiffuseProduct"),1, diffuse_product );
glUniform4fv( glGetUniformLocation(program, "SpecularProduct"),1, specular_product );
glUniform4fv( glGetUniformLocation(program, "LightPosition"),1, light_position );
glUniform1f( glGetUniformLocation(program, "Shininess"),
material_shininess);

glLightf(GL_LIGHT0, GL_LINEAR_ATTENUATION, Atte);
glLightf(GL_LIGHT0, GL_SPOT_CUTOFF, 5.0);
glLightfv(GL_LIGHT0, GL_SPOT_DIRECTION, spot_direction);
glLightf(GL_LIGHT0, GL_SPOT_EXPONENT, 5.0);
glEnable(GL_LIGHT0);

    model_view = glGetUniformLocation( program, "model_view" );
    projection = glGetUniformLocation( program, "projection" );
    
    glEnable( GL_DEPTH_TEST );	glShadeModel(GL_FLAT);
    glClearColor( 0.5, 0.5, 0.5, 0.0 );
}

//----------------------------------------------------------------------------



int rp = 0, gp = 0, bp = 0;
mat4 mv, p;
void display( void )
{
    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
	point4 eye(0.0,0.0,1.0,1.0);
	point4 at(0.0,0.0,0.0,1.0);
	vec4 up(0.0,1.0,0.0,0.0);

	//const vec3 viewer_pos(0.0,0.0,2.0);
//	mv = (Translate(-viewer_pos));
	 mv = LookAt(eye,at,up);
			
	glUniformMatrix4fv( model_view, 1, GL_TRUE, mv );
/*		
    p = mat4(0.2f, 0.0, 0.0, 0.0,
        0.0, 0.2f, 0.0, 0.0,
        0.0, 0.0, 0.2f, 0.0,
        0.0, 0.0, 0.0, 1.0f);

*/
					//for red
					if(rp == 1) {lar += 0.1; rp = 0;}
					if(rp == 2) {ldr += 0.1; rp = 0;}
					if(rp == 3) {lsr += 0.1; rp = 0;}
					if(rp == 4) {mar += 0.1; rp = 0;}
					if(rp == 5) {mdr += 0.1; rp = 0;}
					if(rp == 6) {msr += 0.1; rp = 0;}
 					if(rp == 7) {lar -= 0.1; rp = 0;}
					if(rp == 8) {ldr -= 0.1; rp = 0;}
					if(rp == 9) {lsr -= 0.1; rp = 0;}
					if(rp == 10) {mar -= 0.1; rp = 0;}
					if(rp == 11) {mdr -= 0.1; rp = 0;}
					if(rp == 12) {msr -= 0.1; rp = 0;}

					//for green
					if(gp == 1) {lag += 0.1; gp = 0;}
					if(gp == 2) {ldg += 0.1; gp = 0;}
					if(gp == 3) {lsg += 0.1; gp = 0;}
					if(gp == 4) {mag += 0.1; gp = 0;}
					if(gp == 5) {mdg += 0.1; gp = 0;}
					if(gp == 6) {msg += 0.1; gp = 0;}
 					if(gp == 7) {lag -= 0.1; gp = 0;}
					if(gp == 8) {ldg -= 0.1; gp = 0;}
					if(gp == 9) {lsg -= 0.1; gp = 0;}
					if(gp == 10) {mag -= 0.1; gp = 0;}
					if(gp == 11) {mdg -= 0.1; gp = 0;}
					if(gp == 12) {msg -= 0.1; gp = 0;}
					
					//for blue
					if(bp == 1) {lag += 0.1; bp = 0;}
					if(bp == 2) {ldg += 0.1; bp = 0;}
					if(bp == 3) {lsg += 0.1; bp = 0;}
					if(bp == 4) {mag += 0.1; bp = 0;}
					if(bp == 5) {mdg += 0.1; bp = 0;}
					if(bp == 6) {msg += 0.1; bp = 0;}
 					if(bp == 7) {lag -= 0.1; bp = 0;}
					if(bp == 8) {ldg -= 0.1; bp = 0;}
					if(bp == 9) {lsg -= 0.1; bp = 0;}
					if(bp == 10) {mag -= 0.1; bp = 0;}
					if(bp == 11) {mdg -= 0.1; bp = 0;}
					if(bp == 12) {msg -= 0.1;  bp = 0;}


GLfloat zNear = 2.0, zFar = 10.0;
	p = Perspective( 110.0,1.0, zNear, zFar );
glUniformMatrix4fv( projection, 1, GL_TRUE, p );
    
 glDrawElements( GL_TRIANGLES, elements.size()*sizeof(GLushort), GL_UNSIGNED_SHORT, 0);
glutSwapBuffers();

}

int set=-1,move=0;


int ch = 0, prop = 0;

void keyboard(unsigned char key, int x, int y)
{
	switch(key)
	{
	case 'q': case 'Q':
	exit(0); break;

	case 'a': case 'A':
	if (set==1) prop = 1; ch = 1;
	if (set==2) prop = 2; ch = 1; break;

	case 'd': case 'D':
	if (set==1) prop = 1; ch = 2;
	if (set==2) prop = 2; ch = 2; break;

	case 's': case 'S':
	if (set==1) prop = 1; ch = 3;
	if (set==2) prop = 2; ch = 3; break;

	case 'R': 
	if(prop == 1){  if(ch == 1) rp = 1;
					if(ch == 2) rp = 2;
					if(ch == 3) rp = 3; }
	if(prop == 2){  if(ch == 1) rp = 4;
					if(ch == 2) rp = 5;
					if(ch == 3) rp = 6; }
	break;

	case 'r': 
	if(prop == 1){  if(ch == 1) rp = 7;
					if(ch == 2) rp = 8;
					if(ch == 3) rp = 9; }
	if(prop == 2){  if(ch == 1) rp = 10;
					if(ch == 2) rp = 11;
					if(ch == 3) rp = 12; } 
	break;

	case 'G': 
	if(prop == 1){  if(ch == 1) gp = 1;
					if(ch == 2) gp = 2;
					if(ch == 3) gp = 3; }
	if(prop == 2){  if(ch == 1) gp = 4;
					if(ch == 2) gp = 5;
					if(ch == 3) gp = 6; }
	break;

	case 'g': 
	if(prop == 1){  if(ch == 1) gp = 7;
					if(ch == 2) gp = 8;
					if(ch == 3) gp = 9; }
	if(prop == 2){  if(ch == 1) gp = 10;
					if(ch == 2) gp = 11;
					if(ch == 3) gp = 12; }
	break;

	case 'B': 
	if(prop == 1){  if(ch == 1) bp = 1;
					if(ch == 2) bp = 2;
					if(ch == 3) bp = 3; }
	if(prop == 2){  if(ch == 1) bp = 4;
					if(ch == 2) bp = 5;
					if(ch == 3) bp = 6; }
	break;

	case 'b': 
	if(prop == 1){  if(ch == 1) bp = 7;
					if(ch == 2) bp = 8;
					if(ch == 3) bp = 9; }
	if(prop == 2){  if(ch == 1) bp = 10;
					if(ch == 2) bp = 11;
					if(ch == 3) bp = 12; }
	break;

	case '+': Atte += 0.1; break;

	case '-': Atte -= 0.1; break;

	} 
}

void mouse(int button, int state, int x, int y)
{		
	if(state == GLUT_DOWN){
	switch(button){
	case GLUT_LEFT_BUTTON: set = 1; break;
	case GLUT_MIDDLE_BUTTON: move = 1; break;
	case GLUT_RIGHT_BUTTON: set = 2; break;}
	}
	
}

void motion(int x, int y)
{

	if(move==1){	
	if(x!=0){tx=1*x; xl += tx; }
	if(y!=0){ty=1*y; yl += ty; }
	}
	
}

//----------------------------------------------------------------------------

int
main( int argc, char **argv )
{
    glutInit( &argc, argv );
    glutInitDisplayMode( GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH );
    glutInitWindowSize( 512, 512 );
    glutInitContextVersion( 3, 3 );
    glutInitContextProfile( GLUT_CORE_PROFILE );

    glutCreateWindow("Teapot");    
	glewInit();
    init();
    glutDisplayFunc( display );
	glutKeyboardFunc( keyboard );
	glutMouseFunc( mouse );
	glutMotionFunc( motion );
	
    glutMainLoop();
    return 0;
}
