console.log('load', object);

setInterval(() => {
  object.position.y = Math.sin((Date.now() % 1000) / 1000 * Math.PI * 2);
}, 10);