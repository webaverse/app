export const functionValueExtractor = async (fn) => {
    return await fn();
}

export const cloneObject = (obj) => {
    return JSON.parse(JSON.stringify(obj));
}