#include "gl_wrappers/gl_wrappers.h"
#include "simulation.h"
#include "init_render.h"
#include <stdio.h>

struct ViewParams {
    int view_width, view_height;
} s_render_params = {};

struct RenderFrames {
    frame_id main_view;
} s_render_frames = {};

struct ViewPrograms {
    frame_id view;
} s_view_programs = {};


static SimFrames s_sim_frames = {};
static SimParams s_sim_params = {};
static SimPrograms s_sim_programs = {};


void init() {
    #ifndef __APPLE__
    s_render_params.view_width = 512;
    s_render_params.view_height = 512;
    #else
    s_render_params.view_width = 1024;
    s_render_params.view_height = 1024;
    #endif
    init_sim_programs(&s_sim_programs);
    s_view_programs.view = make_quad_program("./shaders/view.frag");
    init_sim_params(&s_sim_params);
    s_render_frames.main_view = new_quad(NULL);
    glViewport(0, 0, s_sim_params.texel_width, s_sim_params.texel_height);
    init_sim_frames(&s_sim_frames, &s_sim_params);
    init_psi_potential(&s_sim_frames, &s_sim_programs, &s_sim_params);
}

void render(RenderParams *render_params) {
    glViewport(0, 0, s_sim_params.texel_width, s_sim_params.texel_height);
    for (int i = 0; i < 5; i++) {
        timestep(&s_sim_frames, &s_sim_programs, &s_sim_params);
    }
    glViewport(0, 0, s_render_params.view_width, s_render_params.view_height);
    bind_quad(s_render_frames.main_view, s_view_programs.view);
    set_sampler2D_uniform("tex", s_sim_frames.psi_potential[0]);
    draw_unbind_quad();
}
