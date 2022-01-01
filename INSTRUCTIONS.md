# Instructions
On start up, the application displays the wavefunction in an embedded Harmonic Oscillator potential, where the brightness and colour of the wavefunction corresponds to its probability density and complex phase. Click anywhere to initialize a new wavefunction, where the movement of the mouse when pressed determines the initial momentum of the wavefunction.

On the upper right are the user interface controls. These are:
- **Instructions**. Link to this document.
- **Source**. Link to the source code.
- **Brightness** slider. Change the brightness of the wavefunction.
- **Speed** slider. Change the number of time steps per frame.
- **Colour Phase** checkbox. Check this to show the phase of the complex wavefunction using colours.
- **Mouse Usage** dropdown. Use the mouse to either place a new wavefunction **new Ψ(x, y)**, sketch a potential barrier **sketch barrier**, set the potential value to zero at the mouse location **erase barrier**, or determine the probability of finding the particle inside a user-drawn rectangular region **prob. in box**.
- **Preset Potential** dropdown. Change the potential to one of the preset options found here. The options are SHO (Simple Harmonic Oscillator, up to the box boundaries), ISW (Infinite Square Well), Double Slit, Single Slit, Step, Spike, and Triple Slit. The default potential at the start is SHO.
- **Mouse Usage Controls** folder. Contains widgets that pertain to the selection in the Mouse dropdown. These are:
    - **new Ψ(x, y)**
        - **Fix Init. Mom.** checkbox. Fix Initial Momentum. Instead of using the mouse to specify the initial momentum of the wavefunction, use the kx and ky sliders instead.
        - **sigma** slider. The new wavefunction is initialized as a Gaussian wavepacket, and this slider
        controls its standard deviation. This value is expressed as a fraction of the box's width and height.
        - **kx** slider. Proportional to the initial momentum in the x-direction (if `px` is the x-momentum, then `px = 2*π*kx/Lx`, where `Lx` is the width of the box).
        - **ky** slider. Proportional to the initial momentum in the y-direction (if `py` is the y-momentum, then `py = 2*π*ky/Ly`, where `Ly` is the height of the box).
    - **sketch barrier**
        - **Draw Type** dropdown. Specify a shape to sketch a new potential barrier.
        - **Draw Width** slider. The draw width. For square this equals its side length, for circle
        this equals its radius, and for a Gaussian the draw width is proportional to its standard deviation. Note that these values are expressed as fractions of the width and height of the simulation's extent.
        - **E** slider. Max energy of the newly drawn potential barrier.
    - **erase barrier**
        - **Draw Type** dropdown. Specify a stencil shape for which to erase the barrier.
        - **Draw Width** slider. The draw width. For square this equals its side length, and for a circle this equals its radius.
    - **prob. in box**
        - **Probability in Box**. This shows the probability density within the selected rectangular region.

- **Preset Potential Controls** folder. Contains sliders to manipulate the shape of the preset potential. Note that these values are expressed in terms of fractions of the width and height of the simulation extent.
- **Measure Position** button. Perform a measurement on the position of the particle. The wavefunction of the particle is subsequently localized at the measurement position.
### More Controls Folder
- **More Visualization Options** folder. The **Pot. Brightness** slider controls the brightness of the potential, while the **Pot. Colour** widget changes the colour used for displaying the potential. The **Pot. Height Map** checkbox instead uses a colour height map to display the potential. Use the **Prob. Current** checkbox to toggle the display of the probability current. The **Prob. Colour** controller changes the colour used to visualize the probability density, while the **Prob. Height Map** checkbox replaces this with a colour height map instead.
- **Show Dimensions** folder. Show the width and height of the box in the units that the simulation uses.
- **Change Grid Size** folder. Change the grid dimensions.
- **Text Edit Potential** folder. This contains the **Enter Potential V(x, y)** entry box and the **Use Tex Coordinates** checkbox. The **Enter Potential V(x, y)** entry box is where you can type in a
new potential.
Note that the value of the potential at a given point may be cutoff if it's too high or too deep. Checking **Use Tex Coordinates** uses the coordinates of the texture image to express V(x, y) instead of the coordinates in the simulation. Note that the origin `0, 0` is defined at the bottom left corner of the box. The folder **Edit Variables** contains sliders for any inputted variables that are not x or y.
- **Edit Boundary Type** folder. Change the boundary conditions, where selecting **Dirichlet** sets the wavefunction to zero at the boundaries, **Neumann** sets the first spatial derivative with respect to the boundary normal to zero, and **Periodic** makes the simulation wrap around itself.
- **Upload Image** folder. Press the **Choose File** button if on Chrome to select an image and upload it. The **invert** checkbox inverts its grayscale. Press the **Use for Pot.** button to use it as the potential.
- **Record Video** folder. Press **start** to begin video recording, and **Finish** to stop recording and save the video file.
- **Take Screenshots** folder. Use the **Number of Frames** entry box to change the number of frames to screenshot. Press the **Start** button to start taking screenshots.
- **Integration Methods** folder. Use this to change the methods used for the numerical integration. Some of these methods may contain additional options that substantially change the dynamics of the simulation. The methods to choose from are:
    - **Leapfrog**. The real and imaginary parts of the wavefunction are alternatingly updated explicitly at each time step.
    - **Leapfrog 2**. This differs from Leapfrog, in that both the real and imaginary parts are updated at the same time step. 
    - **CN /w Jacobi**. Crank-Nicolson method where the implicit part is solved using Jacobi iteration.
    - **Split-Op. (GPU FFT)**. Split Operator method, where the FFT is done in the GLSL shaders. Note that depending on the GPU on your machine, this method may not work properly.
    - **Split-Op. Nonlinear**. Same as the Split Operator method, but the user is allowed to add nonlinear terms to the Schrödinger equation. Note that with the addition of these nonlinear terms, it is no longer appropriate to say that the simulation describes the quantum mechanics of a single particle, since this is governed by the purely linear Schrödinger equation. However the Schrödinger equation with the additional nonlinear terms can be used to describe other quantum phenomena such as Bose-Einstein condensates.
    - **Leapfrog Nonlinear**. Same as the Leapfrog 2 method, but the user is allowed to add nonlinear terms to the Schrödinger equation.
- **Edit Other Values** folder. This contains sliders to modify the mass **m** of the particle, the time step length **dt**, or the discrete **Laplacian** stencil size.


### Issues
- To my knowledge, WebGL does not require for highp float to be at least 32 bit. If it is less than this on your machine, you may see the wavefunction quickly decay to zero.
- There is nothing stopping you from placing wavepackets on top of irregular shaped potentials, or drawing potential barriers on top of wavepackets. Weird behaviour may also occur when placing a new wavefunction at the boundaries.
- Things with high momentum may propagate in a square-like way, when it should instead propagate in a circular fashion.
- When holding down the mouse it gets stuck on "draw mode" if the mouse pointer exits the boundaries  
