const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const uploadImage = async (file) => {
  return new Promise(async (resolve) => {
    try {
      const s3 = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const imgKey = `${Date.now()}_${file.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imgKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const url = `https://${process.env.S3_CLOUDFRONT_URL}/${imgKey}`;
      resolve({ success: true, imageUrl: url });
    } catch (err) {
      console.log(err);
      resolve({ success: false });
    }
  });
};

module.exports = { uploadImage };
