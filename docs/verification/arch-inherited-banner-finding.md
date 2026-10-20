# ARCH1.3 inherited canvas banner finding

Saved actual320px light/dark pixels show the single centered status banner clipped horizontally in the default statically determinate state. Evidence is `/tmp/atlas-new-arch-source/arch-prereqs/native-final/1.3-{light,dark}-native.png`; its function is unchanged from accepted root in the prerequisite/qualification/wrap chain. The complete proof, controls and DOM readout remain readable. This is a separate canvas annotation finding, not a failure of the changed prose layouts.

Exact original line in `content/arch/ch01.js`:

```js
s.text(`r = ${a.r} unknowns, rank A = ${a.rank}: ${verdict[0]}`, 5, 4.05, { align: 'center', size: 12.5, weight: 700, color: verdict[1] });
```

Smallest proposed local replacement:

```js
s.text(verdict[0], 5, 4.05, { align: 'center', size: 12.5, weight: 700, color: verdict[1] });
```

The full numeric r/rank/status readout already exists below the controls and would stay unchanged. The verdict strings, colors, coordinates, font and every computation/control remain unchanged. The coordinator explicitly authorized this one-line banner-only successor after reviewing the proposal, and released the browser/heavy hold. It will be authored only after freezing the main producer boundary, with an exact literal guard and fresh actual narrow light/dark determinate/mechanism/indeterminate/default-control pixels. No runtime change is included in the prerequisite/qualification/wrap boundary itself.
