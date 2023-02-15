#include <GLES3/gl3.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "imgui/imgui.h"
#include "imgui/backends/imgui_impl_glfw.h"
#include "imgui/backends/imgui_impl_opengl3.h"
#include "gl_wrappers/gl_wrappers.h"
#include "fft_gl.h"
#include "simulation.h"
#include "shader_templates.h"


struct ViewParams {
    bool init_potential_param_changed = false;
    bool custom_potential_desired = false;
    float wavefunction_brightness = 3.0;
    float potential_brightness = 20.0;
    int view_mode = 0;
    char potential_t_text_input[100] = {'\0',};
    char potential_x_text_input[100] = {'\0',};
    char potential_y_text_input[100] = {'\0',};
} view_params;


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
    #ifdef __APPLE__
    click->x = 2.0*click->x/(double)click->w;
    click->y = 1.0 - 2.0*click->y/(double)click->h;
    #else
    click->x = click->x/(double)click->w;
    click->y = 1.0 - click->y/(double)click->h;
    #endif
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


struct Programs programs;
struct Frames quads;
struct Bufs bufs;
struct SimParams sim_params;


bool show_license = false;
const char IMGUI_LICENSE[] =
 R"(The MIT License (MIT)

Copyright (c) 2014-2022 Omar Cornut

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 )";


int main() {

    // texel width and height for the simulation and view window
    int width = START_WIDTH, height = START_HEIGHT;
    #ifdef __APPLE__
    int view_ratio = 1024/width;
    #else
    int view_ratio = 512/width;
    #endif
    int pixel_width = 2*width*view_ratio;
    int pixel_height = height*view_ratio;

    // Start GLFW and OpenGL
    GLFWwindow *window = init_window(pixel_width, pixel_height);

    init_programs(&programs);
    init_sim_params(&sim_params);
    init_frames(&quads, &sim_params);
    init_bufs(&bufs);

    // Initialize imgui
    bool show_controls_window = true;
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    ImGui::StyleColorsClassic();
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330");
    // const char *IMGUI_LICENSE =

    glViewport(0, 0, width, height);

    // Set the potential
    init_preset_potential(&sim_params, &programs, &quads, &bufs);

    // Make reverse bit sort 2 table
    make_reverse_bit_sort_table(quads.bit_sort_table, width);

    // Initialize momentum and stuff
    init_momentum_frames(&sim_params, &quads, &bufs);

    // Initialize a wavepacket
    init_wavepacket(programs.init_dist, &sim_params,
                    quads.wavefunc[0], quads.wavefunc[1]);

    for (int k = 0; !glfwWindowShouldClose(window); k++) {

        // Process user mouse input
        if (left_click.pressed && k > 0) {
            sim_params.init_wavepacket.u0 = 2.0*left_click.x;
            sim_params.init_wavepacket.v0 = left_click.y;
            // float nx = 200.0*left_click.dx > 0.25*(float)w
            sim_params.init_wavepacket.nx = fmin(200.0*2.0*left_click.dx,
                                                 0.125*(float)width);
            sim_params.init_wavepacket.ny = fmin(200.0*left_click.dy,
                                                 0.125*(float)height);
            init_wavepacket(programs.init_dist, &sim_params,
                            quads.wavefunc[0], quads.wavefunc[1]);
            sim_params.is_initial_step = 1;
        }
        if (view_params.init_potential_param_changed) {
            view_params.init_potential_param_changed = false;
            init_preset_potential(&sim_params, &programs, &quads, &bufs);
        }
        if (view_params.custom_potential_desired) {
            view_params.custom_potential_desired = false;
            int string_size = sizeof(CUSTOM_POTENTIAL_0)
                            + sizeof(CUSTOM_POTENTIAL_1)
                            + sizeof(view_params.potential_t_text_input)
                            + sizeof(CUSTOM_POTENTIAL_2)
                            + sizeof(view_params.potential_x_text_input)
                            + sizeof(CUSTOM_POTENTIAL_3)
                            + sizeof(view_params.potential_y_text_input)
                            + sizeof(CUSTOM_POTENTIAL_4);
            char *string = (char *)calloc(string_size, sizeof(char));
            strcat(string, CUSTOM_POTENTIAL_0);
            strcat(string, CUSTOM_POTENTIAL_1);
            strcat(string, view_params.potential_x_text_input);
            strcat(string, CUSTOM_POTENTIAL_2);
            strcat(string, view_params.potential_y_text_input);
            strcat(string, CUSTOM_POTENTIAL_3);
            strcat(string, view_params.potential_t_text_input);
            strcat(string, CUSTOM_POTENTIAL_4);
            GLuint program
                 = make_program_from_string_source(string);
            if (program != 0) {
                printf("%s\n", string);
                bind_quad(quads.potential, program);
                set_float_uniform("c", sim_params.c);
                set_float_uniform("q", sim_params.q);
                set_float_uniform("m", sim_params.m);
                set_float_uniform("hbar", sim_params.hbar);
                set_float_uniform("width", sim_params.width);
                set_float_uniform("height", sim_params.height);
                draw_unbind();
                bind_quad(quads.magnetic_field, programs.curl);
                set_uniforms_dx_dy_width_height(sim_params.dx, sim_params.dy,
                                                sim_params.width, 
                                                sim_params.height);
                set_sampler2D_uniform("tex", quads.potential);
                draw_unbind();
            }
            free(string);
        }
        // Simulation part
        for (int i = 0; i < sim_params.steps_per_frame; i++) {
            if (sim_params.use_gpu_for_timestep) {
                timestep(&sim_params, &programs, &quads);
            } else {
                timestep_cpu(&sim_params, &programs, &quads, &bufs);
            }
            swap3(&quads.wavefunc[0], &quads.wavefunc[1],
                   &quads.wavefunc[2]);
            if (sim_params.is_initial_step) sim_params.is_initial_step = 0;
        }

        // Display stuff to screen

        // bind_quad(quads.view, programs.copy);
        // set_sampler2D_uniform("tex", quads.magnetic_field);
        // draw_unbind();
        bind_quad(quads.secondary_view, programs.view);
        set_int_uniform("viewMode", view_params.view_mode);
        set_float_uniform("wavefuncBrightnessScale1",
                          view_params.wavefunction_brightness);
        set_float_uniform("wavefuncBrightnessScale2",
                          view_params.wavefunction_brightness);
        set_float_uniform("potentialBrightnessScale",
                          view_params.potential_brightness);
        set_sampler2D_uniform("texWavefunc0", quads.wavefunc[0]);
        set_sampler2D_uniform("texWavefunc1", quads.wavefunc[1]);
        set_sampler2D_uniform("texWavefunc2", quads.wavefunc[2]);
        set_sampler2D_uniform("texPotential", quads.potential);
        draw_unbind();

        glViewport(0, 0, pixel_width, pixel_height);
        bind_quad(quads.main_view, programs.resize_copy);
        set_sampler2D_uniform("tex", quads.secondary_view);
        set_float_uniform("xTransform", 2.0);
        set_float_uniform("yTransform", 1.0);
        set_vec2_uniform("offset", 0.0, 0.0);
        draw_unbind();

        glfwPollEvents();

        // Process input for ImGui
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();
        if (show_controls_window) {
            ImGui::Begin("Controls", &show_controls_window);
            ImGui::Text("WIP AND INCOMPLETE");
            ImGui::Checkbox("Use GPU for numerical integration",
                            (bool *)&sim_params.use_gpu_for_timestep);
            ImGui::Checkbox("Enable spin interaction",
                            (bool *)&sim_params.enable_spin_interaction);
            ImGui::Checkbox("Use Fourier methods to handle momentum terms",
                            (bool *)&sim_params.use_ft_for_momentum_terms);
            ImGui::SliderInt("Steps per frame",
                             &sim_params.steps_per_frame, 0, 20);
            ImGui::SliderFloat("Time step size (a.u.)",
                               &sim_params.dt, -0.2, 0.2);
            ImGui::Separator();
            ImGui::Text("Dimensions");
            ImGui::Text("width w = %.3g a.u., height h = %.3g a.u.",
                        sim_params.width, sim_params.height);
            ImGui::Text("-w/2 <= x < w/2, -h/2 <= y < h/2");
            ImGui::Text("pixel width = %d, pixel height = %d",
                        sim_params.texel_width, sim_params.texel_height);
            /*ImGui::SliderFloat("Mass m (a.u.)",
                               &sim_params.m, 0.9, 10.0);
            int int_q = (int)sim_params.q;
            ImGui::SliderInt("Charge q (a.u.)",
                               &int_q, 1, 10);
            if ((float)int_q != sim_params.q) sim_params.q = (float)int_q;*/
            ImGui::Separator();
            ImGui::Text("Wavefunction");
            ImGui::Text("Spin direction on initialization");
            /*float nx, ny, nz;
            ImGui::SliderFloat("x", &nx, -1.0, 1.0);
            ImGui::SliderFloat("y", &ny, -1.0, 1.0);
            ImGui::SliderFloat("z", &nz, -1.0, 1.0);
            enum SPIN_ORIENTATION {UP=0, DOWN};
            int orientation;
            if (ImGui::RadioButton("up",
                                   orientation == UP)) orientation = UP;
            ImGui::SameLine();
            if (ImGui::RadioButton("down",
                                   orientation == DOWN)) orientation = DOWN;
            float dist = sqrt(nx*nx + ny*ny + nz*nz); 
            if (dist > 0.0) {
                struct Vec3 spin = {.x=nx/dist, .y=ny/dist, .z=nz/dist};
            }*/
            // struct Complex2 spin;
            ImGui::SliderFloat("Re(|z up>)",
                               &sim_params.init_wavepacket.spin.ind[0],
                               -1.0, 1.0);
            ImGui::SliderFloat("Im(|z up>)",
                               &sim_params.init_wavepacket.spin.ind[1],
                               -1.0, 1.0);
            ImGui::SliderFloat("Re(|z down>)",
                               &sim_params.init_wavepacket.spin.ind[2],
                               -1.0, 1.0);
            ImGui::SliderFloat("Im(|z down>)",
                               &sim_params.init_wavepacket.spin.ind[3],
                               -1.0, 1.0);
            ImGui::SliderFloat("sigma_x",
                               &sim_params.init_wavepacket.sigma_x,
                               0.01, 0.1);
            ImGui::SliderFloat("sigma_y",
                               &sim_params.init_wavepacket.sigma_y,
                               0.01, 0.1);
            ImGui::Separator();
            { // Potential
                ImGui::Text("Preset Potential");
                enum PresetPotentialWhich {
                    ZERO=0, LINEAR, QUADRATIC, SYMMETRIC,
                    AX_IS_Y2, AX_IS_Y2_AY_IS_NEG_X2,
                };
                int which = sim_params.preset_potential.which;
                float x_amplitude = sim_params.preset_potential.x_amplitude;
                float y_amplitude = sim_params.preset_potential.y_amplitude;
                if (ImGui::RadioButton("Free (Periodic)",
                                       which == ZERO)) which = ZERO;
                // if (ImGui::RadioButton("Linear, a_x (x/width) + a_y (y/height)",
                //                        which == LINEAR)) which = LINEAR;
                if (ImGui::RadioButton("Quadratic, "
                                       "A_t = a_x (x/w)^2 + a_y (y/h)^2",
                                       which == QUADRATIC)) which = QUADRATIC;
                if (ImGui::RadioButton("Vector Potential, "
                                       "A_x = a_x qc(y/h), A_y = -a_y qc(x/w)",
                                       which == SYMMETRIC)) which = SYMMETRIC;
                if (ImGui::RadioButton("Vector Potential, A_x = a_x qc(y/h)^2,"
                                       " A_t = 0",
                                       which == AX_IS_Y2)) which = AX_IS_Y2;
                if (ImGui::RadioButton("Vector Potential, "
                                       "A_x = a_x qc(y/h)^2, "
                                       "A_y = -a_y qc(x/w)^2",
                                       which == AX_IS_Y2_AY_IS_NEG_X2))
                    which = AX_IS_Y2_AY_IS_NEG_X2;
                ImGui::SliderFloat("a_x", &x_amplitude, -20.0, 20.0);
                ImGui::SliderFloat("a_y", &y_amplitude, -20.0, 20.0);
                if (x_amplitude != sim_params.preset_potential.x_amplitude ||
                    y_amplitude != sim_params.preset_potential.y_amplitude ||
                    which != sim_params.preset_potential.which) {
                    sim_params.preset_potential.which = which;
                    sim_params.preset_potential.x_amplitude = x_amplitude;
                    sim_params.preset_potential.y_amplitude = y_amplitude;
                    view_params.init_potential_param_changed = true;
                    puts("potential changed");
                }
                ImGui::Separator();
                ImGui::Text("Custom Potential");
                ImGui::Text("Only texture coordinates u = x/w and v = y/h"
                            " are accepted,\n"
                            "where -0.5 <= u < 0.5, -h/2 <= v < h/2.");
                ImGui::InputText("V(u, v)", 
                                 view_params.potential_t_text_input,
                                 IM_ARRAYSIZE(view_params
                                              .potential_t_text_input));
                ImGui::InputText("A_x(u, v)", 
                                 view_params.potential_x_text_input,
                                 IM_ARRAYSIZE(view_params.
                                              potential_x_text_input));
                ImGui::InputText("A_y(u, v)", 
                                 view_params.potential_y_text_input,
                                 IM_ARRAYSIZE(view_params.
                                 potential_y_text_input));
                if (ImGui::Button("Accept"))
                    view_params.custom_potential_desired = true;
                /*printf("%s\n%s\n%s\n", 
                       view_params.potential_t_text_input, 
                       view_params.potential_x_text_input, 
                       view_params.potential_y_text_input);*/
            };
            ImGui::Separator();
            ImGui::Text("Visualization Options");
            ImGui::SliderFloat("Wavefunction brightness",
                               &view_params.wavefunction_brightness,
                               0.0, 20.0);
            ImGui::SliderFloat("Potential brightness",
                               &view_params.potential_brightness,
                               0.0, 20.0);
            enum ViewModeSelect {
                DENSITY_PHASE1 = 0, DENSITY_PHASE2,
                DENSITY1, DENSITY2, DENSITY_PHASE_ALL,
                DENSITY_ALL, DENSITY_ALL_DIFF_COLOURS, SPIN
            };
            int *view_mode = &view_params.view_mode;
            if (ImGui::RadioButton("density+phase z up",
                                   *view_mode == DENSITY_PHASE1)) {
                *view_mode = DENSITY_PHASE1;
            }
            if (ImGui::RadioButton("density+phase z down",
                                   *view_mode == DENSITY_PHASE2)) {
                *view_mode = DENSITY_PHASE2;
            }
            if (ImGui::RadioButton("density z up",
                                   *view_mode == DENSITY1)) {
                *view_mode = DENSITY1;
            }
            if (ImGui::RadioButton("density z down",
                                   *view_mode == DENSITY2)) {
                *view_mode = DENSITY2;
            }
            if (ImGui::RadioButton("density+phase both",
                                   *view_mode == DENSITY_PHASE_ALL)) {
                *view_mode = DENSITY_PHASE_ALL;
            }
            if (ImGui::RadioButton("density",
                                   *view_mode == DENSITY_ALL)) {
                *view_mode = DENSITY_ALL;
            }
            if (ImGui::RadioButton("density, red z up, blue z down",
                                   *view_mode == DENSITY_ALL_DIFF_COLOURS)) {
                *view_mode = DENSITY_ALL_DIFF_COLOURS;
            }
            if (ImGui::RadioButton("spin",
                                   *view_mode == SPIN)) {
                *view_mode = SPIN;
            }
            ImGui::Separator();
            ImGui::Text("This UI interface was created using ImGui.");
            if (ImGui::Button("About ImGui")) show_license = !show_license;
            if (show_license) {
                ImGui::Text("%s\n", IMGUI_LICENSE);
            }
            ImGui::End();
        }
        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());


        /*if (glfwGetKey(window, GLFW_KEY_Q) == GLFW_PRESS)
            sim_params.use_ft_for_momentum_terms = 0;
        else if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
            sim_params.use_ft_for_momentum_terms = 1;
        if (glfwGetKey(window, GLFW_KEY_1) == GLFW_PRESS)
            sim_params.enable_spin_interaction = 0;
        else if (glfwGetKey(window, GLFW_KEY_2) == GLFW_PRESS)
            sim_params.enable_spin_interaction = 1;
        if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
            sim_params.use_gpu_for_timestep = 0;
        else if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
            sim_params.use_gpu_for_timestep = 1;
        if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
            sim_params.use_gpu_for_timestep = 0;
        else if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
            sim_params.use_gpu_for_timestep = 1;
        if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS) {
            sim_params.steps_per_frame++;
            if (sim_params.steps_per_frame > 20)
                sim_params.steps_per_frame = 20;
        } else if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS) {
            sim_params.steps_per_frame--;
            if (sim_params.steps_per_frame < 0)
                sim_params.steps_per_frame = 0;
        }*/
        if (!io.WantCaptureMouse) click_update(&left_click, window);
        glViewport(0, 0, width, height);
        glfwSwapBuffers(window);
    }
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;

}
