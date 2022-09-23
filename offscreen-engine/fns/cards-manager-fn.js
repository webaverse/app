import {generateObjectUrlCard} from '../../card-renderer.js';

export async function generateObjectUrlCardRemote(o) {
    const imageBitmap = await generateObjectUrlCard(o);
    return imageBitmap;
}