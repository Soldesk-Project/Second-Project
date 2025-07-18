package org.joonzis.domain;

import java.util.Date;

import lombok.Data;

@Data
public class InquiryFileVO {

	    private Long   fileId;     // PK (seq_inquiry_file)
	    private Long   inquiryId;  // FK (inquiry 테이블의 PK)
	    private String filename;   // 저장된 파일명
	    private String filepath;   // 저장 경로 (절대경로 또는 상대경로)
	    private Date   uploadedAt; // 업로드 시각
}
