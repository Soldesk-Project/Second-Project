package org.joonzis.service;

import java.util.Map;

public interface InquiryService {
	/** 문의 리스트 + 전체 건수(Map&lt;"items", List&gt;, "totalCount", Long&gt;) */
    Map<String, Object> getInquiries(int page, int size);

    /** 새 문의글 저장 */
    void createInquiry(Long userId, String subject, String message);
}
