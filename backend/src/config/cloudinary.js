"use strict";

const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");

const requiredEnvVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

function ensureCloudinaryConfigured() {
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing Cloudinary environment variables: ${missingEnvVars.join(", ")}`);
    }
}

function uploadBufferToCloudinary(buffer, { publicId, folder = "lexiflow/documents", resourceType = "raw", format = "pdf" }) {
    ensureCloudinaryConfigured();

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: resourceType,
                format,
                overwrite: true,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType,
                });
            }
        );

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}

async function deleteFromCloudinary(publicId, { resourceType = "raw" } = {}) {
    ensureCloudinaryConfigured();
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = {
    cloudinary,
    ensureCloudinaryConfigured,
    uploadBufferToCloudinary,
    deleteFromCloudinary,
};