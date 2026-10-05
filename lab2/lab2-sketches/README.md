# Lab 2 Starter

Move this folder into `~/Documents/cs171-labs`. Keep Lab 1 in its own folder.

Use a current supported Node.js LTS release. The bundled Vite version requires Node 20.19+ on the 20.x line, or Node 22.12+; Node 22.0–22.11 is too old. Ask a TF if installation reports an unsupported engine.

From this folder, run `npm ci`, then `npm run dev`. Open the address printed in the terminal. You should see Sketch A and Sketch B, each showing 10 terminals. Leave the server running and use a second terminal for Claude.

`src/lib/data.js` contains the supplied numeric comparison table. `src/routes/+page.svelte` passes that array to both sketch components. Begin with your paper sketches; the placeholders deliberately provide no suggested chart design.

The materials ZIP adds `visual-vocabulary.pdf` to this folder. Keep it closed until the lab asks you to consult it. The comparison CSV and its scope README are in `data/`. The bundle also puts the original monthly CSV, its README, and the staff regeneration script in `data/` for reference. You do not need to run the data-generation script.

The supplied `CLAUDE.md` contains the project and data rules. In Activity 3, ask Claude to fill in its four question-and-criteria fields.

If `npm ci` reports vulnerabilities, keep the supplied versions and ask a TF if concerned. Do not run `npm audit fix` or `npm audit fix --force`; these can change dependencies and break the starter.

## For course staff

This starter has no runtime CSV loading, interaction, or completed chart. Dependencies are recorded in `package-lock.json`. Use `npm ci` to reproduce the installation and `npm run build` to check it. See `../../build_materials.py` in the source repository for the distribution bundle.
