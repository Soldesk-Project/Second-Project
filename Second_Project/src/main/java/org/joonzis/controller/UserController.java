package org.joonzis.controller;

import java.util.List;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.service.UserService;
import org.joonzis.websocket.ServerUserWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@RestController
@Log4j
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {
	
	@Autowired
    private UserService service;
	
	 @Autowired
    private ServerUserWebSocketHandler webSocketHandler;

	// 유저 랭킹
	@GetMapping(value = "/ranking", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<UserInfoDecoDTO> getUserRankingList() {
		log.info("🔥 getUserRankingList() 호출됨");
        return service.getUserRankingList();
    }
	
	// 아이템 겟 테스트
	@GetMapping(value = "/item", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ItemVO> getItemList() {
		log.info(" getItemList() 호출됨");
        return service.getItemList();
    }
	
	// 아이템 업데이트 테스트
	@PostMapping(value = "/item/select", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> updateItem(@RequestBody UserDecoUpdateDTO UserDecoUpdateDTO) {
		boolean success = service.updateItem(UserDecoUpdateDTO);
	    if (success) {
	    	try {
	    		log.info("DB업데이트 완료");
                webSocketHandler.notifyUserStyleUpdate(String.valueOf(UserDecoUpdateDTO.getUser_no()));
            } catch (Exception e) {
                e.printStackTrace();
            }
	        return ResponseEntity.ok("업데이트 성공");
	    } else {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
}
