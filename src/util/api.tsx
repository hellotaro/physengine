import * as THREE from 'three'

export function getRaw(url: string) {
    return fetch(url)
    .then((data) => {
        return data.text()
    })
}

export function get(url: string) {
    return fetch(url)
    .then((data) => {
        return data.json()
    })
}

export function post(url: string, body: any, cb: any, err: any = () => {}) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body) 
    })
    .then((data) => {
        return data.json()
    })
}

export async function loadTex(url: string) {
    const texLoader = new THREE.TextureLoader()
    const texture = await texLoader.loadAsync(url)
    return texture
}
