package org.joonzis.domain;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InquiryVO {
	private Long id;
    private String userId;
    private String category;
    private String  subject;
    private String  message;
    private int postPassword;
    private String email;
    private String userNick;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime createdAt;
    
    // 첨부파일 정보를 담을 InquiryFileVO 리스트 추가
    private List<InquiryFileVO> files;
}
