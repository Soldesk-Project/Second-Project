package org.joonzis.domain;

import java.sql.Date;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
public class QuestRequestVO {
	private long id;
    private Long user_no;
    private String user_id;
    private String subject;
    private String question_text;
    private String option_1;
    private String option_2;
    private String option_3;
    private String option_4;
    private int correct_answer;
    private Date created_at;
    private String status;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private byte[] image_data;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String image_data_base64;
}