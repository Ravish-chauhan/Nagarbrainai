const CLOUD_NAME = 'dee28gnzv';
const UPLOAD_PRESET = 'nagarbrain_incidents';

export const uploadToCloudinary = async (base64DataUrl) => {
  const formData = new FormData();
  formData.append('file', base64DataUrl);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'nagarbrain/incidents');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};
