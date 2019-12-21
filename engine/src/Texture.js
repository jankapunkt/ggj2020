function Texture (src, width, height) {
  this.image = new window.Image()
  this.image.src = src
  this.width = width
  this.height = height
}

export default Texture
