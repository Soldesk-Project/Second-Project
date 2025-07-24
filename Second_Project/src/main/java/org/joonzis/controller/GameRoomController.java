package org.joonzis.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;
import org.joonzis.service.PlayService;
import org.joonzis.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
	
}
