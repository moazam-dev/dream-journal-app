"""Procedural dark northern-lights backgrounds for the Today cards.

Needs numpy, pillow and scipy. Writes PNGs into the folder given:

    python scripts/generate-today-backgrounds.py out

The app uses JPEG copies of these (quality 86) in assets/images/today/aurora-1..4.jpg.
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, gaussian_filter1d

W, H = 900, 1350


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def smooth_noise_1d(n, scale, rng):
    raw = rng.standard_normal(n + 200)
    out = gaussian_filter1d(raw, scale)[100:100 + n]
    return out / (np.abs(out).max() + 1e-9)


def ribbon(rng, y_center, amp, wave, thickness, up_tail, colors, strength, slope=0.0):
    """One aurora curtain: bright lower edge, rays fading upward."""
    xs = np.arange(W)
    phase = rng.uniform(0, 2 * np.pi)
    curve = (y_center + slope * (xs - W / 2)
             + amp * np.sin(xs / W * wave * 2 * np.pi + phase)
             + amp * 0.6 * smooth_noise_1d(W, 60, rng))
    ys = np.arange(H)[:, None]
    d = ys - curve[None, :]  # >0 below the curve
    below = np.exp(-(np.clip(d, 0, None) / thickness) ** 2) * 0.85 + 0.15 * np.exp(-np.clip(d, 0, None) / (thickness * 5))
    above = np.exp(-np.clip(-d, 0, None) / up_tail)
    shape = np.where(d > 0, below, above)
    # vertical rays: noise varying mostly along x
    rays = 0.55 + 0.45 * smooth_noise_1d(W, 3.5, rng)[None, :]
    rays = rays * (0.7 + 0.3 * smooth_noise_1d(W, 14, rng)[None, :])
    # brightness varies along the ribbon
    along = np.clip(smooth_noise_1d(W, 80, rng) * 0.75 + 0.45, 0, 1)[None, :] ** 1.6
    inten = shape * rays * along * strength
    # colour: low edge colour -> top colour by distance above curve
    t = np.clip(-d / (up_tail * 2.2), 0, 1)[..., None]
    c0, c1 = hexrgb(colors[0]), hexrgb(colors[1])
    col = c0 * (1 - t) + c1 * t
    return inten[..., None] * col


def make(seed, sky_top, sky_bottom, ribbons, out, haze=None):
    rng = np.random.default_rng(seed)
    t = np.linspace(0, 1, H)[:, None, None]
    img = hexrgb(sky_top) * (1 - t) + hexrgb(sky_bottom) * t
    img = np.broadcast_to(img, (H, W, 3)).copy()

    if haze:
        # soft abstract glow blobs
        for (cx, cy, r, color, a) in haze:
            yy, xx = np.mgrid[0:H, 0:W]
            g = np.exp(-(((xx - cx * W) ** 2 + (yy - cy * H) ** 2) / (2 * (r * W) ** 2)))
            img += g[..., None] * hexrgb(color) * a

    light = np.zeros((H, W, 3))
    for r in ribbons:
        light += ribbon(rng, **r)
    light = gaussian_filter(light, sigma=(5, 1.6, 0))
    bloom = gaussian_filter(light, sigma=(70, 70, 0))
    img = img + light + bloom * 0.6

    # stars, mostly in the dark parts
    stars = np.zeros((H, W))
    n = 260
    sx, sy = rng.integers(0, W, n), rng.integers(0, H, n)
    stars[sy, sx] = rng.uniform(0.3, 1.0, n) ** 2
    stars = gaussian_filter(stars, 0.8) * 6
    dark = np.clip(1 - light.sum(-1) * 1.5, 0, 1)
    img += (stars * dark)[..., None] * 0.8

    # vignette + filmic tone
    yy, xx = np.mgrid[0:H, 0:W]
    v = ((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2 * 0.8)
    img *= (1 - 0.9 * v)[..., None]
    img = 1 - np.exp(-img * 1.35)
    img += rng.normal(0, 0.008, img.shape)  # grain, stops banding
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(out, optimize=True)
    print('wrote', out)


OUT = sys.argv[1]

# 1: tell your dream - classic green aurora, violet tops
make(11, '#03050d', '#060a16', [
    dict(y_center=470, slope=-0.45, amp=90, wave=1.2, thickness=30, up_tail=168, colors=('#46ffb4', '#7a45ff'), strength=1.15),
    dict(y_center=330, slope=-0.25, amp=60, wave=2.0, thickness=20, up_tail=112, colors=('#2fe6a0', '#2f7bff'), strength=0.55),
    dict(y_center=600, slope=0.3, amp=40, wave=1.5, thickness=14, up_tail=90, colors=('#8dffcf', '#46b4ff'), strength=0.5),
], f'{OUT}/today-aurora-1.png')

# 2: talk it through - violet / magenta
make(22, '#06030e', '#0a0616', [
    dict(y_center=420, slope=0.4, amp=100, wave=1.0, thickness=28, up_tail=161, colors=('#c46bff', '#ff4f9e'), strength=1.05),
    dict(y_center=300, slope=0.2, amp=60, wave=1.8, thickness=18, up_tail=105, colors=('#8a6bff', '#4030e0'), strength=0.5),
    dict(y_center=560, slope=-0.3, amp=40, wave=1.4, thickness=14, up_tail=90, colors=('#ff7ad0', '#9a4bff'), strength=0.45),
], f'{OUT}/today-aurora-2.png', haze=[(0.85, 0.9, 0.35, '#2a1250', 0.3)])

# 3: today's thought - deep blue / cyan with a rose haze
make(33, '#02050d', '#050818', [
    dict(y_center=380, slope=-0.35, amp=80, wave=1.4, thickness=26, up_tail=154, colors=('#4fdcff', '#5a4bff'), strength=1.0),
    dict(y_center=260, slope=-0.15, amp=50, wave=2.2, thickness=16, up_tail=98, colors=('#6affd6', '#3a7bff'), strength=0.45),
    dict(y_center=520, slope=0.25, amp=40, wave=1.6, thickness=14, up_tail=90, colors=('#8fd8ff', '#7a5bff'), strength=0.4),
], f'{OUT}/today-aurora-3.png', haze=[(0.15, 0.95, 0.4, '#4a1a3c', 0.35)])

# 4: note to future you - emerald into warm gold dawn
make(44, '#030607', '#04090b', [
    dict(y_center=430, slope=0.35, amp=90, wave=1.1, thickness=28, up_tail=154, colors=('#84ffae', '#1fb8a0'), strength=0.95),
    dict(y_center=560, slope=0.2, amp=60, wave=1.6, thickness=20, up_tail=105, colors=('#ffd06b', '#ff7a59'), strength=0.55),
    dict(y_center=300, slope=-0.3, amp=40, wave=1.8, thickness=14, up_tail=90, colors=('#b8ff9a', '#2fd3b0'), strength=0.45),
], f'{OUT}/today-aurora-4.png', haze=[(0.5, 1.05, 0.45, '#0a2a2a', 0.45)])
