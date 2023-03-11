SHELL = /bin/bash
FLAGS = -O0 -Wall -g
# COMPILE = gcc
COMPILE = clang

# For Linux the prerequisite installs are OpenGL with GLEW and GLFW.
ifeq ($(shell uname), Linux)
INCLUDE =  -I${PWD} -I${PWD}/gl_wrappers
LIBS = -lm -lGL -lGLEW -lglfw
endif

# For MacOS you must first install the relavent OpenGL and GLFW libraries.
# If you installed the libraries through Homebrew you will probably first
# need to know the location of the Homebrew developement files, which varies
# from installation to installation, and then edit the INCLUDE and LIBS
# variables accordingly.
ifeq ($(shell uname),Darwin)
INCLUDE =  -I${PWD} -I${PWD}/gl_wrappers -I/opt/homebrew/include\
					 -I/usr/local/include
LIBS = -ldl -L/opt/homebrew/lib -L/usr/local/include -lglfw\
       -framework CoreVideo -framework OpenGL -framework IOKit\
       -framework Cocoa -framework Carbon
endif

TARGET = ${PWD}/program

WEB_TARGET = main.js

SOURCES = ${PWD}/gl_wrappers/gl_wrappers.c summation_gl.c simulation.c\
	init_render.c  main.c
OBJECTS = gl_wrappers.o summation_gl.o simulation.o init_render.o main.o


all: ${TARGET}

${TARGET}: ${OBJECTS}
	${COMPILE} ${FLAGS} -o $@ $^ ${LIBS}

${WEB_TARGET}: ${SOURCES}
	EMCC_DEBUG=1
	emcc -o $@ $^ ${INCLUDE} -v -s WASM=1 -s USE_GLFW=3 -s FULL_ES3=1 \
		-s TOTAL_MEMORY=100MB --embed-file shaders

${OBJECTS}: ${SOURCES}
	${COMPILE} ${FLAGS} -c $^ ${INCLUDE}

clean:
	rm -f *.o *.wasm *.js ${TARGET}
