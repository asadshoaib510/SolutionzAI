# Solutionz AI website

The built website: plain HTML, CSS and JavaScript, served as it is by GitHub Pages at https://asadshoaib510.github.io/SolutionzAI/ for review before launch.

- 12 pages: the homepage, Services, six service pages, About, Contact, Privacy, and `404.html`
- `assets/`: CSS, scripts, fonts (Manrope, Inter, JetBrains Mono, all under the SIL Open Font License), logos, images and the contact card (`solutionzai-card.vcf`)
- GSAP 3.13 is loaded from cdnjs; Lenis is in `assets/vendor/`
- `.nojekyll` makes GitHub Pages serve the files unchanged

This copy is built for the `/SolutionzAI/` address, and every page asks search engines not to list it until launch. The command is `MSYS_NO_PATHCONV=1 FRESH_BASE=/SolutionzAI/ FRESH_NOINDEX=1 python tools/build_fresh.py console`. For solutionzai.com, rebuild with `FRESH_BASE=/` and without `FRESH_NOINDEX`.

These files are generated. Edit the source in the Solutionz AI brand folder (`tools/site_content.py` and `07-website/src/`), rebuild, and copy the output here. Don't edit the files in this repository by hand.
