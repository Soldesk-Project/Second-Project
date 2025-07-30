package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.InquiryFileVO;

public interface InquiryFileMapper {

	/** 파일 메타데이터 저장 */
    void insertFile(InquiryFileVO file);

	List<InquiryFileVO> selectFilesByInquiryId(Long id);
}
