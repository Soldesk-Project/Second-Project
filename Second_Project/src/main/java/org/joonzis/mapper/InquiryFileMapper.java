package org.joonzis.mapper;

import org.joonzis.domain.InquiryFileVO;

public interface InquiryFileMapper {

	/** 파일 메타데이터 저장 */
    void insertFile(InquiryFileVO file);
}
