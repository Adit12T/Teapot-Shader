//////////////////////////////////////////////////////////////////////////////
//
//  --- loadModels.cpp ---
//  --- The code is modified from
//https://en.wikibooks.org/wiki/OpenGL_Programming/Modern_OpenGL_Tutorial_Load_OBJ
//An obj file is structured in lines. 
// The lines starting with # are comments
// o introduces a new object
// For each following line,
// v introduces a vertex
// vn introduces a normal
// f introduces a face, using vertex indices, starting at 1
//
// loadModels() is used to load an existing model stored as an
// obj file and returns the vertices, normals, or faces.
//////////////////////////////////////////////////////////////////////////////

#include "loadModels.h"


void load_obj(const char* filename, vector<vec4>& vertices, vector<GLushort>& elements,vector<vec3>& normals)
{

    ifstream in(filename);
    if (!in)
    {
        cerr << "Cannot open " << filename << endl; exit(1);
    }

    string line;
    while (getline(in, line))
    {
        // load the vertices
    if (line.substr(0,2) == "v ") 
        {
            istringstream s(line.substr(2));
            vec4 v; s >> v.x; s >> v.y; s >> v.z; v.w = 1.0f;
            vertices.push_back(v);
        }
        //load the faces
        else if (line.substr(0,2) == "f ") // 
        {
            istringstream s(line.substr(2));
            GLushort a,b,c;
            s >> a; s >> b; s >> c;
            a--; b--; c--;
           elements.push_back(a); elements.push_back(b); elements.push_back(c);
        }
        else if (line[0] == '#')
        {
            /* ignoring this line */
        }
        else
        {
            /* ignoring this line */
        }
    }

 
    normals.resize(vertices.size(), vec3(0.0, 0.0, 0.0));


    for (unsigned i = 0; i < elements.size(); i+=3)
    {
        GLushort ia = elements[i];
        GLushort ib = elements[i+1];
        GLushort ic = elements[i+2];
    
        vec3 normal = normalize(cross(vertices[ib]- vertices[ia],vertices[ic]-vertices[ia]));
        normals[ia] = normals[ib] = normals[ic] = normal;
    }
    
}


