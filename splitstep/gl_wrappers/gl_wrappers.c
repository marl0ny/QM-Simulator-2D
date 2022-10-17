#include "gl_wrappers.h"
#include <GLES3/gl3.h>
#include <stdlib.h>
#include <stdio.h>

#define MAX_FRAME_COUNT 100
#define quad_attribute_position "position"

static const char VERTEX_SHADER_SOURCE[] = ""
    "#VERSION_NUMBER_PLACEHOLDER\n"
    "\n"
    "precision highp float;\n"
    "\n"
    "#if __VERSION__ >= 300\n"
    "in vec3 position;\n"
    "out highp vec2 UV;\n"
    "#else\n"
    "attribute vec3 position;\n"
    "varying highp UV;\n"
    "#endif\n"
    "\n"
    "void main() {\n"
    "    gl_Position = vec4(position.xyz, 1.0);\n"
    "    UV = position.xy/2.0 + vec2(0.5, 0.5);\n"
    "}\n";

struct Frame {
    int frame_type;
    GLuint program;
    GLuint vao;
    GLuint vbo;
    GLuint ebo;
    GLuint fbo;
    GLuint texture;
};

static int vertex_shader_ref = -1;
static struct Frame frames[MAX_FRAME_COUNT];
static struct Frame *current_frame = NULL;
static int current_frame_id = 0;
static int total_frames = 0;
static float vertices[12] = {
    -1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    1.0, -1.0, 0.0};
static int elements[6] = {
    0, 1, 2, 0, 2, 3};
static int err_msg_counter = 0;

static const char ERR_NO_FRAME_ACTIVE[] = "No frame active.\n";
static const char ERR_FRAME_ACTIVE[] = "Frame already active.\n";


GLFWwindow *init_window(int width, int height) {
    if (glfwInit() != GL_TRUE) {
        fprintf(stderr, "Unable to create glfw window.\n");
        exit(1);
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    glfwWindowHint(GLFW_RESIZABLE, GL_TRUE);
    #ifndef __APPLE__
    GLFWwindow *window = glfwCreateWindow(width, height, "Window",
                                          NULL, NULL);
    #else
    GLFWwindow *window = glfwCreateWindow(width/2, height/2, "Window",
                                          NULL, NULL);
    #endif
    if (!window) {
        fprintf(stderr, "Unable to create glfw window.\n");
        exit(1);
    }
    glfwMakeContextCurrent(window);
    return window;
}

void compile_shader(GLuint shader_ref, const char *shader_source) {
    char buf[512];
    const char version_number_placeholder[] = "#VERSION_NUMBER_PLACEHOLDER";
    int m = 0;
    for (; m < sizeof(version_number_placeholder)-1; m++) {
        if (!shader_source[m] ||
            shader_source[m] != version_number_placeholder[m]) {
            fprintf(stderr, "Shader invalid.");
        }
    }
    for ( ; shader_source[m] != '\n'; m++) {
        if (!shader_source[m] || shader_source[m] != ' ') {
            fprintf(stderr, "Shader invalid");
            return;
        }
    }
    int size = 0;
    for (int i = 0; shader_source[i]; i++, size++);
    #ifndef __EMSCRIPTEN__
    const char version_number[] = "#version 330 core\n";
    #else
    const char version_number[] = "#version 300 es  \n";
    #endif
    char *mod_source = (char *)calloc(1 + size, sizeof(char));
    if (mod_source == NULL) {
        perror("Unable to allocate resources for shader initialization.");
        return;
    }
    int i = 0, k = 0;
    for (; shader_source[i] != '\n'; i++) {
        if (i < sizeof(version_number) - 1) {
            mod_source[k++] = version_number[i];
        }
    }
    for (; (mod_source[k] = shader_source[i]); i++, k++);
    const char *tmp = (const char *)mod_source;
    glShaderSource(shader_ref, 1, &tmp, NULL);
    free(mod_source);
    glCompileShader(shader_ref);
    GLint status;
    glGetShaderiv(shader_ref, GL_COMPILE_STATUS, &status);
    glGetShaderInfoLog(shader_ref, 512, NULL, buf);
    if (status == GL_TRUE) {
        if (buf[0] != '\0') {
            fprintf(stdout, "%s", buf);
        }
    } else {
        fprintf(stderr, "%s\n%s", "Shader compilation failed:", buf);
    }
}

GLuint make_vertex_shader(const char *v_source) {
    GLuint vs_ref = glCreateShader(GL_VERTEX_SHADER);
    if (vs_ref == 0) {
        fprintf(stderr, "unable to "
                "create vertex shader (error code %d).\n",
                glGetError());
        exit(1);
    }
    compile_shader(vs_ref, v_source);
    return vs_ref;
}


GLuint make_fragment_shader(const char *f_source) {
    GLuint fs_ref = glCreateShader(GL_FRAGMENT_SHADER);
    if (fs_ref == 0) {
        fprintf(stderr, "Error: unable to "
                "create fragment shader (error code %d).\n",
                glGetError());
        exit(1);
    }
    compile_shader(fs_ref, f_source);
    return fs_ref;
}

char *get_file_contents(const char *filename) {
    FILE *f = fopen(filename, "r");
    if (f == NULL) {
        perror("fopen");
        fclose(f);
        return NULL;
    }
    fseek(f, 0, SEEK_END);
    int file_size = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *file_buff = (char *)malloc(file_size + 1);
    if (file_buff == NULL) {
        perror("malloc");
        fclose(f);
        return NULL;
    }
    fread(file_buff, file_size, 1, f);
    file_buff[file_size] = '\0';
    fclose(f);
    return file_buff;
}


GLuint get_shader(const char *shader_loc, GLuint shader_type) {
    char *contents = get_file_contents(shader_loc);
    GLuint shader;
    if (shader_type == GL_VERTEX_SHADER) {
        shader = make_vertex_shader(contents);
    } else {
        shader = make_fragment_shader(contents);
    }
    free(contents);
    return shader;
}

GLuint get_vertex_shader(const char *shader_loc) {
    return get_shader(shader_loc, GL_VERTEX_SHADER);
}

GLuint get_fragment_shader(const char *shader_loc) {
    return get_shader(shader_loc, GL_FRAGMENT_SHADER);
}

GLuint make_program(const char *frag_shader_loc) {
    if (vertex_shader_ref < 0) {
        vertex_shader_ref = make_vertex_shader(VERTEX_SHADER_SOURCE);
    }
    GLuint vs_ref = vertex_shader_ref;
    fprintf(stdout, "Compiling %s.\n", frag_shader_loc);
    GLuint fs_ref = get_shader(frag_shader_loc, GL_FRAGMENT_SHADER);
    GLuint program = glCreateProgram();
    if (program == 0) {
        fprintf(stderr, "Unable to create program.\n");
    }
    // std::cout << program << ", " << glGetError() << std::endl;
    glAttachShader(program, vs_ref);
    glAttachShader(program, fs_ref);
    glLinkProgram(program);
    GLint status;
    char buf[512];
    glGetProgramiv(program, GL_LINK_STATUS, &status);
    glGetProgramInfoLog(program, 512, NULL, buf);
    if (status != GL_TRUE) {
        fprintf(stderr, "%s\n%s", "Failed to link program:", buf);
    }
    glUseProgram(program);
    return program;
}

GLuint make_program_from_string_source(const char *src) {
    if (vertex_shader_ref < 0) {
        vertex_shader_ref = make_vertex_shader(VERTEX_SHADER_SOURCE);
    }
    GLuint vs_ref = vertex_shader_ref;
    GLuint fs_ref = make_fragment_shader(src);
    GLuint program = glCreateProgram();
    if (program == 0) {
        fprintf(stderr, "Unable to create program.\n");
    }
    // std::cout << program << ", " << glGetError() << std::endl;
    glAttachShader(program, vs_ref);
    glAttachShader(program, fs_ref);
    glLinkProgram(program);
    GLint status;
    char buf[512];
    glGetProgramiv(program, GL_LINK_STATUS, &status);
    glGetProgramInfoLog(program, 512, NULL, buf);
    if (status != GL_TRUE) {
        fprintf(stderr, "%s\n%s", "Failed to link program:", buf);
    }
    glUseProgram(program);
    return program;
}

void quad_init_texture(const struct TextureParams *params) {
    if (current_frame_id <= 0) {
        glActiveTexture(GL_TEXTURE0);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER,
                        GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER,
                        GL_LINEAR);
        return;
    }
    glActiveTexture(GL_TEXTURE0 + current_frame_id);
    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    current_frame->texture = texture;
    if (params->type == GL_UNSIGNED_BYTE) {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB8,
                     params->width, params->height, 0, GL_RGB,
                     GL_UNSIGNED_BYTE, NULL);
        if (params->generate_mipmap) glGenerateMipmap(GL_TEXTURE_2D);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, params->wrap_s);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, params->wrap_t);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER,
                        params->min_filter);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER,
                        params->mag_filter);
    } else if (params->type == GL_FLOAT) {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F,
                     params->width, params->height, 0, GL_RGBA,
                     GL_FLOAT, NULL);
        if (params->generate_mipmap) glGenerateMipmap(GL_TEXTURE_2D);
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, params->wrap_s);
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, params->wrap_t);
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER,
                        params->min_filter);
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER,
                        params->mag_filter);
    }
}


void quad_init_objects() {
    GLuint *vao_ptr = &current_frame->vao;
    GLuint *vbo_ptr = &current_frame->vbo;
    GLuint *ebo_ptr = &current_frame->ebo;
    GLuint *fbo_ptr = &current_frame->fbo;
    GLuint *texture_ptr = &current_frame->texture;
    glGenVertexArrays(1, vao_ptr);
    glBindVertexArray(*vao_ptr);
    glGenBuffers(1, vbo_ptr);
    glBindBuffer(GL_ARRAY_BUFFER, *vbo_ptr);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices),
                    vertices, GL_STATIC_DRAW);
    glGenBuffers(1, ebo_ptr);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, *ebo_ptr);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(elements),
                 elements, GL_STATIC_DRAW);
    if (current_frame_id != 0) {
        glGenFramebuffers(1, fbo_ptr);
        glBindFramebuffer(GL_FRAMEBUFFER, *fbo_ptr);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                                GL_TEXTURE_2D, *texture_ptr, 0);
    }
}

int new_quad(const struct TextureParams *texture_params) {
    if (current_frame != NULL) {
        fprintf(stderr, ERR_FRAME_ACTIVE);
        return -1;
    }
    int quad_id = total_frames;
    total_frames += 1;
    if (total_frames == 1 && texture_params != NULL) {
        fprintf(stdout, "Params ignored for first frame.\n");
    }
    current_frame = &frames[quad_id];
    current_frame_id = quad_id;
    quad_init_texture(texture_params);
    quad_init_objects();
    unbind();
    return quad_id;
}

void bind_quad(int quad_id, GLuint program) {
    if (current_frame != NULL) {
        fprintf(stderr, ERR_FRAME_ACTIVE);
        return;
    }
    if (quad_id > total_frames || quad_id < 0) {
        fprintf(stderr, "Invalid bind.\n");
        return;
    }
    current_frame_id = quad_id;
    current_frame = &frames[quad_id];
    current_frame->program = program;
    glUseProgram(program);
    glBindVertexArray(current_frame->vao);
    glBindBuffer(GL_ARRAY_BUFFER, current_frame->vbo);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, current_frame->ebo);
    if (current_frame_id != 0) {
        glBindFramebuffer(GL_FRAMEBUFFER, current_frame->fbo);
    }
    // glActiveTexture(GL_TEXTURE0 + quad_id);
    GLint attrib = glGetAttribLocation(current_frame->program,
                                       quad_attribute_position);
    glEnableVertexAttribArray(attrib);
    glVertexAttribPointer(attrib, 3, GL_FLOAT, GL_FALSE, 3*4, 0);
}

void check_uniform_name_is_valid(const char *name, int ref) {
    if (ref < 0) {
        fprintf(stderr,
                "No such uniform \"%s\" for program %d.\n",
                name, current_frame->program);
    }
}

void set_int_uniform(const char *name, int val) {
    if (current_frame != NULL) {
        GLuint program = current_frame->program;
        GLuint loc = glGetUniformLocation(program, name);
        check_uniform_name_is_valid(name, loc);
        glUniform1i(loc, val);
        return;
    }
    if (err_msg_counter < 32) fprintf(stderr, ERR_NO_FRAME_ACTIVE);
    err_msg_counter++;
}

void set_sampler2D_uniform(const char *name, int val) {
    set_int_uniform(name, val);
}

void set_float_uniform(const char *name, float val) {
    if (current_frame != NULL) {
        GLuint program = current_frame->program;
        GLuint loc = glGetUniformLocation(program, name);
        check_uniform_name_is_valid(name, loc);
        glUniform1f(loc, val);
        return;
    }
    if (err_msg_counter < 32) fprintf(stderr, ERR_NO_FRAME_ACTIVE);
    err_msg_counter++;
}

void set_vec2_uniform(const char *name, float v0, float v1) {
    if (current_frame != NULL) {
        GLuint program = current_frame->program;
        GLuint loc = glGetUniformLocation(program, name);
        check_uniform_name_is_valid(name, loc);
        glUniform2f(loc, v0, v1);
        return;
    }
    if (err_msg_counter < 32) fprintf(stderr, ERR_NO_FRAME_ACTIVE);
    err_msg_counter++;
}

void set_vec3_uniform(const char *name, float v0, float v1, float v2) {
    if (current_frame != NULL) {
        GLuint program = current_frame->program;
        GLuint loc = glGetUniformLocation(program, name);
        check_uniform_name_is_valid(name, loc);
        glUniform3f(loc, v0, v1, v2);
        return;
    }
    if (err_msg_counter < 32) fprintf(stderr, ERR_NO_FRAME_ACTIVE);
    err_msg_counter++;
}

void set_vec4_uniform(const char *name,
                      float v0, float v1, float v2, float v3) {
    if (current_frame != NULL) {
        GLuint program = current_frame->program;
        GLuint loc = glGetUniformLocation(program, name);
        check_uniform_name_is_valid(name, loc);
        glUniform4f(loc, v0, v1, v2, v3);
        return;
    }
    if (err_msg_counter < 32) fprintf(stderr, ERR_NO_FRAME_ACTIVE);
    err_msg_counter++;
}

void print_user_defined_uniforms() {
    if (current_frame == NULL) {
        fprintf(stderr, ERR_NO_FRAME_ACTIVE);
        return;
    }
    GLsizei buf_size = 512;
    GLsizei length = 0;
    GLint size_uniform = 0;
    GLenum type;
    char name[512] = {'\0',};
    for (int index = 0; glGetError() != GL_INVALID_VALUE;
         index++) {
        glGetActiveUniform(current_frame->program, index,
                           buf_size, &length, &size_uniform,
                           &type, name);
        char *type_name;
        const char MEDP_FLOAT[] = "mediump float";
        const char HIGHP_FLOAT[] = "highp float";
        const char STR_INT[] = "int";
        const char STR_UINT[] = "uint";
        float f_param;
        float f_params[4];
        int i_param;
        switch(type) {
        case GL_FLOAT: case GL_HALF_FLOAT:
            if (type==GL_HALF_FLOAT) type_name = (char *)MEDP_FLOAT;
            if (type==GL_FLOAT) type_name = (char *)HIGHP_FLOAT;
            glGetUniformfv(current_frame->program, index,
                           &f_param);
            fprintf(stdout, "%s %s = %f\n",
                    type_name, name, f_param);
            break;
        case GL_FLOAT_VEC2: case GL_FLOAT_VEC3:
        case GL_FLOAT_VEC4:
            glGetUniformfv(current_frame->program, index,
                           f_params);
            if (type == GL_FLOAT_VEC2) {
                fprintf(stdout, "vec2 %s = vec2(%f, %f)\n", name,
                        f_params[0], f_params[1]);
            } else if (type == GL_FLOAT_VEC3) {
                fprintf(stdout, "vec3 %s = vec3(%f, %f, %f)\n", name,
                        f_params[0], f_params[1], f_params[2]);
            } else {
                fprintf(stdout, "vec4 %s = vec4(%f, %f, %f, %f)\n", name,
                        f_params[0], f_params[1], f_params[2], f_params[3]);
            }
            break;
        case GL_INT: case GL_UNSIGNED_INT:
            // case GL_SHORT: case GL_UNSIGNED_SHORT:
            if (type==GL_INT) type_name = (char *)STR_INT;
            if (type==GL_UNSIGNED_INT) type_name =  (char *)STR_UINT;
            glGetUniformiv(current_frame->program, index,
                           &i_param);
            fprintf(stdout, "%s %s = %d\n",
                    type_name, name, i_param);
            break;
        case GL_SAMPLER_2D:
            glGetUniformiv(current_frame->program, index,
                           &i_param);
            fprintf(stdout, "sampler2D %s = %d\n",
                    name, i_param);
            break;
        default:
            fprintf(stdout, "%s of type %x\n", name, type);
        }
        /*if (glGetError() != GL_INVALID_VALUE) {
            fprintf(stdout, "%s, %d\n", name, type);
            }*/
    }
    puts("");
}

void draw() {
    if (current_frame == NULL) {
        fprintf(stderr, ERR_NO_FRAME_ACTIVE);
        return;
    } else if (current_frame->frame_type == 0) {
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
    } else {
        fprintf(stderr, "Not supported\n");
        return;
    }// else if () {}
}

void unbind() {
    if (current_frame != NULL) {
        current_frame_id = -1;
        current_frame = NULL;
        glBindVertexArray(0);
        glBindBuffer(GL_ARRAY_BUFFER, 0);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glBindRenderbuffer(GL_RENDERBUFFER, 0);
        return;
    }
    fprintf(stderr, ERR_NO_FRAME_ACTIVE);
}


void draw_unbind() {
    draw();
    unbind();
}

void get_texture_array(int quad_id,
                       int x0, int y0, int width, int height,
                       int texture_type, void *array) {
    if (current_frame != NULL) {
        fprintf(stderr, ERR_FRAME_ACTIVE);
        return;
    }
    current_frame_id = quad_id;
    current_frame = &frames[quad_id];
    glBindVertexArray(current_frame->vao);
    glBindBuffer(GL_ARRAY_BUFFER, current_frame->vbo);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, current_frame->ebo);
    if (current_frame_id != 0) {
        glBindFramebuffer(GL_FRAMEBUFFER, current_frame->fbo);
    };
    glActiveTexture(GL_TEXTURE0 + current_frame_id);
    glBindTexture(GL_TEXTURE_2D, current_frame->texture);
    if (texture_type == GL_UNSIGNED_BYTE) {
        glReadPixels(x0, y0, width, height, GL_RGBA,
                     GL_UNSIGNED_BYTE, array);
    } else if (texture_type == GL_FLOAT) {
        glReadPixels(x0, y0, width, height,
                     GL_RGBA, GL_FLOAT, array);
    } else {
        fprintf(stderr, "Not supported.\n");
        unbind();
        return;
    }
    unbind();
}

void substitute_array(int quad_id, int width, int height,
                      int texture_type, void *array) {
    if (current_frame != NULL) {
        fprintf(stderr, ERR_FRAME_ACTIVE);
        return;
    }
    current_frame_id = quad_id;
    current_frame = &frames[quad_id];
    glBindVertexArray(current_frame->vao);
    glBindBuffer(GL_ARRAY_BUFFER, current_frame->vbo);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, current_frame->ebo);
    if (current_frame_id != 0) {
        glBindFramebuffer(GL_FRAMEBUFFER, current_frame->fbo);
    };
    glActiveTexture(GL_TEXTURE0 + current_frame_id);
    glBindTexture(GL_TEXTURE_2D, current_frame->texture);
    glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, width, height,
                    GL_RGBA, texture_type, array);
    // glTexImage2D(GL_TEXTURE_2D, 0, 4,
    //              width, height, 0, GL_RGBA, texture_type,
    //              array);
    // glActiveTexture(GL_TEXTURE0);
    unbind();
}

