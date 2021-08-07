import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation


def rect(x, c, w):
    return np.array([1.0 if xi > c - w/2 and xi < c + w/2
                     else 0.0 for xi in x])

dt = 0.01
length = 64.0
n = 512
hbar = 1.0
m = 1.0
x = np.linspace(0.0, length-length/n, n)
init_wave = np.exp(-((x-length/4)/length)**2/0.05**2)*np.exp(1.0j*40.0*(x/length)*np.pi)
psi1 = np.zeros([2, len(x)])
for i in range(psi1.shape[1]):
    psi1[0, i] = np.real(init_wave[i])
    psi1[1, i] = np.imag(init_wave[i])
psi2 = np.zeros([2, len(x)])
psis = [psi1.copy(), psi1, psi2]
dx = (x[1] - x[0])
plot_to_v = 50
# V = plot_to_v*((x-length/2)/length)**2
V = plot_to_v*rect(x/length, 0.75, 0.15)/25


def time_step(psis):
    psi = psis[-2]
    psi2 = psis[-1]
    for i in range(1, len(x)-1):
        re_psi = psi[0, i]
        im_psi = psi[1, i]
        div2_im_psi = (psi[1, i+1] + psi[1, i-1] - 2.0*im_psi)/dx**2
        hamilton_im_psi = (-hbar**2/(2*m))*div2_im_psi + V[i]*im_psi
        psi2[0, i] = re_psi + hamilton_im_psi*dt
    for i in range(1, len(x)-1):
        re_psi = psi2[0, i]
        im_psi = psi[1, i]
        div2_re_psi = (psi2[0, i+1] + psi2[0, i-1] - 2.0*re_psi)/dx**2
        hamilton_re_psi = (-hbar**2/(2*m))*div2_re_psi + V[i]*re_psi
        psi2[1, i] = im_psi - hamilton_re_psi*dt
    psis[0], psis[1], psis[2] = psi, psi2, psis[0]


fig = plt.figure()
ax = fig.add_subplot(1, 1, 1)
line1, = ax.plot(x, psis[0][0])
line2, = ax.plot(x, psis[0][1])
ax.plot(x, V/(plot_to_v/10))
ax.set_xlim(0.0, x[-1])
ax.set_ylim(-1.1, 1.1)
line1.set_label(r"Re($\psi(x)$)")
line2.set_label(r"Im($\psi(x)$)")
ax.set_xlabel("x")
ax.grid()
ax.legend()

# for _ in range(1000):
#     time_step(psis)

def animation_func(*args):
    for _ in range(10):
        time_step(psis)
    line1.set_ydata(psis[1][0])
    line2.set_ydata(psis[1][1])
    return line1, line2

print("%.2g, %.2g, %.2g" % (-2*hbar/dt, np.max(V), 2*hbar/dt - 2*(hbar/(m*dx))**2))
print("%.2g, %.2g, %.2g" % (-2*hbar/dt, np.min(V), 2*hbar/dt - 2*(hbar/(m*dx))**2))
main_animation = animation.FuncAnimation(fig, animation_func, blit=True, interval=1.0)
plt.show()

