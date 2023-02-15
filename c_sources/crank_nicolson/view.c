#include <GLES3/gl3.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "gl_wrappers/gl_wrappers.h"
#include "summation_gl.h"
#include "simulation.h"


struct Click {
    double x, y;
    double dx, dy;
    int pressed;
    int released;
    int w, h;
} left_click;

void click_update(struct Click *click, GLFWwindow *window) {
    double prev_x = click->x;
    double prev_y = click->y;
    glfwGetFramebufferSize(window, &click->w, &click->h);
    glfwGetCursorPos(window, &click->x, &click->y);
    click->x = click->x/(double)click->w;
    click->y = 1.0 - click->y/(double)click->h;
    click->dx = click->x - prev_x;
    click->dy = click->y - prev_y;
    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_1) == GLFW_PRESS) {
        click->pressed = 1;
    } else {
        if (click->released) click->released = 0;
        if (click->pressed) click->released = 1;
        click->pressed = 0;
    }
}

struct SimParams sim_params;
struct Programs programs;
struct Frames quads;


int main() {
    int width = START_WIDTH, height = START_HEIGHT;
    #ifndef __APPLE__
    int view_ratio = 512/width;
    #else
    int view_ratio = 1024/width;
    #endif
    int pixel_width = view_ratio*START_WIDTH;
    int pixel_height = view_ratio*START_HEIGHT;
    GLFWwindow *window = init_window(pixel_width, pixel_height);

    init_sim_params(&sim_params);
    init_programs(&programs);
    init_frames(&quads, &sim_params);

    glViewport(0, 0, width, height);

    for (int i = 0; i < 2; i++) {
        bind_quad(quads.wavefunc[i], programs.init_dist);
        set_float_uniform("amplitude", sim_params.init_wavepacket.amplitude);
        set_float_uniform("sigma_x", sim_params.init_wavepacket.sigma_x);
        set_float_uniform("sigma_y", sim_params.init_wavepacket.sigma_y);
        set_float_uniform("u0", sim_params.init_wavepacket.u0);
        set_float_uniform("v0", sim_params.init_wavepacket.v0);
        set_float_uniform("nx", sim_params.init_wavepacket.nx);
        set_float_uniform("ny", sim_params.init_wavepacket.ny);
        set_vec4_uniform("spin",
                         sim_params.init_wavepacket.spin.ind[0],
                         sim_params.init_wavepacket.spin.ind[1],
                         sim_params.init_wavepacket.spin.ind[2],
                         sim_params.init_wavepacket.spin.ind[3]);
        draw_unbind();
    }

    bind_quad(quads.potential, programs.preset_potential);
    set_float_uniform("xAmplitude", 1.5);
    set_float_uniform("yAmplitude", 1.5);
    set_float_uniform("c", 137.036);
    set_float_uniform("hbar", sim_params.hbar);
    set_float_uniform("q", 1.0);
    set_float_uniform("m", sim_params.m);
    set_float_uniform("width", sim_params.width);
    set_float_uniform("height", sim_params.height);
    set_int_uniform("which", 2);
    draw_unbind();


    for (int k = 0; !glfwWindowShouldClose(window); k++) {
        glViewport(0, 0, width, height);
        if (left_click.pressed && k >= 0) {
            // TODO
        } else {
            // TODO
        }

        glViewport(0, 0, width, height);
        timestep(&sim_params, &programs, &quads);

        glViewport(0, 0, pixel_width, pixel_height);
        bind_quad(quads.main_view, programs.view);
        set_float_uniform("wavefuncBrightnessScale1", 5.0);
        set_float_uniform("wavefuncBrightnessScale2", 5.0);
        set_float_uniform("potentialBrightnessScale", 10.0);
        set_sampler2D_uniform("texWavefunc0", quads.wavefunc[0]);
        set_sampler2D_uniform("texWavefunc1", quads.wavefunc[0]);
        set_sampler2D_uniform("texWavefunc2", quads.wavefunc[0]);
        set_sampler2D_uniform("texPotential", quads.potential);
        draw_unbind();
        glfwPollEvents();
        glfwSwapBuffers(window);
    }
    glfwDestroyWindow(window);
    glfwTerminate();
}
