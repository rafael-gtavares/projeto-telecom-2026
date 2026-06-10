const { uploadFile: uploadToCloudinary } = require('../services/cloudinary.service');

const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Nenhum arquivo enviado',
            });
        }

        const result = await uploadToCloudinary(
            req.file.buffer,
            'test',
        );
        
        return res.status(200).json({
            url: result.secure_url,
            publicId: result.public_id
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadFile,
};