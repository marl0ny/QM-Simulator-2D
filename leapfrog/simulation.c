#include "simulation.h"
#include <stdio.h>
#include <stdlib.h>
#include <math.h>


static int s_sizeof_vertices = 0;
static int s_sizeof_elements = 0;
static float t = 0.0;

// static int sim_width;
// static int sim_height;


void init_sim_params(struct SimParams *params) {
    int width = 256;
    int height = 256;
    params->enable_spin_interaction = 0;
    params->steps_per_frame = 6;
    params->is_initial_step = 1;
    params->texel_width = 256;
    params->texel_height = 256;
    #ifdef __APPLE__
    int pixel_width = 5*width;
    int pixel_height = 5*height;
    #else
    int pixel_width = 3*width;
    int pixel_height = 3*height;
    #endif
    params->view_width = pixel_width;
    params->view_height = pixel_height;
    params->dt = 0.005;
    params->m = 1.0;
    params->hbar = 1.0;
    params->c = 137.036;
    params->q = 1.0;
    params->width = 50.0;
    params->height = 50.0;
    params->dx = params->width/(float)params->texel_width;
    params->dy = params->height/(float)params->texel_height;
    params->new_wavepacket.amplitude = 5.0;
    params->new_wavepacket.sigma_x = 0.05;
    params->new_wavepacket.sigma_y = 0.05;
    params->new_wavepacket.u0 = 0.5;
    params->new_wavepacket.v0 = 0.2;
    params->new_wavepacket.nx = 0.0;
    params->new_wavepacket.ny = 20.0;
    params->new_wavepacket.spin.c2[0] = 1.0;
    params->new_wavepacket.spin.c2[1] = 0.0;
    params->new_wavepacket.spin_direction.x = 0.0;
    params->new_wavepacket.spin_direction.y = 0.0;
    params->new_wavepacket.spin_direction.z = 0.0;
    params->rotation_quaternion.x = 0.0;
    params->rotation_quaternion.y = 0.0;
    params->rotation_quaternion.z = 0.0;
    params->rotation_quaternion.w = 1.0;
    params->scale_z = 0.05;
    params->scale = 1.0;
}

void init_programs(struct Programs *programs) {
    programs->zero = make_quad_program("./shaders/zero.frag");
    programs->copy = make_quad_program("./shaders/copy.frag");
    programs->scale = make_quad_program("./shaders/scale.frag");
    programs->leapfrog = make_quad_program("./shaders/leapfrog.frag");
    programs->new_wavepacket
        = make_quad_program("./shaders/new-wavepacket.frag");
    programs->surface_vert
        = make_program("./shaders/surface-vert.vert", "./shaders/copy.frag");
    programs->view = make_quad_program("./shaders/view.frag");
    programs->preset_potential
         = make_quad_program("./shaders/preset-potential.frag");
}

void init_frames(struct Frames *frames, const struct SimParams *params) {
    int width = params->texel_width;
    int height = params->texel_height;
    int pixel_width = params->view_width;
    int pixel_height = params->view_height;
    struct TextureParams tex_params = {
        .type=GL_FLOAT, .width=pixel_width, .height=pixel_height,
        .generate_mipmap=1, .wrap_s=GL_REPEAT, .wrap_t=GL_REPEAT,
        .min_filter=GL_LINEAR, .mag_filter=GL_LINEAR,
    };
    frames->view.main = new_quad(&tex_params);
    tex_params.width = width;
    tex_params.height = height;
    for (int i = 1; i < 3; i++) {
        frames->view.secondary[i] = new_quad(&tex_params);
    }

    // Surface plot view
    int surface_width = 64;
    int surface_height = 64;
    int sizeof_vertices = 4*sizeof(float)*(surface_width)*(surface_height);
    s_sizeof_vertices = sizeof_vertices;
    struct Vec4 *vertices = malloc(sizeof_vertices);
    if (vertices == NULL) {
        perror("malloc");
        return;
    }
    for (int i = 0; i < surface_width; i++) {
        for (int j = 0; j < surface_height; j++) {
            vertices[j*surface_width + i].x = (float)i/(float)surface_width;
            vertices[j*surface_width + i].y = (float)j/(float)surface_height;
            vertices[j*surface_width + i].z = 0.0;
            vertices[j*surface_width + i].a = 1.0;
        }
    }
    int sizeof_elements = sizeof(int)*6*(surface_width-1)*(surface_height-1);
    s_sizeof_elements = sizeof_elements;
    int *elements = malloc(sizeof_elements);
    if (elements == NULL) {
        perror("malloc");
        return;
    }
    int inc = 1;
    int j = 0;
    int elem_index = 0;
    for (int i = 0; j < surface_height - 1; i += inc) {
        // Draw two triangles encompassed by the square that's formed by the
        // vertices at index j*surface_width + i, j*surface_width + (i + 1),
        // (j + 1)*surface_width + i, (j + 1)*surface_width + (i + 1)
        elements[elem_index++] = j*surface_width + i;
        elements[elem_index++] = j*surface_width + i + 1;
        elements[elem_index++] = (j + 1)*surface_width + i + 1;
        elements[elem_index++] = (j + 1)*surface_width + i + 1;
        elements[elem_index++] = j*surface_width + i;
        elements[elem_index++] = (j + 1)*surface_width + i;
        if (i == 0) {
            if (inc == -1) {
                inc = 0;
                j++;
            } else if (inc == 0) {
                inc = 1;
            }
        } else if (i == surface_width - 2) {
            if (inc == 1) {
                inc = 0;
                j++;
            } else if (inc == 0) {
                inc = -1;
            }
        }
        // printf("%d\n", i);
    }
    frames->view.secondary[0] = new_frame(&tex_params, (float *)vertices,
                                          sizeof_vertices, elements,
                                          sizeof_elements);

    // Rest of the simulation frames
    frame_id *sim_frames = (frame_id *)&frames->sim;
    for (int i = 0; i < 6; i++) {
        sim_frames[i] = new_quad(&tex_params);
    }

}

void set_uniforms_dx_dy_width_height(float dx, float dy,
                                     float width, float height) {
    set_float_uniform("dx", dx);
    set_float_uniform("dy", dy);
    set_float_uniform("width", width);
    set_float_uniform("height", height);
}

void new_wavepacket(GLuint new_wavepacket_program,
                    const struct SimParams *params, frame_id f1, frame_id f2) {
    frame_id frames[2] = {f1, f2};
    for (int i = 0; i < 2; i++) {
        frame_id frame = frames[i];
        bind_quad(frame, new_wavepacket_program);
        set_float_uniform("amplitude", params->new_wavepacket.amplitude);
        set_float_uniform("sigma_x", params->new_wavepacket.sigma_x);
        set_float_uniform("sigma_y", params->new_wavepacket.sigma_y);
        set_float_uniform("u0", params->new_wavepacket.u0);
        set_float_uniform("v0", params->new_wavepacket.v0);
        set_float_uniform("nx", params->new_wavepacket.nx);
        set_float_uniform("ny", params->new_wavepacket.ny);
        set_vec4_uniform("spin",
                         params->new_wavepacket.spin.re1,
                         params->new_wavepacket.spin.im1,
                         params->new_wavepacket.spin.re2,
                         params->new_wavepacket.spin.im2);
        print_user_defined_uniforms();
        draw_unbind_quad();
    }
}

void swap3(frame_id *f1, frame_id *f2, frame_id *f3) {
    frame_id tmp1 = *f1, tmp2 = *f2, tmp3 = *f3;
    *f1 = tmp2, *f2 = tmp3, *f3 = tmp1;
}

void timestep(const struct SimParams *params,
              const struct Programs *programs,
              const struct Frames *quads) {
    t += 0.0001;
    bind_quad(quads->sim.wavefunc[2], programs->leapfrog);
    set_float_uniform("c", params->c);
    set_float_uniform("hbar", params->hbar);
    set_float_uniform("q", params->q);
    set_float_uniform("m", params->m);
    set_float_uniform("dt", params->dt*((params->is_initial_step)? 0.5: 1.0));
    set_uniforms_dx_dy_width_height(params->dx, params->dy,
                                    params->width, params->height);
    set_sampler2D_uniform("wavefuncTex0", quads->sim.wavefunc[0]);
    set_sampler2D_uniform("wavefuncTex1", quads->sim.wavefunc[1]);
    set_sampler2D_uniform("potentialTex", quads->sim.potential);
    set_int_uniform("useFTForMomentumTerms", 0);
    set_sampler2D_uniform("p2wavefuncTex", 0);
    set_sampler2D_uniform("gradXWavefuncTex", 0);
    set_sampler2D_uniform("gradYWavefuncTex", 0);
    set_int_uniform("enableBFieldSpinInteraction", 0);
    set_sampler2D_uniform("magneticFieldTex", 0);
    set_int_uniform("addNonlinearTerms", 0);
    // print_user_defined_uniforms();
    draw_unbind_quad();
    struct VertexParam vertex_params[2] = {
        {.name="position", .size=4, .type=GL_FLOAT, .normalized=GL_FALSE,
         .stride=4*sizeof(float), .offset=0},
    };
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);
    bind_frame(quads->view.secondary[0], programs->surface_vert);
    set_vertex_attributes(vertex_params, 1);
    set_sampler2D_uniform("tex", quads->view.secondary[1]);
    set_sampler2D_uniform("tex2", quads->sim.wavefunc[0]);
    // float c_phi = (float)cos(t + 3.14159/2.0);
    // float s_phi = (float)sin(t + 3.14159/2.0);
    set_float_uniform("scaleZ", params->scale_z);
    set_float_uniform("scale", params->scale);
    set_vec4_uniform("rotationQuaternion",
                     params->rotation_quaternion.x,
                     params->rotation_quaternion.y,
                     params->rotation_quaternion.z,
                     params->rotation_quaternion.w);
    set_vec3_uniform("translate",
                     params->translate.x, 
                     params->translate.y, params->translate.z);
    glDrawElements(GL_TRIANGLES, s_sizeof_elements, GL_UNSIGNED_INT, 0);
    unbind();
    glDisable(GL_DEPTH_TEST);
}
