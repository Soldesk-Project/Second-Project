package org.joonzis.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
public class QuestRequestVO {
    private Long user_no;
    private String subject;
    private String question_text;
    private String option_1;
    private String option_2;
    private String option_3;
    private String option_4;
    private int correct_answer;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private byte[] image_data;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String image_data_base64;
}