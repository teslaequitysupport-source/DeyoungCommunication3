#!/usr/bin/env python3
"""Competitor pricing comparison chart for DEYOUNG dossier."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.font_manager as fm
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# Palette (from cascade palette, seed 7)
ACCENT = '#3681a6'
ACCENT_2 = '#b43a4e'
HEADER_FILL = '#334650'
ICON = '#52798c'
TEXT_PRIMARY = '#1a1b1c'
TEXT_MUTED = '#6f7578'
BORDER = '#b8c8cf'

# Public per-minute price ranges (USD), platform portion, 2025-2026 public pricing pages
platforms = ['Vapi', 'Retell', 'Bland', 'Synthflow', 'Tel-Agent\n(self-host)']
low = [0.05, 0.07, 0.11, 0.08, 0.00]
high = [0.15, 0.31, 0.14, 0.15, 0.00]
# Tel-Agent: AGPL open source, no platform fee; you pay providers directly.

fig, ax = plt.subplots(figsize=(7.4, 3.4), dpi=200, constrained_layout=True)

y = range(len(platforms))
bar_h = 0.52
for i in y:
    if high[i] > 0:
        # range bar from low to high
        ax.barh(i, high[i] - low[i], left=low[i], height=bar_h,
                color=ACCENT, alpha=0.85, edgecolor='none', zorder=3)
        ax.text(high[i] + 0.006, i, f'${low[i]:.2f}-${high[i]:.2f}',
                va='center', ha='left', fontsize=9, color=TEXT_PRIMARY, zorder=4)
    else:
        ax.barh(i, 0.012, left=0, height=bar_h,
                color=ACCENT_2, alpha=0.9, edgecolor='none', zorder=3)
        ax.text(0.02, i, '$0 platform fee (AGPL, self-hosted)',
                va='center', ha='left', fontsize=9, color=TEXT_PRIMARY, zorder=4)

ax.set_yticks(list(y))
ax.set_yticklabels(platforms, fontsize=10, color=TEXT_PRIMARY)
ax.set_xlim(0, 0.42)
ax.set_xlabel('Platform price per call minute (USD), public rates 2025-2026',
              fontsize=9.5, color=TEXT_MUTED)
ax.invert_yaxis()

# Axis cleanup per charts.md
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['bottom'].set_color(BORDER)
ax.tick_params(axis='x', colors=TEXT_MUTED, labelsize=9)
ax.tick_params(axis='y', length=0)
ax.grid(True, axis='x', linestyle='--', alpha=0.2, linewidth=0.5, zorder=0)

fig.savefig('/home/z/my-project/scripts/competitor_pricing.png', facecolor='white')
print('chart saved')
