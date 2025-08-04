import React, { useState } from 'react';
import axios from 'axios';

function FileUploadComponent() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const onFileChange = e => {
    const file = e.target.files[0];
    setFile(file);
    setPreview(URL.createObjectURL(file)); 
  };

  const onUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("업로드 성공: " + res.data);
    } catch (err) {
      alert("업로드 실패: " + err.message);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onFileChange} />
      {preview && <img src={preview} alt="미리보기" style={{ width: 200 }} />}
      <button onClick={onUpload}>업로드</button>
    </div>
  );
}

export default FileUploadComponent;
