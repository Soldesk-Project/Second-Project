package org.joonzis.controller;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.security.JwtUtil;
import org.joonzis.service.LoggedInUsers;
import org.joonzis.service.MemberService;
import org.joonzis.service.UserService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    
    @Autowired
    UserService userservice;
    
    @Autowired
    JwtUtil jwtUtil;
    
    @Autowired
    private LoggedInUsers loggedInUsers;
	
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
	public void signUp(@RequestBody UsersVO users) {
	    memberservice.insertMember(users);
	}
	
	@GetMapping("/signUp/checkId")
	public ResponseEntity<Map<String, Boolean>> checkUserId(@RequestParam String user_id) {
	    boolean isDuplicate = userservice.isUserIdTaken(user_id);
	    return ResponseEntity.ok(Collections.singletonMap("duplicate", isDuplicate));
	}
	
	@GetMapping("/signUp/checkNick")
	public ResponseEntity<Map<String, Boolean>> checkUserNick(@RequestParam String user_nick) {
	    boolean isDuplicate = userservice.isUserNickTaken(user_nick);
	    return ResponseEntity.ok(Collections.singletonMap("duplicate", isDuplicate));
	}
	
	@GetMapping("/signUp/checkEmail")
	public ResponseEntity<Map<String, Boolean>> checkUserEmail(@RequestParam String user_email) {
	    boolean isDuplicate = userservice.isUserEmailTaken(user_email);
	    return ResponseEntity.ok(Collections.singletonMap("duplicate", isDuplicate));
	}
	
	@GetMapping("/findId/checkEmail")
	public String findIdByEmail(@RequestParam String user_email) {
	    String email = userservice.findIdByEmail(user_email);
	    return email;
	}
	
	@PostMapping("/findPw/checkIdAndEmail")
	public String findPwByIdAndEmail(@RequestBody UsersVO vo) {
	    String pw = userservice.findPwByIdAndEmail(vo);
	    return pw;
	}
	
	@PostMapping("/login")
	@ResponseBody
	public ResponseEntity<?> login(@RequestBody UserInfoDTO dto, HttpSession session) {
		
		if (loggedInUsers.isLoggedIn(dto.getUser_id())) {
	        return ResponseEntity.status(HttpStatus.CONFLICT)
	                .body("이미 로그인된 사용자입니다.");
	    }
	    
	    UserInfoDTO user = memberservice.isValidUser(dto.getUser_id(), dto.getUser_pw());
	    if (user != null) {
	    	loggedInUsers.addUser(dto.getUser_id());
	    	
	        String token = jwtUtil.generateToken(user.getUser_id());

	        // ✅ 토큰과 함께 전체 유저 정보도 응답
	        Map<String, Object> response = new HashMap<>();
	        response.put("token", token);
	        response.put("user", user);  // 전체 정보 포함 (user_pw 포함됨 주의)

	        session.setAttribute("user_id", user.getUser_id());
	        
	        return ResponseEntity.ok(response);
	    } else {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 실패");
	    }
	}
	
	@PostMapping("/logout")
	public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
	    String userId = request.get("userId");
	    if (userId != null) {
	        loggedInUsers.removeUser(userId);
	        return ResponseEntity.ok("로그아웃 완료");
	    }
	    return ResponseEntity.badRequest().body("잘못된 요청");
	}
	
	@GetMapping("/auth/me")
	public ResponseEntity<?> getUser(@RequestHeader("Authorization") String bearer) {
	    String token = bearer.replace("Bearer ", "");
	    if (!jwtUtil.validateToken(token)) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("토큰 만료");
	    }

	    String user_id = jwtUtil.getUserIdFromToken(token);
	    UserInfoDTO user = memberservice.getUserById(user_id);

	    return ResponseEntity.ok(user); // 전체 정보 그대로 전달
	}



}