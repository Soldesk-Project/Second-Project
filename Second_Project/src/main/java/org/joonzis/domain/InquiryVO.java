package org.joonzis.domain;

import java.time.LocalDateTime;

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
	private Long    id;
    private Long    userId;
    private String  subject;
    private String  message;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime createdAt;
}
