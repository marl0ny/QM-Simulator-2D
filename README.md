# Quantum Mechanics in 2D
This [WebGL program](https://marl0ny.github.io/QM-Simulator-2D/index.html) simulates the quantum mechanics of a single particle confined in a 2D box, where inside this box the user can create new potential barriers and scatter Gaussian wavepackets off them. The full instructions are found [here](https://github.com/marl0ny/QM-Simulator-2D/blob/main/INSTRUCTIONS.md).

The simulation uses an integration method described in page 690 of <em>An Introduction to Computer Simulation Methods</em> by H. Gould et al (which references an [article](https://aip.scitation.org/doi/pdf/10.1063/1.168415) by P. Visscher). This method involves splitting the complex-valued wavefunction into its real and imaginary components, where each component is updated separately for each time step.

Two other integration methods are also currently under development: [Crank-Nicolson](https://en.wikipedia.org/wiki/Crank%E2%80%93Nicolson_method) and the [Split-Operator](https://www.algorithm-archive.org/contents/split-operator_method/split-operator_method.html) method, which are located on a [separate branch](https://github.com/marl0ny/QM-Simulator-2D/tree/new-integration-methods). Note that this branch is not included in Github Pages, so you will need to download or pull from it separately. 

Also provided is a (work in progress) [simulation of a 2D relativistic quantum particle](https://marl0ny.github.io/QM-Simulator-2D/rel-qm.html) using the Dirac equation. The Dirac equation is numerically solved by updating each of the two two-component spinors separately at staggered time and spatial steps. This method is found in an [article](https://arxiv.org/abs/1306.5895) by R. Hammer and W. Pötz.

## APIs and Frameworks Used
- The [WebGL](https://www.khronos.org/webgl/) API
- [dat.gui](https://github.com/dataarts/dat.gui) by [Google Data Arts Team](https://github.com/dataarts)
- [stats.js](https://github.com/mrdoob/stats.js/) by the stats.js authors
- [jszip](https://stuk.github.io/jszip/) by [Stuart Knightley](https://github.com/Stuk), [David Duponchel](https://github.com/dduponchel), Franz Buchinger, António Afonso

# References

 - Gould, H., Tobochnik J., Christian W. (2007). Quantum Systems.
 In <em>An Introduction to Computer Simulation Methods</em>, 
chapter 16. Pearson Addison-Wesley.

 - Visscher, P. (1991). A fast explicit algorithm for the time‐dependent Schrödinger equation. <em>Computers in Physics, 5</em>, 596-598. [https://doi.org/10.1063/1.168415](https://doi.org/10.1063/1.168415)
 
 - Schroeder D. [Quantum Scattering in Two Dimensions](https://physics.weber.edu/schroeder/software/QuantumScattering2D.html).

 Crank-Nicolson Method:

- Wikipedia contributors. (2021, October 6). [Crank-Nicolson method](https://en.wikipedia.org/wiki/Crank%E2%80%93Nicolson_method). In <em>Wikipedia, The Free Encyclopedia</em>.

- Wikipedia contributors. (2021, August 1). [Jacobi method](https://en.wikipedia.org/wiki/Jacobi_method). In <em>Wikipedia, The Free Encyclopedia</em>.

- Sadovskyy I., Koshelev A., Phillips C., Karpeyev D., Glatz A. (2015). Stable large-scale solver for Ginzburg-Landau equations for superconductors. <em>Journal of Computational Physics 294</em>, 639-654. [https://doi.org/10.1016/j.jcp.2015.04.002](https://doi.org/10.1016/j.jcp.2015.04.002)

Split-Step:

- James Schloss. [The Split-Operator Method](https://www.algorithm-archive.org/contents/split-operator_method/split-operator_method.html). In <em>The Arcane Algorithm Archive</em>.

- Wikipedia contributors. (2021, May 6). [Split-step method](https://en.wikipedia.org/wiki/Split-step_method). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Bauke, H., Keitel, C. (2011). Accelerating the Fourier split operator method via graphics processing units. <em>Computer Physics Communications, 182(12)</em>, 2454-2463. [https://doi.org/10.1016/j.cpc.2011.07.003](https://doi.org/10.1016/j.cpc.2011.07.003)

 Spin, Vector Potential, and Magnetic Fields

- Shankar, R. (1994). Spin. In <em>Principles of Quantum Mechanics</em>, chapter 14. Springer.

 Pauli Equation:

 - Wikipedia contributors. (2022, August 5). [Pauli equation](https://en.wikipedia.org/wiki/Pauli_equation). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Shankar, R. (1994). The Dirac Equation. In <em>Principles of Quantum Mechanics</em>, chapter 20. Springer.


 Dirac Equation:

 - Wikipedia contributors. (2021, June 16). [Dirac equation](https://en.wikipedia.org/wiki/Dirac_equation). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Wikipedia contributors. (2021, August 5). [Dirac spinor](https://en.wikipedia.org/wiki/Dirac_spinor). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Shankar, R. (1994). The Dirac Equation. In <em>Principles of Quantum Mechanics<em>, chapter 20. Springer.

 - Hammer, R., Pötz W. (2014). Staggered grid leap-frog scheme for the (2 + 1)D Dirac equation. <em>Computer Physics Communications, 185(1)</em>, 40-53. [https://doi.org/10.1016/j.cpc.2013.08.013](https://doi.org/10.1016/j.cpc.2013.08.013)

 Nonlinear Schrödinger Equation:

 - Antoine, X., Bao, W., Besse C. (2013). Computational methods for the dynamics of the nonlinear Schrödinger/Gross–Pitaevskii equations. <em>Computer Physics Communications, 184(12)</em>, 2621-2633. [https://doi.org/10.1016/j.cpc.2013.07.012](https://doi.org/10.1016/j.cpc.2013.07.012)

- Ira Moxley III, F. (2013). [Generalized finite-difference time-domain schemes for solving nonlinear Schrödinger equations](https://digitalcommons.latech.edu/cgi/viewcontent.cgi?article=1284&context=dissertations). <em>Dissertation</em>, 290. 

 ###

 Laplacian Stencils:

 - Wikipedia contributors. (2021, February 17)
 [Discrete Laplacian Operator 1.5.1 Implementation via operator discretization](https://en.wikipedia.org/wiki/Discrete_Laplace_operator#Implementation_via_operator_discretization). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Fornberg, B. (1988). Generation of Finite Difference Formulas on Arbitrarily Spaced Grids. <em>Mathematics of Computation, 51(184)</em>, 699-706. [https://doi.org/10.1090/S0025-5718-1988-0935077-0 ](https://doi.org/10.1090/S0025-5718-1988-0935077-0 )

Approximating the vector potential:

- Feynman R., Leighton R., Sands M. (2011). [The Schrödinger Equation in a Classical Context: A Seminar on Superconductivity](https://www.feynmanlectures.caltech.edu/III_21.html). In <em>In The Feynman Lectures on Physics: The New Millennium Edition, Volume 3</em>, chapter 21. Basic Books.

- Wikipedia contributors. (2021, April 21). [Peierls substitution](https://en.wikipedia.org/wiki/Peierls_substitution). In <em>Wikipedia, The Free Encyclopedia</em>.

Fast Fourier Transform:

- Press W. et al. (1992). Fast Fourier Transform.
In <em>[Numerical Recipes in Fortran 77](https://websites.pmc.ucsc.edu/~fnimmo/eart290c_17/NumericalRecipesinF77.pdf)</em>, chapter 12.

- Wikipedia contributors. (2021, October 8). [Cooley–Tukey FFT algorithm](https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm). In <em>Wikipedia, The Free Encyclopedia</em>.

- Weisstein, E. (2021). [Fast Fourier Transform](https://mathworld.wolfram.com/FastFourierTransform.html). In <em>Wolfram MathWorld</em>.

Hartree Atomic Units:

 - Wikipedia contributors. (2021, May 14). [Hartree atomic units](https://en.wikipedia.org/wiki/Hartree_atomic_units). In <em>Wikipedia, The Free Encyclopedia</em>.

 Names of the Different Boundary Conditions:
 - Wikipedia contributors. (2021, March 7). [Boundary value problem](https://en.wikipedia.org/wiki/Boundary_value_problem). In <em>Wikipedia, The Free Encyclopedia</em>.
