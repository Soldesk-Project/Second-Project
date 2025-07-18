package org.joonzis.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.InquiryVO;
import org.springframework.web.multipart.MultipartFile;

public interface InquiryService {
	/** 문의 리스트 + 전체 건수(Map&lt;"items", List&gt;, "totalCount", Long&gt;) */
    Map<String, Object> getInquiries(int page, int size);

    /** 새 문의글 저장 */
    void createInquiry(InquiryVO inquiry, List<MultipartFile> files) throws IOException;
    
    /** 문의글 상세페이지*/
    InquiryVO findById(Long id);
}
