package org.joonzis.controller;

import java.util.List;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.AchievementVO;
import org.joonzis.domain.UserAchievementDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.service.AchievementService;
import org.joonzis.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@RestController
@Log4j
@CrossOrigin(origins = "*")
public class AchievementController {
	
	@Autowired
    private AchievementService service;
	
	@Autowired
    private UserService userService;

	// 전체 업적 목록
	@GetMapping(value = "/achievements", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<AchievementDTO> getAchievementList(@RequestParam("user_no") int user_no) {
        return service.getAchievementList(user_no);
    }
	
	// 유저업적 저장 및 리워드 적용
	@PostMapping(value = "/achievement/add", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> addUserAchievement(@RequestBody UserAchievementDTO dto) {
		int addSuccess = service.addUserAchievement(dto);
	    if (addSuccess != 0) {
	    	int rewardSuccess = userService.updateUserPoint(dto);
	    	if (rewardSuccess != 0) {
	            return ResponseEntity.ok("업데이트 성공");
	        } else {
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("포인트 업데이트 실패");
	        }
	    } else {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
}
