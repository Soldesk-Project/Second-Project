package org.joonzis.service;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.joonzis.domain.UploadedFileVO;
import org.joonzis.mapper.UploadedFileMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileUploadService {
	
	@Value("${file.upload-dir}")
    private String uploadDir;

	@Autowired
	private UploadedFileMapper uploadedFileMapper;

	public String saveFile(MultipartFile file) throws IOException {
	    String originalFilename = file.getOriginalFilename();
	    String extension = "";
	    String baseName = "unknown";

	    int dotIndex = originalFilename.lastIndexOf(".");
	    if (dotIndex != -1) {
	        baseName = originalFilename.substring(0, dotIndex);
	        extension = originalFilename.substring(dotIndex);
	    }

	    String timestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
	    String storedFileName = baseName + "_" + timestamp + extension;

	    File targetFile = new File(uploadDir, storedFileName);
	    targetFile.getParentFile().mkdirs();
	    file.transferTo(targetFile);

	    UploadedFileVO vo = new UploadedFileVO();
	    vo.setOriginal_name(originalFilename);
	    vo.setStored_name(storedFileName);
	    vo.setStored_path(targetFile.getAbsolutePath());

	    uploadedFileMapper.insertUploadedFile(vo);  // DB 저장

	    return storedFileName;  // ✅ 파일명을 리턴
	}

}
