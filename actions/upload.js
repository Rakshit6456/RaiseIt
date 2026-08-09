"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(formData) {
    const file = formData.get("file");

    if (!file) {
        throw new Error("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: "image", folder: "infratrack/complaints" },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result.secure_url);
            }
        ).end(buffer);
    });
}
