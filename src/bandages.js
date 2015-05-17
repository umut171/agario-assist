// Exported stuff
window.onresize = onResize
window.onload = init

// Functions
getSkin(this.name)
setInterval(refreshRegionInfo, 180000)
setInterval(drawAll, 1000 / 60)
setInterval(sendTargetUpdate, 100)
function think() {
  K = QUAD.init // @QUAD
}
function calculateZoom() { zoom = (9 * zoom + sizeFactor) / 10 /* @sizeFactor */ }
function Cell(id, x, y, size, color, name) { this.points = [] }
function SizeCache(size, color, stroke, strokeColor) { this._strokeColor }

// Variables
canvas = _canvas = document.getElementById('canvas')
ctx = canvas.getContext('2d') // @canvas
canvasWidth = window.innerWidth
canvasHeight = window.innerHeight
isMobile = 'ontouchstart' in window && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
mouseX = e.clientX
mouseY = e.clientY
ctx.scale(zoom, zoom) // @ctx
blackTheme ? '#111111' : '#F2FBFF'
hardMode || 15 < this.size
//ctx.drawImage(renderedScoreboard, canvasWidth - renderedScoreboard.width - 10, 10) // @ctx @canvasWidth
skinsNames = 'poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;pewdiepie;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;nazi;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina'.split(';')

// Random, mostly to help the definitions above run
sizeFactor = Math.pow(Math.min(64 / sizeFactor, 1), 0.4) * Math.max(canvasHeight / 1080, canvasWidth / 1920)
conn.readyState == conn.OPEN
conn.send(bytes) // @conn


// Cell.draw
tmp1 = !this.isVirus && 0.5 > zoom; // @zoom
tmp2 = tmp3 ? -1 != bannedSkins.indexOf(tmp2) : false
tmp3 = -1 != myCells.indexOf(this); // @tmp3
namesEnabled || tmp3 // @tmp3
massEnabled && tmp3 // @tmp3

