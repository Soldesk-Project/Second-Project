package org.joonzis.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.InquiryVO;

public interface InquiryMapper {
	/** 지정 범위(offset, limit)의 문의 리스트 조회 */
    List<InquiryVO> selectInquiries(
        @Param("offset") int offset,
        @Param("limit")  int limit
    );

    /** 전체 문의 건수 조회 */
    int countInquiries();

    /** 새 문의글 등록 */
    int insertInquiry(InquiryVO inquiry);
    
    /** 상세 조회 */
    InquiryVO selectById(@Param("id") Long id);
}
