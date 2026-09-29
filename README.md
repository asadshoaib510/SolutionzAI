# Solutionz AI website

The built website for solutionzai.com: plain HTML, CSS and JavaScript, ready to host as it is. The folder root is the website root.

- 12 pages: the homepage, Services, six service pages, About, Contact, Privacy, and `404.html`
- `assets/`: CSS, scripts, fonts (Manrope, Inter, JetBrains Mono, all under the SIL Open Font License), logos, images and the contact card (`solutionzai-card.vcf`)
- GSAP 3.13 is loaded from cdnjs; Lenis is in `assets/vendor/`

These files are generated. Edit the source in the Solutionz AI brand folder (`tools/site_content.py` and `07-website/src/`), rebuild with `FRESH_BASE=/ python tools/build_fresh.py`, and copy the output here. Don't edit the files in this repository by hand.

Private backup. Nothing is connected to it yet.
