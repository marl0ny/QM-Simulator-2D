
SHELL = /bin/bash
FLAGS = -O2 -Wall
# FLAGS = -O0 -Wall -g
C_COMPILE = /usr/bin/clang
CPP_COMPILE = /usr/bin/clang++ -std=c++17
LINKER = /usr/bin/ld

IMGUI_DIR = ${PWD}/imgui
IMGUI_SOURCES = ${IMGUI_DIR}/imgui.cpp ${IMGUI_DIR}/imgui_draw.cpp \
                ${IMGUI_DIR}/backends/imgui_impl_glfw.cpp \
                ${IMGUI_DIR}/backends/imgui_impl_opengl3.cpp \
                ${IMGUI_DIR}/imgui_tables.cpp \
                ${IMGUI_DIR}/imgui_widgets.cpp
IMGUI_OBJECTS = imgui.o imgui_draw.o imgui_impl_glfw.o imgui_impl_opengl3.o \
                imgui_tables.o imgui_widgets.o

MACOSX_HOMEBREW = sure

ifdef MACOSX_HOMEBREW
INCLUDE =  -I${PWD} -I${PWD}/gl_wrappers -I${PWD}/complex2 \
           -I${IMGUI_DIR} -I${IMGUI_DIR}/backends -I/opt/homebrew/include
LIBS = -ldl -L/opt/homebrew/lib -lglfw\
       -framework CoreVideo -framework OpenGL -framework IOKit\
       -framework Cocoa -framework Carbon
else
INCLUDE =  -I${PWD} -I${PWD}/gl_wrappers -I${PWD}/complex2 \
           -I${IMGUI_DIR} -I${IMGUI_DIR}/backends
LIBS = -ldl -lm -lGL -lGLEW -lglfw -fopenmp=libiomp5
endif

TARGET = ${PWD}/program

WEB_TARGET = main.js

C_SOURCES = ${PWD}/gl_wrappers/gl_wrappers.c ${PWD}/complex2/fft.c \
            ${PWD}/complex2/stencils.c ${PWD}/fft_gl.c ${PWD}/summation_gl.c \
            simulation.c

CPP_SOURCES = view.cpp

OBJECTS = view.o gl_wrappers.o fft.o stencils.o fft_gl.o summation_gl.o \
          simulation.o


all: ${TARGET}

${TARGET}: ${OBJECTS} ${IMGUI_OBJECTS}
	${CPP_COMPILE} ${FLAGS} -o $@ $^ ${LIBS}

${WEB_TARGET}: ${C_SOURCES} ${CPP_SOURCES} ${IMGUI_SOURCES}
	emcc -o $@ $^ ${INCLUDE} -v -s WASM=1 -s USE_GLFW=3 -s FULL_ES3=1 \
    -s TOTAL_MEMORY=100MB --embed-file shaders

${IMGUI_SOURCES}:
	wget "https://github.com/ocornut/imgui/archive/refs/heads/master.zip"
	unzip master.zip
	mv ./imgui-master ./imgui

${IMGUI_OBJECTS}: ${IMGUI_SOURCES}
	${CPP_COMPILE} ${FLAGS} -c $^ ${INCLUDE}


${OBJECTS}: ${C_SOURCES} ${CPP_SOURCES} ${IMGUI_OBJECTS}
	${C_COMPILE} ${FLAGS} -c ${C_SOURCES} ${INCLUDE}
	${CPP_COMPILE} ${FLAGS} -c ${CPP_SOURCES} ${INCLUDE}

clean:
	rm -f ${OBJECTS} ${TARGET}

clean_all:
	rm -rf *.o *.zip *.wasm *.js ${TARGET} ${IMGUI_DIR} *.zip

