package org.joonzis.controller;

import java.util.List;

import org.joonzis.domain.AchievementVO;
import org.joonzis.service.AchievementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@RestController
@Log4j
@CrossOrigin(origins = "*")
public class AchievementController {
	
	@Autowired
    private AchievementService service;

	// 업적 리스트
	@GetMapping(value = "/achievements", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<AchievementVO> getAchievementList() {
		log.info("getAchievementList() 호출됨");
        return service.getAchievementList();
    }
	
	// 아이템 업데이트 테스트
//	@PostMapping(value = "/item/select", produces = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<?> updateItem(@RequestBody UserDecoUpdateDTO UserDecoUpdateDTO) {
//		boolean success = service.updateItem(UserDecoUpdateDTO);
//	    if (success) {
//	    	try {
//	    		log.info("DB업데이트 완료");
//                webSocketHandler.notifyUserStyleUpdate(String.valueOf(UserDecoUpdateDTO.getUser_no()));
//            } catch (Exception e) {
//                e.printStackTrace();
//            }
//	        return ResponseEntity.ok("업데이트 성공");
//	    } else {
//	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
//	    }
//	}
}
