package org.joonzis.controller;

import java.util.List;
import java.util.Map;

import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;
import org.joonzis.service.MemberService;
import org.joonzis.service.PlayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameRoomController {
	
	@Autowired
	private MemberService memberService;
	
	@Autowired
	private PlayService playService;
	
	@Autowired
    private StringRedisTemplate redisTemplate;
	
	@PostMapping("/rank/score")
	public ResponseEntity<Integer> loadRank(@RequestBody Map<String, String> payload) {
	    String userId = payload.get("userId");
	    UserInfoDTO user = memberService.getUserById(userId);
	    
	    redisTemplate.opsForValue().set("rank:" + userId, String.valueOf(user.getUser_rank()));
	    
	    return ResponseEntity.ok(user.getUser_rank());
	}

	@PostMapping("/questionReviewList")
	public ResponseEntity<UserQuestionHistoryDTO> questionReviewList(@RequestParam String userNick) {
		
		List<UserQuestionHistoryDTO> list = playService.getQuestionReviewList(userNick);
		
		return null;
//		return ResponseEntity.ok();
	}

}
