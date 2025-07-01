package org.joonzis.controller;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.joonzis.domain.UsersDTO;
import org.joonzis.service.MemberService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LoginController {
	
	@Value("${kakao.client-id}")
    private String clientId;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;
    
    @Autowired
    MemberService memberservice;
	
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
		
		conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
		
		String param = "grant_type=authorization_code"
				+ "&client_id=" + clientId
				+ "&redirect_uri=" + redirectUri
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
	
	@PostMapping("/signUp")
	public void signUp(@RequestBody UsersDTO users) {
		log.info("회원가입");
	    memberservice.insertMember(users);
	}
	
	@PostMapping("/login")
	@ResponseBody
	public ResponseEntity<?> login(@RequestBody UsersDTO dto, HttpSession session) {
	    System.out.println("🔐 로그인 요청");
	    if (memberservice.isValidUser(dto.getUser_id(), dto.getUser_pw())) {
	        session.setAttribute("loginUser", dto.getUser_id()); // 세션에 사용자 ID 저장
	        return ResponseEntity.ok(Map.of("message", "로그인 성공"));
	    } else {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("아이디 또는 비밀번호가 틀렸습니다");
	    }
	}
}