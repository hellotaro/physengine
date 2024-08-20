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

export function postChatGPTChat(body: any, apiKey: string) {
    const url = "https://api.openai.com/v1/chat/completions"
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify(body) 
    })
    .then((data) => {
        return data.json()
    })
}

export function postChatGPTImage(body: any, apiKey: string) {
    const url = "https://api.openai.com/v1/images/generations"
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
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

// example
const postChatTest = () => {
    const data = {
        model: "gpt-3.5-turbo",
        messages: [{
            role: "system",
            content: "You are an assistant, skilled in artistic paint."
        },
        {
            role: "user",
            content: "hello!",
        }]
    }
    postChatGPTChat(data,"[API KEY]").then((data: any) => {console.log(data)})
}
const postImageTest = () => {
    const data = {
        model: "dall-e-2",
        prompt: "duck in pond",
        n: 1,
        size: "512x512",
    }
    postChatGPTImage(data,"[API KEY]").then((data: any) => {console.log(data)})
}
