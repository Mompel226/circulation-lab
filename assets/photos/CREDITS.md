# Where every picture, video and sound came from

Three kinds of picture are in this lab, and they are credited differently.

**The lesson pictures.** Most of the photographs and diagrams are the ones Dr Mompel shows in class,
taken from his own Topic 9 lesson slides and handouts — chosen on purpose, so that a student meets the
same picture here as on the board. Their original sources were not recorded in the slides; they are
used here for teaching, under the same terms as in the lesson. Each is credited on the page as "from
the … lesson slides" or "… lesson materials".

**Openly licensed figures.** The 3D heart is a real human heart from the HuBMAP Human Reference Atlas (CC BY 4.0), and the vessel journey uses three micrographs from Wikimedia Commons (below). Two lesson pictures turned out to be OpenStax figures (CC BY 4.0). They are
credited to OpenStax on the page, with a link, as the licence asks.

**The body on the left** is a real anatomical drawing: Mariana Ruiz Villarreal's public-domain
*Circulatory System*, the same artist as the Digestion Lab's body. The blood flowing in it follows the
centre line of every vessel she drew, traced from the drawing itself
(`circulation-lab-source/plate-build/`). The magnified heart and every animation are drawn by the
page itself (see the header of each file in `js/`).

Every base name below stands for two files, `-900.jpg` and `-900.webp`.

## Openly licensed

| File | What it shows | Source | Licence |
|---|---|---|---|
| `vertebrate-hearts-*` | the circulation of a fish, an amphibian, a reptile and a mammal | [OpenStax, *Biology 2e*, section 40.1](https://openstax.org/books/biology-2e/pages/40-1-overview-of-the-circulatory-system) — also on the 9.1 slides (slide 10) | CC BY 4.0 |
| `heart-valves-above-*` | the four valves seen from above, the atria removed | [OpenStax, *Anatomy and Physiology 2e*, section 19.1](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy) — also on the 9.2 slides (The Heart, slide 8) | CC BY 4.0 |
| `assets/3d/heart.glb` | the real heart in "Explore a real heart" | HuBMAP Human Reference Atlas: Browne and Schlehlein (2024), [3D Reference Organ for Heart, Male v1.3](https://doi.org/10.48539/HBM564.WKNG.249) and [Blood Vasculature, Male v1.3](https://doi.org/10.48539/HBM473.XTPP.725), from the Visible Human Male (US National Library of Medicine). Every change is listed in `assets/3d/CREDITS.md` | CC BY 4.0 |
| `js/vendor/three/` | the 3D engine | three.js r185.1 | MIT |
| the body on the plate (`js/circ-art.js`) | the whole circulatory system from the front: arteries, veins, heart, lungs, liver, kidneys | Mariana Ruiz Villarreal (LadyofHats), [Circulatory System no tags.svg](https://commons.wikimedia.org/wiki/File:Circulatory_System_no_tags.svg), Wikimedia Commons, drawn from Gray's Anatomy (36th ed.) and the Sobotta atlas. Unchanged except the white veil over the left arm is removed; the arrow tips of her labelled version ([Circulatory System en.svg](https://commons.wikimedia.org/wiki/File:Circulatory_System_en.svg)) name the vessels | public domain |
| the small intestine on the plate (`js/circ-gut.js`) | borrowed so the hepatic portal vein has something to come from | Mariana Ruiz (LadyofHats) and Jmarchn, [Digestive system without labels.svg](https://commons.wikimedia.org/wiki/File:Digestive_system_without_labels.svg) (the Digestion Lab's plate), placed by matching the two drawings' livers | public domain |
| body outline (`js/body-art.js`) | the silhouette in the "After a meal" animation | Mikael Häggström, "Man shadow", from his [Human body diagrams](https://commons.wikimedia.org/wiki/Human_body_diagrams), Wikimedia Commons | CC0 |

## From the lesson slides and handouts

The decks are the PowerPoints in `IGCSE Lessons/Y10/T9_Circulatory System/`; the slide is its number
in that deck.

| File | What it shows | Deck or file | Slide |
|---|---|---|---|
| `heart-dissected-*` | a real heart cut in half, with its printed labels | 9.2-1 The Heart | 13 |
| `coronary-cast-*` | a resin cast of the coronary arteries | 9.2-1 The Heart | 4 |
| `angiogram-blocked-*` | a right coronary artery blocked, and after a stent; the "!!" marks painted out and the bottom banner cropped | 9.2-2 Coronary Heart Disease | 5 |
| `stethoscope-*` | a labelled stethoscope | 9.2-3 Heart Activity | 8 |
| `pressure-graphs-*` | cross-sectional area, velocity and pressure along the vessels | `L3-5.The Heart/To print/Pressure.png` | — |
| `kidney-vessels-*` | a dissection of the aorta, vena cava and renal vessels | 9.3 Blood Vessels | 16 |
| `liver-vessels-*` | the liver and its vessels | 9.3 Blood Vessels | 17 |
| `blood-centrifuged-*` | tubes of blood after spinning in a centrifuge | 9.4 Blood | 5 |
| `blood-layers-*` | a tube of blood before and after spinning, labelled | 9.4 Blood | 5 |
| `blood-smear-*` | a stained blood smear | `L7.Blood/To Print/Cells.png` | — |

### Worth checking before the lab is published

These look like pictures from commercial sources, and the slides do not say where they came from:

- `pressure-graphs` has the style of a Pearson textbook figure (*Campbell Biology*).
- `blood-centrifuged` looks like a stock photograph.
- `heart-dissected`, `coronary-cast`, `angiogram-blocked`, `kidney-vessels`, `liver-vessels`, `stethoscope`
  and `blood-smear`: source not recorded.

## The pictures in the "journey" widget

The widget is `js/w-journey.js`, in the vessels station ("Arteries, veins and capillaries"). It shows
one real picture at each stage where an open-licence one exists, and never the same picture twice.
Each base name below stands for `-900.jpg` and `-900.webp`, plus `-1400.jpg` and `-1400.webp` where
the source was big enough. A picture smaller than 900 px wide keeps its own size under the `-900` name,
as in the Plants Lab.

| File | Stage | Source | Author | Licence |
|---|---|---|---|---|
| `jn-artery-*` (900 and 1400, square) | 1 Artery | [Артерия мышечно - эластического типа, гематоксилин - эозин, увеличение 40.jpg](https://commons.wikimedia.org/wiki/File:%D0%90%D1%80%D1%82%D0%B5%D1%80%D0%B8%D1%8F_%D0%BC%D1%8B%D1%88%D0%B5%D1%87%D0%BD%D0%BE_-_%D1%8D%D0%BB%D0%B0%D1%81%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_%D1%82%D0%B8%D0%BF%D0%B0,_%D0%B3%D0%B5%D0%BC%D0%B0%D1%82%D0%BE%D0%BA%D1%81%D0%B8%D0%BB%D0%B8%D0%BD_-_%D1%8D%D0%BE%D0%B7%D0%B8%D0%BD,_%D1%83%D0%B2%D0%B5%D0%BB%D0%B8%D1%87%D0%B5%D0%BD%D0%B8%D0%B5_40.jpg) — an artery of the muscular-elastic type cut across, haematoxylin and eosin, ×40, photographed through the eyepiece (Wiki Science Competition 2017). Cropped to the round field of the microscope. | Андрюша Романов (Andryusha Romanov) | CC BY 4.0 |
| `jn-skin-capillaries-*` (900 and 1400) | 2 Arteriole | [Nailfold Capillaries.png](https://commons.wikimedia.org/wiki/File:Nailfold_Capillaries.png) — capillary loops in the skin at the base of a fingernail, in a living person, by high-speed videocapillaroscopy (Russian Science Photo Competition 2019). Converted from PNG. Shown at the arteriole stage as the capillaries an arteriole supplies, and captioned so. | Dmitry Stavtsev, Nikita Margaryants and Mikhail Volkov | CC BY 4.0 |
| `jn-capillary-tem-*` (900 and 1400) | 3 Capillary | [A red blood cell in a capillary, pancreatic tissue - TEM.jpg](https://commons.wikimedia.org/wiki/File:A_red_blood_cell_in_a_capillary,_pancreatic_tissue_-_TEM.jpg) — a capillary in the pancreas cut across, one red cell almost filling it; transmission electron microscope, with its 1 µm scale bar. Uncropped. | Louisa Howard, Dartmouth Electron Microscope Facility | Public domain (PD-author) |
| `jn-artery-vein-*` (600 × 400, no 1400) | 5 Vein | The 9.3 lesson slides (`9.3 Blood Vessels`, slide 9): "Artery and Vein (40X)", a round artery beside a flattened vein, with the words on it as in the slide. The original bytes, not re-encoded. | From the 9.3 lesson slides; the original source is not recorded in the deck | Used as in the lesson |

**Stage 4, the venule, has no picture.** Every clear micrograph of a venule found on Wikimedia Commons
is CC BY-SA, which these labs do not use: Josef Reischig's venules with a valve (`Venule (238 10A)`,
`(238 11A)`, `(238 12A)`), `Blutgefäße (1).jpg` (an arteriole, a venule and a capillary together) and
the rabbit vessel series by John Alan Elson. The section drawing is shown full width instead.

**Looked at and not used:**
- `Arteriole elastic membrane.jpg` (CC BY 4.0): its red cells measure about a thirtieth of its lumen,
  so the vessel is about 200 µm across — a small artery, not an arteriole.
- `Бедренная вена у кошки.jpg` (cat femoral vein, CC BY 4.0, the same photographer as the artery):
  fully collapsed into a slit, so its wall looks thick — it would teach the opposite of "thin wall".
- `A Blood Vessel fixed and Stain.jpg` (CC BY 4.0): probably a venule, but not identified by its author.
- `2102 Comparison of Artery and Vein.jpg` (OpenStax): its micrograph is © University of Michigan
  Medical School, so its licence is not clearly CC BY.

## Videos and sound

| File | What it is | Where it came from |
|---|---|---|
| `assets/video/plasma-function.mp4` | an animation inside a blood vessel: cells in plasma, substances leaving a capillary | shown in the 9.4 lesson; original source not recorded |
| `assets/video/rbc-oxygen.mp4` | red blood cells, haemoglobin and oxygen | shown in the 9.4 lesson; original source not recorded |
| `assets/video/phagocyte-real.mp4` | classic microscope footage of a phagocyte engulfing particles | shown in the 9.4 lesson; original source not recorded |
| `assets/audio/heart-normal.mp3` | a normal heart through a stethoscope, "lub, dub" | played in the 9.2 lesson (Heart Activity, slide 4); original source not recorded |

The two sounds in the cardiac-cycle animation ("lub" and "dub") are not recordings: the page makes
them itself (`js/w-common.js`, `thump`).
