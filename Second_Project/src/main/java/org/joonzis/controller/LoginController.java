package org.joonzis.controller;

import java.sql.Blob;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonInclude;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LoginController {

    @Autowired
    private DataSource dataSource;

    @GetMapping(value = "/questions")
    public List<QuestionDto> getAllQuestions() throws Exception {
        List<QuestionDto> list = new ArrayList<>();

        String sql = "SELECT id, subject, question_text, option_1, option_2, option_3, option_4, correct_answer, image_data FROM ExamQuestions ORDER BY id";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                QuestionDto dto = new QuestionDto();
                dto.setId(rs.getInt("id"));
                dto.setSubject(rs.getString("subject"));
                dto.setQuestion_text(rs.getString("question_text"));
                dto.setOption_1(rs.getString("option_1"));
                dto.setOption_2(rs.getString("option_2"));
                dto.setOption_3(rs.getString("option_3"));
                dto.setOption_4(rs.getString("option_4"));
                dto.setCorrect_answer(rs.getInt("correct_answer"));

                Blob blob = rs.getBlob("image_data");
                if (blob != null) {
                    byte[] imgBytes = blob.getBytes(1, (int) blob.length());
                    String base64 = Base64.getEncoder().encodeToString(imgBytes);
                    dto.setImage_data(base64);
                }

                list.add(dto);
            }
        }

        return list;
    }

    public static class QuestionDto {
        private int id;
        private String subject;
        private String question_text;
        private String option_1;
        private String option_2;
        private String option_3;
        private String option_4;
        private int correct_answer;

        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String image_data;

        // Getters and Setters
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getQuestion_text() { return question_text; }
        public void setQuestion_text(String question_text) { this.question_text = question_text; }

        public String getOption_1() { return option_1; }
        public void setOption_1(String option_1) { this.option_1 = option_1; }

        public String getOption_2() { return option_2; }
        public void setOption_2(String option_2) { this.option_2 = option_2; }

        public String getOption_3() { return option_3; }
        public void setOption_3(String option_3) { this.option_3 = option_3; }

        public String getOption_4() { return option_4; }
        public void setOption_4(String option_4) { this.option_4 = option_4; }

        public int getCorrect_answer() { return correct_answer; }
        public void setCorrect_answer(int correct_answer) { this.correct_answer = correct_answer; }

        public String getImage_data() { return image_data; }
        public void setImage_data(String image_data) { this.image_data = image_data; }
    }
} 
