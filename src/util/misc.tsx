
export function copyObject<T=any>(obj: T): T {
    obj = JSON.parse(JSON.stringify(obj))
    return obj
}
