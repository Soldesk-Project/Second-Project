package org.joonzis.controller;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Blob;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonInclude;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LoginController {
	
	private final String CLIENT_ID = "99ddb7e910a924e51b633490da611ead";
	private final String REDIRECT_URI = "http://localhost:3000/kakao/callback";
	
	@ResponseBody
	@PostMapping("/kakao/login")
	public Map<String, Object> kakaoLoagin(@RequestBody Map<String, String> request) throws Exception{
		String code = request.get("code");
		
		// 1. AccessToken 요청
		String token = getAccessToken(code);
		
		// 2. 사용자 정보 요청
		Map<String, Object> userInfo = getUserInfo(token);
		
		// 3. 사용자 처리 (예 : 자동 회원가입)
		String kakaoId = String.valueOf(userInfo.get("id"));
		String nickname = (String)((Map<String, Object>)userInfo.get("properties")).get("nickname");
		
		Map<String, Object> response = new HashMap<>();
		response.put("id", kakaoId);
		response.put("nickname", nickname);
		return response;
	}
	
	public String getAccessToken(String code) throws Exception{
		URL url = new URL("https://kauth.kakao.com/oauth/token");
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("POST");
		conn.setDoOutput(true);
		
		String param = "grant_type=authorization_code"
				+ "&client_id=" + CLIENT_ID
				+ "&redirect_uri=" + REDIRECT_URI
				+ "&code=" + code;
		
		try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()))) {
			bw.write(param);
			bw.flush();
		} 
		
		StringBuilder sb = new StringBuilder();
		try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
			String line;
			while((line = br.readLine()) != null) {
				sb.append(line);
			}
		}
		
		JSONObject json = new JSONObject(sb.toString());
		return json.getString("access_token");
	}
	
	public Map<String, Object> getUserInfo(String token) throws Exception {
		URL url = new URL("https://kapi.kakao.com/v2/user/me");
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("GET");
		conn.setRequestProperty("Authorization", "Bearer " + token);
		
		StringBuilder sb = new StringBuilder();
		try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
        }

        JSONObject json = new JSONObject(sb.toString());
        return json.toMap();
	}
	
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
