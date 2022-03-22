import * as THREE from 'three';
export class IDTech {
    constructor(width = 512, count = 64) {
        this.width = width;
        this.count = count;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = width;
        this.ctx = this.canvas.getContext('2d');
        this.data = new Uint8Array(width * width * count * 4);
        this.texture = new THREE.DataTexture2DArray(this.data, width, width, count);
        this.texture.wrapS = THREE.RepeatWrapping
        this.texture.wrapT = THREE.RepeatWrapping
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.UnsignedByteType;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = true; 
        // this.texture.encoding = THREE.sRGBEncoding;
        this.loadDic = {};
    }

    loadAll(basicPath) {
        if (!this.imageLoader)
            this.imageLoader = new THREE.ImageLoader();
        for (let i = 0; i < this.count; i++) {
            const id = i;
            const url = `${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}${basicPath}(${id + 1}).jpg`
            if (this.loadDic[id])
                return;

            this.imageLoader.load(url, (image) => {
                this.ctx.drawImage(image, 0, 0, this.width, this.width);
                const imageData = this.ctx.getImageData(0, 0, this.width, this.width);
                const offset = id * this.width * this.width * 4;

                this.data.set(new Uint8Array(imageData.data.buffer), offset);
                this.texture.needsUpdate = true;
                this.loadDic[id] = true;
            }, undefined, () => {

            });

        }
    }

    addImage(id, url) {
        url = url || `${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}textures/terrain/terrain (${id + 1}).png`
        if (this.loadDic[id])
            return;
        if (id > this.count) {
            console.error('id超出image数量')
            return;
        }
        if (!this.imageLoader)
            this.imageLoader = new THREE.ImageLoader();

        this.imageLoader.load(url, (image) => {
            this.ctx.drawImage(image, 0, 0, this.width, this.width);
            const imageData = this.ctx.getImageData(0, 0, this.width, this.width);
            const offset = id * this.width * this.width * 4;
            this.data.set(imageData.data.buffer, offset);
            this.texture.needsUpdate = true;
            this.loadDic[id] = true;
        })
    }
}

export const biomeTexture = {
    0: '',
    1: '',
    2: ''
}