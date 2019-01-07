
#include "Angel.h"
#include "loadModels.h"
#include <math.h> 


// the model
vector<vec4> vertices;
vector<GLushort> elements;
vector<vec3> normals;
int window1, window2;
GLfloat scale=0.3f;

GLuint  model_view;  // model-view matrix uniform shader variable location

GLuint  projection; // projection matrix uniform shader variable location

enum { ArrayBuffer, ElementBuffer, NumVertexBuffers };
enum {Xaxis = 0, Yaxis = 1, Zaxis = 2, NumAxes = 3};
int Axis = -1;
GLfloat Theta[NumAxes] = {0.0, 0.0, 0.0};
GLuint theta;

GLuint scale1=0, shiftx=0, shifty=0, ref=0, res=0;

mat4 shxup = mat4(1,0,0,0.1,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1);
mat4 shxdo = mat4(1,0,0,-0.1,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1);
mat4 shyup = mat4(1,0,0,0,
				0,1,0,0.1,
				0,0,1,0,
				0,0,0,1);
mat4 shydo = mat4(1,0,0,0,
				0,1,0,-0.1,
				0,0,1,0,
				0,0,0,1);
mat4 scdo = mat4(0.9,0,0,0,
				0,0.9,0,0,
				0,0,0.9,0,
				0,0,0,1);
mat4 scup = mat4(1.1,0,0,0,
				0,1.1,0,0,
				0,0,1.1,0,
				0,0,0,1);
mat4 refup = mat4(1,0,0,0,
				0,-1,0,0,
				0,0,1,0,
				0,0,0,1);
mat4 refle = mat4(-1,0,0,0,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1);

//
//----------------------------------------------------------------------------

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
    GLuint buffers[NumVertexBuffers];

    glGenBuffers( NumVertexBuffers, buffers );
    glBindBuffer( GL_ARRAY_BUFFER, buffers[ArrayBuffer] );
    glBufferData( GL_ARRAY_BUFFER, vertices.size()*sizeof(vec4),
		  &vertices[0], GL_STATIC_DRAW );

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


    model_view = glGetUniformLocation( program, "model_view" );
    projection = glGetUniformLocation( program, "projection" );
    
    glEnable( GL_DEPTH_TEST );
    glClearColor( 1.0, 1.0, 1.0, 1.0 );
}

//----------------------------------------------------------------------------

mat4 p, p1;
float a=0.2f, b=1.0f;
mat4 mv, mv2;
void display1( void )
{
    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
	const vec3 viewer_pos(0.0,0.0,2.0);
     mv = (Translate(-viewer_pos)*
		RotateX(Theta[Xaxis])* RotateY(Theta[Yaxis])* RotateZ(Theta[Zaxis]));
	if (scale1==1) {mv = scdo * mv; }
	if (scale1==2) {mv = scup * mv; }
	if (shiftx==1) {mv = shxdo * mv; }
	if (shiftx==2) {mv = shxup * mv; }
	if (shifty==1) {mv = shydo * mv; }
	if (shifty==2) {mv = shyup * mv; }
	if (ref==1) {mv = refup * mv; }
	if (ref==2) {mv = refle * mv; }
	
	glUniformMatrix4fv( model_view, 1, GL_TRUE, mv );
	p = mat4(a, 0.0, 0.0, 0.0,
        0.0, a, 0.0, 0.0,
        0.0, 0.0, a, 0.0,
        0.0, 0.0, 0.0, b);
    glUniformMatrix4fv( projection, 1, GL_TRUE, p );
	
    glDrawElements( GL_TRIANGLES, elements.size()*sizeof(GLushort), GL_UNSIGNED_SHORT, 0);

    glutSwapBuffers();
}

void display2( void )
{
    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
	const vec3 viewer_pos(0.0,0.0,2.0);
     mv2 = (Translate(-viewer_pos)*
		RotateX(Theta[Xaxis])* RotateY(Theta[Yaxis])* RotateZ(Theta[Zaxis]));
	glPushMatrix();	
	if (scale1==1) {mv2 = scdo * mv2; }
	if (scale1==2) {mv2 = scup * mv2; }
	if (shiftx==1) {mv2 = shxdo * mv2; }
	if (shiftx==2) {mv2 = shxup * mv2; }
	if (shifty==1) {mv2 = shydo * mv2; }
	if (shifty==2) {mv2 = shyup * mv2; }
	if (ref==1) {mv2 = refup * mv2; }
	if (ref==2) {mv2 = refle * mv2; }
	if (res == 1) glPopMatrix();
    glUniformMatrix4fv( model_view, 1, GL_TRUE, mv2 );
	p1 = mat4(a, 0.0, 0.0, 0.0,
        0.0, a, 0.0, 0.0,
        0.0, 0.0, a, 0.0,
        0.0, 0.0, 0.0, b);    
    glUniformMatrix4fv( projection, 1, GL_TRUE, p1 );

    glDrawElements( GL_TRIANGLES, elements.size()*sizeof(GLushort), GL_UNSIGNED_SHORT, 0);

    glutSwapBuffers();
}

void keyboard(unsigned char key, int x, int y)
{
	switch(key)
	{	
	case 'q': case 'Q':
	exit(0); break;
	case 'h': case 'H':
	res = 1; break;
	case 's': scale1 = 1; break;
	case 'S': scale1 = 2; break;
	case 'l': shiftx = 1; break;
	case 'r': shiftx = 2; break;	
	case 'u': shifty = 2; break;
	case 'd': shifty = 1; break;
	case 'f': ref = 1; break;
	case 't': ref = 2; break;		
	} 
}

static GLfloat rotate = 0.5f;


void mouse(int button, int state, int x, int y)
{		
	if (state == GLUT_UP){Axis = -1; }
	if(state == GLUT_DOWN){
	switch(button){
	case GLUT_LEFT_BUTTON: Axis = Xaxis; break;
	case GLUT_MIDDLE_BUTTON: Axis = Zaxis; break;
	case GLUT_RIGHT_BUTTON: Axis = Yaxis; break;}
	}
	
}

void motion(int x, int y)
{
	int height, width;
	height=x;
	width=y;
	if(abs(x)<10 && abs(y)<10) 
	{ rotate = (360 * (sqrt((x^2)+(y^2)))) / sqrt((height^2) + (width^2));}
}
void idle()
{
	Theta[Axis] += rotate;
	if(Theta[Axis]>360.0){
	Theta[Axis] -= 360.0;}
	glutPostRedisplay();	
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

    window1 = glutCreateWindow( argv[0] );
	glutSetWindowTitle("Teaspot1");    
	glewInit();
    init();
    glutDisplayFunc( display1 );
	glutKeyboardFunc(keyboard);
	glutMouseFunc(mouse);
	glutMotionFunc(motion);
	glutIdleFunc(idle);

	window2 = glutCreateWindow( argv[1] );
	glutSetWindowTitle("Teaspot2");
    glewInit();
    init();
    glutDisplayFunc( display2 );
	glutKeyboardFunc(keyboard);
	glutMouseFunc(mouse);
	glutMotionFunc(motion);
	glutIdleFunc(idle);

    glutMainLoop();
    return 0;
}
