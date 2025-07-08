package org.joonzis.controller;

import java.util.List;
import java.util.Map;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.service.GameRoomService;
import org.joonzis.service.MemberService;
import org.joonzis.service.match.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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
	private GameRoomService gameRoomService;
	
	@Autowired
	private MemberService memberService;
	
	@Autowired
    private StringRedisTemplate redisTemplate;
	
	@Autowired
	private MatchService matchService;
	
	// 게임방 생성
	@PostMapping("/createRoom")
	public String createRoom(@RequestBody GameRoomDTO room) {
		log.info(room);
		gameRoomService.createGameRoom(room);
		return "방 생성 완료";
	}
	
	@GetMapping("/showRoom")	
	public List<GameRoomDTO> showRoom() {
	    return gameRoomService.showRoom();
	}
	
	@PostMapping("/rank/score")
	public ResponseEntity<Integer> loadRank(@RequestBody Map<String, String> payload) {
	    String userId = payload.get("userId");
	    UserInfoDTO user = memberService.getUserById(userId);
	    
	    redisTemplate.opsForValue().set("rank:" + userId, String.valueOf(user.getUser_rank()));
	    
	    return ResponseEntity.ok(user.getUser_rank());
	}
	
	/*
	 * @GetMapping(value = "/match/test", produces =
	 * "application/json; charset=UTF-8") public ResponseEntity<?> testMatch() {
	 * List<String> matched = matchService.peekAndRemove(4); if (!matched.isEmpty())
	 * { String groupId = UUID.randomUUID().toString();
	 * matchService.startPendingGroup(matched, groupId); return
	 * ResponseEntity.ok(matched); } return ResponseEntity.ok("매칭 불가"); }
	 * 
	 * @PostMapping("/test/enqueue") public ResponseEntity<?>
	 * testEnqueue(@RequestBody Map<String, String> body) { String userId =
	 * body.get("userId"); int score = Integer.parseInt(body.get("score"));
	 * 
	 * redisTemplate.opsForValue().set("rank:" + userId, String.valueOf(score));
	 * matchService.enqueue(userId);
	 * 
	 * return ResponseEntity.ok("등록 완료: " + userId + " (" + score + ")"); }
	 */
}
