package org.joonzis.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDTO {
	private int id;
	private int question_id;
    private String subject;
    private String question_text;
    private String option_1;
    private String option_2;
    private String option_3;
    private String option_4;
    private int correct_answer;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private byte[] image_data;  // BLOB 컬럼
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String image_data_base64;  // 클라이언트에 보내줄 Base64 문자열
}
