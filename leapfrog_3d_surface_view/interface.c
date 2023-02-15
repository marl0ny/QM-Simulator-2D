#include "simulation.h"
#include <math.h>
#include "interface.h"
#include <stdio.h>


static struct Programs s_programs = {};
static struct SimParams s_sim_params = {};
static struct Frames s_frames = {};


void init() {
    init_programs(&s_programs);
    init_sim_params(&s_sim_params);
    init_frames(&s_frames, &s_sim_params);
    glViewport(0, 0, s_sim_params.texel_width, s_sim_params.texel_height);
    bind_quad(s_frames.sim.potential, s_programs.zero);
    draw_unbind_quad();
    bind_quad(s_frames.sim.magnetic_field, s_programs.zero);
    draw_unbind_quad();
    bind_quad(s_frames.sim.current, s_programs.zero);
    draw_unbind_quad();
    new_wavepacket(s_programs.new_wavepacket, &s_sim_params,
                   s_frames.sim.wavefunc[0], s_frames.sim.wavefunc[1]);
    bind_quad(s_frames.sim.potential, s_programs.preset_potential);
    set_float_uniform("xAmplitude", 40.0);
    set_float_uniform("yAmplitude", 40.0);
    set_float_uniform("c", 137.036);
    set_float_uniform("hbar", 1.0);
    set_float_uniform("q", 1.0);
    set_float_uniform("m", 1.0);
    set_float_uniform("width", s_sim_params.width);
    set_float_uniform("height", s_sim_params.height);
    set_int_uniform("which", 6);
    print_user_defined_uniforms();
    draw_unbind_quad();
    timestep(&s_sim_params, &s_programs, &s_frames);
    swap3(&s_frames.sim.wavefunc[0], &s_frames.sim.wavefunc[1],
          &s_frames.sim.wavefunc[2]);
    s_sim_params.is_initial_step = 0;

}

static struct DVec3 normalize(struct DVec3 r) {
    double norm = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
    struct DVec3 v = {.x=r.x/norm, .y=r.y/norm, .z=r.z/norm};
    return v;
}

double length(struct DVec3 r) {
    return sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
}

static struct DVec4 quaternion_multiply(struct DVec4 q1, struct DVec4 q2) {
    struct DVec4 q3 = {
        .w = q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z,
        .x = q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y, 
        .y = q1.w*q2.y + q1.y*q2.w + q1.z*q2.x - q1.x*q2.z, 
        .z = q1.w*q2.z + q1.z*q2.w + q1.x*q2.y - q1.y*q2.x,
    };
    return q3; 
}

static struct DVec3 cross_product(struct DVec3 r1, struct DVec3 r2) {
    struct DVec3 r3 = {
        .x = r1.y*r2.z - r1.z*r2.y,
        .y = - r1.x*r2.z + r1.z*r2.x,
        .z = r1.x*r2.y - r1.y*r2.x,
    };
    return r3;
}

static struct DVec4 
rotation_axis_to_quaternion(double angle, struct DVec3 axis) {
    double norm = sqrt(axis.x*axis.x + axis.y*axis.y + axis.z*axis.z);
    for (int i = 0; i < 3; i++) {
        axis.ind[i] = axis.ind[i]/norm;
    }
    double c = cos(angle/2.0);
    double s = sin(angle/2.0);
    struct DVec4 res = {.x=s*axis.x, .y=s*axis.y, .z=s*axis.z, .w=c};
    return res;
}

void render(const struct RenderParams *render_params) {

    if (render_params->user_use && 
        (render_params->user_dx != 0.0 || render_params->user_dy != 0.0)) {
        double angle = 4.0*sqrt(
            render_params->user_dx*render_params->user_dx
             + render_params->user_dy*render_params->user_dy);
        struct DVec3 to_camera = {.x=0.0, .y=0.0, .z=1.0};
        struct DVec3 vel = {.x=render_params->user_dx, 
                            .y=render_params->user_dy,
                            .z=0.0};
        struct DVec3 unorm_axis = cross_product(vel, to_camera);
        struct DVec3 axis = normalize(unorm_axis);
        if (length(axis) > (1.0 - 1e-10)
             && length(axis) < (1.0 + 1e-10)) {
            struct DVec4 q_axis = rotation_axis_to_quaternion(angle, axis);
            struct DVec4 tmp = quaternion_multiply(
                s_sim_params.rotation_quaternion, q_axis);
            s_sim_params.rotation_quaternion.x = tmp.x;
            s_sim_params.rotation_quaternion.y = tmp.y;
            s_sim_params.rotation_quaternion.z = tmp.z;
            s_sim_params.rotation_quaternion.w = tmp.w;
        }

    }

    s_sim_params.scale = render_params->user_zoom;

    if (render_params->user_surface_enlarge == 1) {
        s_sim_params.scale_z *= 1.01;
    } else if (render_params->user_surface_enlarge == -1) {
        s_sim_params.scale_z *= 0.99;
    }
    
    s_sim_params.translate.x += 0.01*(float)render_params->user_direction_x;
    s_sim_params.translate.z += 0.01*(float)render_params->user_direction_y;

    glViewport(0, 0, s_sim_params.texel_width, s_sim_params.texel_height);

    for (int i = 0; i < s_sim_params.steps_per_frame; i++) {
        timestep(&s_sim_params, &s_programs, &s_frames);
        swap3(&s_frames.sim.wavefunc[0], &s_frames.sim.wavefunc[1],
              &s_frames.sim.wavefunc[2]);
    }

    // bind_quad(s_frames.view.main, s_programs.copy);
    // set_sampler2D_uniform("tex", s_frames.sim.wavefunc[0]);
    // draw_unbind_quad();


    bind_quad(s_frames.view.secondary[1], s_programs.view);
    set_int_uniform("viewMode", 0);
    set_float_uniform("wavefuncBrightnessScale1", 1.0);
    set_float_uniform("wavefuncBrightnessScale2", 1.0);
    set_float_uniform("potentialBrightnessScale", 1.0);
    set_sampler2D_uniform("texWavefunc0", s_frames.sim.wavefunc[0]);
    set_sampler2D_uniform("texWavefunc1", s_frames.sim.wavefunc[1]);
    set_sampler2D_uniform("texWavefunc2", s_frames.sim.wavefunc[2]);
    set_sampler2D_uniform("texPotential", s_frames.sim.potential);
    draw_unbind_quad();

    glViewport(0, 0, s_sim_params.view_width, s_sim_params.view_height);
    bind_quad(s_frames.view.main, s_programs.copy);
    set_sampler2D_uniform("tex", s_frames.view.secondary[0]);
    draw_unbind_quad();

}
