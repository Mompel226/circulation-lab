# The 3D heart: sources, licences and changes

`heart.glb` (421,208 bytes, SHA-256 `47a29763…098c15c9`) is used by the "Explore a real heart" widget
(`js/w-heart3d.js`, `js/heart3d.js`). It is a real human heart. The widget's own credit line reads:

> The heart is a real one: HuBMAP Human Reference Atlas (Browne and Schlehlein 2024), from the Visible
> Human Male, US National Library of Medicine. CC BY 4.0. The moving valve cusps, the tendons and the
> blood paths are added for this lab.

## Sources (both checked on lod.humanatlas.io, 25 September 2026)

**The heart.** HuBMAP Human Reference Atlas, *3D Reference Organ for Heart, Male*, version 1.3.
Citation requested by the publisher:
Browne, Kristen, and Heidi Schlehlein. 2024. "3D Reference Organ for Heart, Male v1.3."
https://doi.org/10.48539/HBM564.WKNG.249
Licence: Creative Commons Attribution 4.0 International (CC BY 4.0). Funder: National Institutes of Health.
File used: `https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/v1.3/assets/3d-vh-m-heart.glb`
(4,071,772 bytes, SHA-256 `689df039c8bc264ea06a44cd926762976f0666c0ff2dc532d046409b185e6b0c`).
Made from the Visible Human Male data of the US National Library of Medicine (Spitzer et al. 1996,
*JAMIA* 3: 118–130; Ackerman 1998, *Proceedings of the IEEE* 86: 504–511).

**The great vessels and coronary arteries.** HuBMAP Human Reference Atlas, *3D Reference Organ for Blood
Vasculature, Male*, version 1.3, from the same body and in the same coordinate frame.
Browne, Kristen, and Heidi Schlehlein. 2024. "3D Reference Organ for Blood Vasculature, Male v1.3."
https://doi.org/10.48539/HBM473.XTPP.725 — CC BY 4.0.
Only the heart's own vessels were taken, by HTTP range requests on their data (1.77 MB of the 18 MB file):
ascending aorta, aortic arch, the first segments of the brachiocephalic, left common carotid and left
subclavian arteries, the upper descending aorta, the pulmonary trunk and the right and left pulmonary
arteries, the four pulmonary veins, the superior vena cava, the upper inferior vena cava, and eight
coronary artery meshes (left coronary artery, anterior descending branch and two diagonal branches, left
marginal branch, right coronary artery, right marginal branch, posterior descending branch).

## What was changed (25 September 2026)

1. **Parts chosen and renamed.** Nodes are named for the widget: `ra`, `la`, `rv`, `lv`, `septum`,
   `valve_tri`, `valve_mit`, `valve_aor`, `valve_pul`, `pap_rv_ant`, `pap_rv_sep`, `pap_rv_post`,
   `pap_lv_al`, `pap_lv_pm`, `aorta` (six aorta meshes joined), `pulmonary_artery` (trunk + both
   branches), `pulmonary_veins` (all four), `vena_cava_sup`, `vena_cava_inf`, `coronary` (all eight).
   The heart source's cardiac-chamber meshes are solid myocardium, so a cut shows real wall thickness
   (measured on the model: left ventricle 10–16 mm, right ventricle 5–7 mm, atria 3–7 mm).
2. **Cleaned.** Vertices welded; degenerate and duplicate triangles removed; segmentation specks smaller
   than 2 mm removed (a 0.6 mm blob of 10,196 triangles in the left coronary artery mesh, and debris inside
   the right atrium); small holes in the closed walls filled; triangle winding made consistent.
3. **One frame.** Moved so the centre of the four chambers is the origin (the centre was
   x 18.7, y 476.1, z 37.6 mm in the atlas frame) and scaled from metres to decimetres. The axes are the
   atlas's own: +x is the body's left, +y superior, +z anterior. Nothing was rotated.
4. **Descending aorta cut** 2 cm above the heart's centre. Below that it runs down behind the heart, and
   in the section view it appeared beside the left atrium like a vessel leaving it.
5. **Coronary arteries thickened** by 0.9 mm along their surface normals, from about 1 mm across in the
   source to about 3 mm, a typical diameter for these arteries, so that they can be seen and pressed.
6. **Simplified and compressed.** Each part simplified with meshoptimizer to its own triangle budget
   (245,386 → 77,980 triangles in all), positions quantised to 14 bits and normals to 8 bits, and the
   buffers compressed with `EXT_meshopt_compression` (glTF-Transform 4.5.0, meshoptimizer 1.2.0).
   5.9 MB → 0.41 MB. The widget decodes it with three.js's vendored meshopt decoder.
7. **Data added, worked out from the model's own geometry** and stored in the file's scene `extras`:
   - *Blood paths.* The model was voxelised at 1 mm; each vessel's cut end was sealed; the blood space is
     the free space enclosed by the walls. Paths are least-cost routes through it, with a cost that rises
     steeply near any wall (1 + (8 mm / clearance)²), so each runs down the middle of its cavity or lumen,
     forced through the valve orifices in order. Vessel stretches follow slice-by-slice centre lines of the
     vessel tubes. Every path point was then checked against the wall voxels: none lies in a wall; the
     smallest clearance is 1 mm, and 2 mm or more on every path but one pulmonary vein.
   - *Valve rings*, fitted to the model's own valve meshes: centre, axis and radius of each (tricuspid
     r 22.4 mm, mitral 20.6 mm, aortic 10.2 mm, pulmonary 9.5 mm). The aortic cusps are oriented from the
     model's coronary ostia, which lie 11.1 mm (right) and 12.6 mm (left) above the aortic ring.
   - The tip of each papillary muscle; the four-chamber plane (through the mitral and tricuspid rings and
     the left ventricular apex); a centre for each chamber's cavity.

8. **Semilunar valves moved out of the walls** (26 September 2026). In the source, 47 % of the pulmonary
   valve's surface lay inside the right ventricle's wall (mostly less than 1.2 mm deep), and 6 % of the
   aortic valve's inside the walls round it, so seen from the artery the wall broke through the cusps as
   red patches. Each vertex of these two valves lying inside a chamber wall was moved towards the valve's
   own axis to 0.5 mm clear of the wall, the move spread smoothly over the valve (at most 0.5 mm per mm)
   so that its two faces move together; at most 2.5 mm. Now none of the pulmonary valve and 0.06 % of the
   aortic valve lies inside a wall. Done on the source before step 6 (`valvefix2.py`, `apply_fix.mjs`);
   every other part of the rebuilt file decodes identically to the old one.

9. **A tunnel in the right atrium's wall plugged** (26 September 2026). Low on the back of the right
   atrium, beside the inferior vena cava, a small tunnel (about 1.5 by 3 mm) ran through the wall with no
   vessel in it: from behind it looked like a hole, with the tricuspid valve white through it. A plug made
   from the wall's own shape (the wall voxelised at 0.1 mm and closed with a 2 mm ball; the filled piece,
   13.8 mm³, meshed and simplified to a closed 1,498-triangle mesh) is stored as the node `ra_plug`, which
   the widget joins to the right atrium when it loads (`plug.py`, `tool/add_plug.mjs`). Every other part
   decodes identically.

## Drawn by the widget, not in the scan

A scan is one moment, and the valves in it are open. So that the valves can open and close, the widget
draws its own cusps on the model's valve rings (three tricuspid, two mitral, three pulmonary, three aortic),
with chordae tendineae as lines to the model's papillary muscles. In the Explore tab the model's own
valves are shown instead, and the two left papillary muscles are left out: the source's stop 3 to 5 mm
short of every wall, so without their tendons they hung in the left ventricle joined to nothing. The
coronary arteries' cut ends, open tubes in the source, are closed by the widget with a flat disc. The blood particles and the squeeze of each chamber during a beat are also the
widget's.

## Errors noticed in the source, and what the widget does

- `VH_M_papillary_muscle_of_heart_anterior` is labelled "Anterior papillary muscle of left ventricle"
  (FMA:7264) but lies in the right ventricle: it is the right ventricle's anterior papillary muscle, and
  the widget uses it as that.
- `VH_M_left_anterior_descending_artery` carries FMA:8636, "anterior descending branch of left pulmonary
  artery", but it is the anterior descending (interventricular) branch of the left coronary artery.
- The vasculature record's description names "Blood-vasculature-female" although it is the male object.

## Software

three.js r185.1 (MIT licence, `js/vendor/three/LICENSE`): see `js/vendor/three/VENDORED.txt`.
