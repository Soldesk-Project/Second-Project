package org.joonzis.service;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.InquiryFileVO;
import org.joonzis.domain.InquiryVO;
import org.joonzis.mapper.InquiryFileMapper;
import org.joonzis.mapper.InquiryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class InquiryServiceImpl implements InquiryService {

    @Autowired
    private InquiryMapper inquiryMapper;

    @Autowired
    private InquiryFileMapper fileMapper;  // 파일 메타데이터 저장 매퍼
    
    private final String BASE_UPLOAD_DIR = "C:/Dev/workspace/workspace_2ndProject/second-project-react/public/";

    @Override
    public Map<String, Object> getInquiries(int page, int size) {
        int offset = (page - 1) * size;
        List<InquiryVO> items    = inquiryMapper.selectInquiries(offset, size);
        int totalCount           = inquiryMapper.countInquiries();
        
        // 각 InquiryVO에 파일 정보 추가
        for (InquiryVO inquiry : items) {
            List<InquiryFileVO> files = fileMapper.selectFilesByInquiryId(inquiry.getId());
            files.forEach(file -> {
                String webPath = file.getFilepath()
                                 .replace(BASE_UPLOAD_DIR.replace("/", File.separator), "/")
                                 .replace(File.separator, "/");
                file.setFilepath(webPath);
            });
            inquiry.setFiles(files);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("items",      items);
        result.put("totalCount", totalCount);
        return result;
    }

    @Override
    public InquiryVO findById(Long id) {
        return inquiryMapper.selectById(id);
    }
    
    @Transactional
    @Override
    public void createInquiry(InquiryVO inquiry, List<MultipartFile> files) throws IOException {
        // 1) inquiry 테이블 저장
        inquiryMapper.insertInquiry(inquiry);
        Long generatedId = inquiry.getId();  // selectKey 로 셋팅된 PK
        System.out.println("Generated Inquiry ID: " + generatedId);
        if (generatedId == null) {
            // null 이면 오류 처리 또는 경고
            throw new IllegalArgumentException("Inquiry ID was not generated correctly. Cannot proceed with file upload.");
        }

        // 2) 업로드 디렉토리 준비
        String dirPath = BASE_UPLOAD_DIR + "images/inquiry/" + generatedId;
        File baseDir = new File(dirPath);
        if (!baseDir.exists()) {
            boolean created = baseDir.mkdirs();
            if (!created) {
                // 디렉토리 생성 실패 시 예외 처리 (권한 문제 등이 있을 수 있음)
                throw new IOException("Failed to create directory: " + dirPath + ". Check permissions.");
            }
        }

        // 3) 파일 저장 & 메타데이터 기록
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                // 충돌 방지를 위해 타임스탬프_원본명
                String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                File targetFile = new File(baseDir, filename);
                file.transferTo(targetFile);  // 디스크에 저장

                // DB 에 메타정보 INSERT
                InquiryFileVO fileVo = new InquiryFileVO();
                fileVo.setInquiryId(generatedId);
                fileVo.setFilename(filename);
                fileVo.setFilepath(targetFile.getPath());
                fileMapper.insertFile(fileVo);
            }
        }
    }
}
