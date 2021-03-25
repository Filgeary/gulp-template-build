# gulp4 template build - FrontEnd Ready

> Work in progress

## Features

- Live Reload browser
- SASS BEM blocks
- Mobile-first pattern
- Minification HTML, CSS, JS
- Sourcemaps support
- Minification Images + Webp support (webp only via `prodServer` in `build` folder)
- Merge SVG into one SVG Sprite
- Linting: htmlhint, stylelint
- Formatting: stylelint, prettier
- Tools: Babel, Autoprefixer, Browserslist
- Pre-commit hooks : stylelint, prettier
- Deploy to `gh-pages` branch
- 2 Servers: `devServer` & `prodServer`

### TODO

- rewrite `require` to `import` (need babel?)
- fix `devServer` & `prodServer` & `Watch files` tasks to optimize code
- add variable `Paths` for files to `gulpfile.js`
- add ESlint
- add deploy via SSH, SFTP
- others features...
