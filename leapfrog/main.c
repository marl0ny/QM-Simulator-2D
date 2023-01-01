#include <GLES3/gl3.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#include "gl_wrappers/gl_wrappers.h"
#include "interface.h"

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


int main() {
    #ifdef __APPLE__
    int pixel_width = 256*5;
    int pixel_height = 256*5;
    #else
    int pixel_width = 256*3;
    int pixel_height = 256*3;
    #endif
    GLFWwindow *window = init_window(pixel_width, pixel_height);
    init();
    struct RenderParams render_params = {};
    for (int k = 0; !glfwWindowShouldClose(window); k++) {
        if (left_click.pressed) {
            render_params.user_use = 1;
            render_params.user_x = left_click.x;
            render_params.user_y = left_click.y;
            render_params.user_dx = -left_click.dx;
            render_params.user_dy = -left_click.dy;
        } else {
            render_params.user_use = 0;
        }
        render(&render_params);
        glfwPollEvents();
        click_update(&left_click, window);

        if (glfwGetKey(window, GLFW_KEY_R) == GLFW_PRESS)
            render_params.user_zoom = 1;
        else if (glfwGetKey(window, GLFW_KEY_F) == GLFW_PRESS)
            render_params.user_zoom = -1;
        else
            render_params.user_zoom = 0;
        
        if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
            render_params.user_surface_enlarge = 1;
        else if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
            render_params.user_surface_enlarge = -1;
        else
            render_params.user_surface_enlarge = 0;

        if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS ||
            glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS || 
            glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS || 
            glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) {
            if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
                render_params.user_direction_y = -1;
            else if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
                render_params.user_direction_x = 1;
            else if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
                render_params.user_direction_y = 1;
            else if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
                render_params.user_direction_x = -1;
        } else {
            render_params.user_direction_x = 0;
            render_params.user_direction_y = 0;
        }
        
        glfwSwapBuffers(window);
    }
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}
