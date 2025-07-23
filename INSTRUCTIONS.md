# Instructions
Upon start up, the first thing that is presented is a visualization of the wave function in a Harmonic Oscillator potential. The wave function is initialized as a Gaussian wave packet, where its brightness corresponds to its probability density, and its colours to its complex phase. The potential on the other hand is represented using a grayscale, where brighter regions map to larger values of the potential. Click anywhere inside the simulation's bounding box to initialize a new wave function, where the movement of the mouse when pressed determines the initial momentum of the wave function. Please note that because of the limited extent of the simulation domain, the potential is actually infinite along and past the simulation boundaries: reflection of the wave function always occurs along these boundaries.

On the upper right are the user interface controls. These are:
- **Instructions**. Link to this document.
- **Source**. Link to the source code.
- **Brightness** slider. Modify the brightness of the wave function.
- **Speed** slider. Change the number of time steps per frame.
- **Colour Phase** checkbox. Check this to show the phase of the complex wave function using colours.
- **Mouse Usage** dropdown. Use the mouse to either place a new wave function **New Ψ(x, y)**, sketch a potential barrier **Sketch barrier**, set the potential value to zero at the mouse pointer location **Erase barrier**, or determine the probability of finding the particle inside a user-drawn rectangular region **Prob. in box**.
- **Preset Potential** dropdown. Change the potential V(x, y) to one of the preset options found here. The options are **SHO** (Simple Harmonic Oscillator, up to the boundaries of the simulation), **ISW** (Infinite Square Well), **Double Slit**, **Single Slit**, **Step**, **Spike**, **Triple Slit**, **Circle** (Circular Well), or **Coulomb**. The default potential at the start is **SHO**.
- **Mouse Usage Controls** folder. Contains widgets that pertain to the selection in the **Mouse Usage** dropdown. These are:
    - **New Ψ(x, y)**
        - **σ** slider. The new wave function is initialized as a Gaussian wave packet, and this slider
        controls its standard deviation. This value is expressed as a fraction of the simulation bounding box's width and height.
        - **nx/ny sets p₀** checkbox, where **p₀** is defined to be the initial momentum of the wave function. Instead of using the mouse to specify the initial momentum **p₀** of the wave function, use the **nx** and **ny** sliders instead. 
        - **nx** slider. Proportional to the initial momentum in the x-direction. Defining pₓ to be the x-momentum, then pₓ = 2π nx / Lₓ, where Lₓ is the width of the box.
        - **ny** slider. Proportional to the initial momentum in the y-direction. Defining py to be the y-momentum, then py = 2π ny / Ly, where Ly is the height of the box.
        - **Hold/release** checkbox. If this is enabled, the wave function's position is locked to the same location so long as the left mouse button is held down. Once the left mouse button is released, the wave function is "free to move", where its initial momentum is determined from the difference of the mouse cursor location at time of left mouse button release, to where it was originally when the left mouse button was first held down.
    - **Sketch Barrier**
        - **Draw Type** dropdown. Specify a shape to sketch a new potential barrier.
        - **Draw Width** slider. The draw width. For **Square** this equals its side length, for **Circle**
        this equals its radius, and for a **Gaussian** the draw width is proportional to its standard deviation. Note that these values are expressed as fractions of the width and height of the simulation's bounding box.
        - **Barrier Height** slider. Maximum energy of the newly drawn potential barrier.
    - **Erase Barrier**
        - **Draw Type** dropdown. Specify a stencil shape for which to erase the barrier.
        - **Draw Width** slider. The draw width. For **Square** this equals its side length, for **Circle** this equals its radius, and for a **Gaussian** this is proportional to its standard deviation.
    - **Prob. in Box**
        - **Probability in Box**. This shows the probability density within the selected rectangular region.

- **Preset Potential Controls** folder. Contains sliders to manipulate the shape of the currently selected preset potential. Note that these values are expressed in terms of fractions of the width and height of the simulation bounding box.
- **Measure Position** button. Perform a measurement on the position of the particle. The wave function of the particle is subsequently localized at the measurement position.
### More Controls Folder
- **More Visualization Options** folder. The **Pot. brightness** slider controls the brightness of the potential, while the **Pot. colour** widget changes the colour used for displaying the potential. The **Pot. height map** checkbox instead uses a colour height map to display the potential. Use the **Prob. current** checkbox to toggle the display of the probability current. The **Prob. colour** controller changes the colour used to visualize the probability density, while the **Prob. height map** checkbox replaces this with a colour height map instead.
- **Show Dimensions** folder. Show the width and height of the box in the units that the simulation uses.
- **Change Grid Size** folder. Change the grid dimensions.
- **Text Edit Potential** folder. This contains the **Enter Potential V(x, y)** entry box and the **Texture coord.** checkbox. The **Enter Potential V(x, y)** entry box is where you can type in a
new potential. Note that the value of the potential may be clamped to a smaller value if its magnitude is too large for the simulation to handle. With **Texture coord.** enabled, use the coordinates of the texture image to express V(x, y) instead of the coordinates in the simulation. Note that the origin (0, 0) is defined at the bottom left corner of the box. The folder **Edit variables** contains sliders for any inputed variables that are not x or y.
- **Edit Boundary Type** folder. Change the boundary conditions, where selecting **Dirichlet** sets the wave function to zero at the boundaries, **Neumann** sets the first spatial derivative with respect to the boundary normal to zero, and **Periodic** makes the simulation wrap around itself.
- **Upload Image** folder. Press the **Choose File** button to select an image and upload it. The **Invert** checkbox inverts its grayscale. **Use aspect ratio** sets the simulation's grid dimensions to that of the uploaded image. Press the **Set as V(x,y)** to use this uploaded image to construct the potential. The **Display as B.G.** checkbox sets the image as the background instead, where the **B.G. Scale** slider controls its brightness.
- **Record Video** folder. Press **Start** to begin video recording, and **Finish** to stop recording and save the video file.
- **Take Screenshots** folder. Screenshots can be recorded non-stop at every frame, up to a specified amount, which is determined by the **Number of frames** entry box. The **Prefix** entry box prefixes the file names of these screenshots with the text entered here. Press the **Start** button to begin taking screenshots, where **Progress** informs the number of screenshots already taken, and how many still remain. When initiating a screenshot recording, the simulation speed can be conjointly modified at the exact same instant. This is done by enabling **Set start speed** checkbox and using the **Start speed** slider, where the simulation speed is immediately set to the value of the **Start speed** slider once screenshot recording begins. Use the **Pause on finish** checkbox to pause the simulation once all screenshots have been taken.
- **Save/Load Data** folder, which contains two additional subfolders: **Save** and **Load**. The **Save** folder contains three buttons: **Wave function**, **Potential**, and **Both**. Pressing the **Wave function** button serialized the wave function to a special .dat file, which can be loaded back into the simulation at a later time. The **Potential** button does the same thing but only for the potential, while **Both** serializes both the wave function and potential into the same .dat file. The **Load** folder contains controls for loading the serialized wave function/potential data that's stored in a .dat file back into the simulation.
- **Integration Methods** folder. Change the method used for the numerical integration. Some of these methods may contain additional options that substantially change the dynamics of the simulation. The methods to choose from are:
    - **Leapfrog**. The real and imaginary parts of the wave function are alternatingly updated explicitly at each time step [[1](#ref1)]. This is the default numerical method used in this simulation. Use the **Stencil** dropdown in the **Discrete Laplacian** folder to change the spatial order of accuracy for the discretized Laplacian operator [[2](#ref2)].
    - **Centred 2nd Or.**. This is named as such because a centred 2nd order finite difference approximation scheme is applied to the time derivative term of the Schrödinger equation. It is actually nearly identical to **Leapfrog**, the only difference being that both the real and imaginary parts are updated at the same time for each time step. As such it is less efficient than **Leapfrog**, but it does appear to have better stability conditions when using higher order Laplacian stencils.
    - **CN /w Jacobi**. Crank-Nicolson method [[3](#ref3)], where the implicit part is solved using Jacobi iteration [[4](#ref4)]. The **Min. iter.** slider controls the minimum number of Jacobi iterations to perform. Enabling the checkbox **Check conv.** assesses the convergence of the iterative solution: if the convergence criterion is larger than the **Tolerance** value, then more Jacobi iterations are performed. If this checkbox is disabled, then **Min. iter.** is the same as the maximum number of Jacobi iterations.
    - **Split-Op. (GPU FFT)**. Split Operator method [[5](#ref5)]. This method uses the FFT algorithm [[6](#ref6)], which is implemented with GLSL shaders. Note that depending on the GPU of your machine, this method may not work properly.
    - **Time Split CN-J**. Similar to the Split Operator method,
    but the momentum part is instead solved using the Crank-Nicolson method in the position basis.
    - **Split-Op. Nonlinear**. Same as the Split Operator method, but the user is allowed to add nonlinear terms to the Schrödinger equation [[7](#ref7)]. This is done in the **Enter terms** entry box, where the nonlinear term is expressed as a function of u, where u = |Ψ|². Any other parameters entered are controlled by sliders in the **Edit Variables** folder. Note that with the addition of these nonlinear terms, it is no longer appropriate to say that the simulation describes the wave function for any quantum system, since this is governed by the purely linear Schrödinger equation. However the Schrödinger equation with the additional nonlinear terms is used to describe other quantum phenomena, such as Bose-Einstein condensates. There are no checks done on whether the nonlinear terms give numerically valid results, which requires the user's discretion.
    - **Centred Nonlinear**. Same as the **Centred 2nd Or.** method, but the user is allowed to add nonlinear terms to the Schrödinger equation [[8](#ref8)].
- **Edit Other Values** folder. This contains sliders to modify the mass **m** of the particle, and the time step **dt**. Note that modifying these values may incur instability in the simulation. The folder also contains the **Normalize** checkbox, that when checked makes the simulation normalize the wave function after each frame.
### Issues and Limitations
- The simulation depends on the floating point numerical precision to be at least 32 bits, but to my knowledge, WebGL does not require its higherst precision floating point type (highp float) to be at least 32 bit. If it is less than this on your machine, you may see the wave function quickly decay to zero.
- There is nothing stopping you from placing wave packets on top of irregular shaped potentials, or drawing potential barriers on top of wave packets. Weird behaviour may also occur when placing a new wave function at the boundaries.
- Wave forms with high momentum may propagate in a square-like way due to numerical error caused by the underlying finite difference approximation, when it should in reality propagate in a circular fashion.

## References

1. <a name="ref1"></a> Visscher, P. (1991). A fast explicit algorithm for the time‐dependent Schrödinger equation. <em>Computers in Physics, 5</em>, 596-598. [https://doi.org/10.1063/1.168415](https://doi.org/10.1063/1.168415)

2. <a name="ref2"></a> Convenient tables of finite difference stencils sorted by order of accuracy and differentiation count are given here:

   -  Fornberg, B. (1988). Generation of Finite Difference Formulas on Arbitrarily Spaced Grids. <em>Mathematics of Computation, 51(184)</em>, 699-706. [https://doi.org/10.1090/S0025-5718-1988-0935077-0 ](https://doi.org/10.1090/S0025-5718-1988-0935077-0 )

3. <a name="ref3"></a> Wikipedia contributors. (2021, October 6). [Crank-Nicolson method](https://en.wikipedia.org/wiki/Crank%E2%80%93Nicolson_method). In <em>Wikipedia, The Free Encyclopedia</em>.

4. <a name="ref4"></a> I first found out about using the Jacobi method for solving the implicit part of the Crank-Nicolson method from here:

   1. Sadovskyy I., Koshelev A., Phillips C., Karpeyev D., Glatz A. (2015). Stable large-scale solver for Ginzburg-Landau equations for superconductors. <em>Journal of Computational Physics 294</em>, 639-654. [https://doi.org/10.1016/j.jcp.2015.04.002](https://doi.org/10.1016/j.jcp.2015.04.002)

   For implementing the Jacobi method itself, I just consulted the Wikipedia page on the topic:

   2. Wikipedia contributors. (2021, August 1). [Jacobi method](https://en.wikipedia.org/wiki/Jacobi_method). In <em>Wikipedia, The Free Encyclopedia</em>.


5. <a name="ref5"></a> James Schloss. [The Split-Operator Method](https://www.algorithm-archive.org/contents/split-operator_method/split-operator_method.html). In <em>The Arcane Algorithm Archive</em>.

6. <a name="ref6"></a> For implementing the FFT, I consulted these resources:

   1. Press W. et al. (1992). Fast Fourier Transform. In <em>[Numerical Recipes in Fortran 77](https://websites.pmc.ucsc.edu/~fnimmo/eart290c_17/NumericalRecipesinF77.pdf)</em>, chapter 12.

   2. Wikipedia contributors. (2021, October 8). [Cooley–Tukey FFT algorithm](https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm). In <em>Wikipedia, The Free Encyclopedia</em>.

   3. Weisstein, E. (2021). [Fast Fourier Transform](https://mathworld.wolfram.com/FastFourierTransform.html). In <em>Wolfram MathWorld</em>.

7. <a name="ref7"></a> An overview of various methods for numerically solving the <i>nonlinear</i> Schrödinger equation (such as the Split Operator method) are given in this article:

    - Antoine, X., Bao, W., Besse C. (2013). Computational methods for the dynamics of the nonlinear Schrödinger/Gross–Pitaevskii equations. <em>Computer Physics Communications, 184(12)</em>, 2621-2633. [https://doi.org/10.1016/j.cpc.2013.07.012](https://doi.org/10.1016/j.cpc.2013.07.012)

8. <a name="ref8"></a>This dissertation extends the method described in [[1](#ref1)] to the nonlinear Schrödinger equation, and generalizes it to arbitrarily higher orders of accuracy in Δt (not implemented in this simulation).

    -  Ira Moxley III, F. (2013). [Generalized finite-difference time-domain schemes for solving nonlinear Schrödinger equations](https://digitalcommons.latech.edu/cgi/viewcontent.cgi?article=1284&context=dissertations). <em>Dissertation</em>, 290.


