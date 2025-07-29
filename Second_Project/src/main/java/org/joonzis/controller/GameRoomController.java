package org.joonzis.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;
import org.joonzis.service.PlayService;
import org.joonzis.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameRoomController {
	@Autowired
	private PlayService playService;

	@Autowired
	private UserService userservice;
	
	@Autowired
    private StringRedisTemplate redisTemplate;
	
	@Value("${groq.api.url}")
    private String GROQ_API_URL;

    @Value("${groq.api.key}")
    private String API_KEY;
	
	@PostMapping("/rank/score")
	public ResponseEntity<Integer> loadRank(@RequestBody Map<String, String> payload) {
	    String userId = payload.get("userId");
	    UserInfoDTO user = userservice.getUserById(userId);
	    
	    redisTemplate.opsForValue().set("rank:" + userId, String.valueOf(user.getUser_rank()));
	    
	    return ResponseEntity.ok(user.getUser_rank());
	}

	@PostMapping("/questionReviewList")
	public ResponseEntity<List<UserQuestionHistoryDTO>> questionReviewList(@RequestBody Map<String, String> userMap) {
		String userNick = userMap.get("userNick");
		List<UserQuestionHistoryDTO> list = playService.getQuestionReviewList(userNick);
//		log.info(list.size());
//		log.info(list);
		return ResponseEntity.ok(list);
	}

	@PostMapping("/userQuestionHistory")
	public ResponseEntity<List<UserQuestionHistoryDTO>> getUserQuestionHistory(@RequestBody Map<String, String> userMap) {
		String submittedAt = userMap.get("submittedAt");
		List<UserQuestionHistoryDTO> list = playService.getUserQuestionHistory(submittedAt);
		
		log.info(list.size());
		log.info(list);
		return ResponseEntity.ok(list);
	}
	
	
	@PostMapping("/usePoint")
	public void usePoint(@RequestBody Map<String, String> userMap) {
		String user_no = userMap.get("userNo");
		Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("item_price", 50);
        paramMap.put("user_no", user_no);
    	userservice.userPointMinus(paramMap);
	}
	
<<<<<<< Updated upstream
	@PostMapping(value = "/groq-explanation", produces = "application/json; charset=UTF-8")
	@ResponseBody
	public String getGroqExplanation(@RequestBody Map<String, Object> body) {
		try {
			String question = (String) body.get("question");
			List<String> choices = (List<String>) body.get("choices");
			int correctIndex = (int) body.get("correct");      // 1~4
			int userIndex = (int) body.get("userAnswer");      // 0~4 (0은 미선택)

			String correctText = choices.get(correctIndex - 1);
			String userText = (userIndex == 0) ? "선택하지 않음" : choices.get(userIndex - 1);

			String prompt = buildPrompt(question, choices, correctText, userText);
			return callGroq(prompt);
		} catch(Exception e) {
			e.printStackTrace();
			return "AI 해설 생성 실패";
		}
	}
	
	private String buildPrompt(String question, List<String> choices, String correct, String userAnswer) {
	    StringBuilder sb = new StringBuilder();

	    sb.append("다음은 객관식 퀴즈 문제입니다. 사용자가 정답이 아닌 선택지를 골랐습니다.\n");
	    sb.append("AI는 사용자의 오답과 정답을 비교하여, 정답이 왜 맞는지 간단하게 설명해야 합니다.\n\n");

	    sb.append("[출력 조건]\n");
	    sb.append("- 출력은 한국어로 작성해주세요.\n");
	    sb.append("- 선택지 번호를 사용하지 말고, 선택지 내용을 그대로 사용해주세요.\n");
	    sb.append("- 계산식, 수식 기호, 영어, 한자, 이모지, 느낌표는 사용하지 마세요.\n");
	    sb.append("- 정답과 오답을 비교하여, 왜 정답이 맞는지 설명해주세요.\n");
	    sb.append("- 해설은 2~3문장 이내로 간결하게 작성해주세요.\n");
	    sb.append("- 해설은 다음 형식을 따르세요:\n");
	    sb.append("  [오답 설명] [정답 설명] [핵심 비교 또는 요약 문장]\n");
	    sb.append("- 예시: 사용자가 선택한 \"10001001\"은 -9가 아닌 -119입니다. 정답인 \"11110111\"은 정확히 -9를 나타냅니다. 따라서 정답이 맞습니다.\n\n");

	    sb.append("[문제]\n").append(question).append("\n\n");

	    sb.append("[선택지]\n");
	    for (String choice : choices) {
	        sb.append("- ").append(choice).append("\n");
	    }

	    sb.append("\n[정답]\n").append(correct).append("\n");
	    sb.append("\n[해설]\n");

	    return sb.toString();
	}
	
	private String callGroq(String prompt) {
        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", API_KEY);

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", "llama3-8b-8192");
        payload.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<Map> response = rest.postForEntity(GROQ_API_URL, entity, Map.class);

        List<Map> choices = (List<Map>) response.getBody().get("choices");
        Map message = (Map) choices.get(0).get("message");
        return (String) message.get("content");
    }
=======
>>>>>>> Stashed changes
}
