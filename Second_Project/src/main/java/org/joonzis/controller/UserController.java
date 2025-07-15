package org.joonzis.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.domain.UserRewardVO;
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
import org.springframework.web.bind.annotation.RequestParam;
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
		//log.info("🔥 getUserRankingList() 호출됨");
        return service.getUserRankingList();
    }
	
	// 아이템 겟 테스트
	@GetMapping(value = "/item", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ItemVO> getItemList() {
		//log.info(" getItemList() 호출됨");
        return service.getItemList();
    }
	
	// 아이템 업데이트 테스트
	@PostMapping(value = "/item/select", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> updateItem(@RequestBody UserDecoUpdateDTO UserDecoUpdateDTO) {
		boolean success = service.updateItem(UserDecoUpdateDTO);
	    if (success) {
	    	try {
	    		//log.info("DB업데이트 완료");
                webSocketHandler.notifyUserStyleUpdate(String.valueOf(UserDecoUpdateDTO.getUser_no()));
            } catch (Exception e) {
                e.printStackTrace();
            }
	        return ResponseEntity.ok("업데이트 성공");
	    } else {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
	
	// 인벤토리 카테고리에 맞는 아이템 가져오기
	@GetMapping("/inventory/category")
	public List<ItemVO> getInventoryCategory(@RequestParam("category") String category, @RequestParam("user_no") int user_no) {

        Map<String, String> categoryMap = Map.of(
            "테두리", "boundary",
            "칭호", "title",
            "글자색", "fontColor",
            "배경", "background",
            "말풍선", "balloon",
            "랜덤박스", "randomBox"
        );

        String mappedCategory = categoryMap.getOrDefault(category, "unknown");
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("category", mappedCategory);
        paramMap.put("user_no", user_no);
	    return service.getInventoryCategory(paramMap);
	}
	
	// 유저가 가지고있는 아이템목록
	@GetMapping("/getItems")
	public List<ItemVO> getInventory(@RequestParam("user_no") int user_no) {
	    return service.getInventory(user_no);
	}
	
	@GetMapping("/rewardStatus")
	public UserRewardVO getRewardStatus(@RequestParam("user_no") int user_no) {
	    return service.getRewardStatus(user_no);
	}
	
	@PostMapping(value = "/reward", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> addReward(@RequestBody UserDecoUpdateDTO UserDecoUpdateDTO) {
		boolean success = service.addReward(UserDecoUpdateDTO);
	    if (success) {
	        return ResponseEntity.ok("업데이트 성공");
	    } else {	
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
	
	@PostMapping(value = "/rewardUpdate", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> rewardUpdate(@RequestBody UserRewardVO UserRewardVO) {
		boolean success = service.rewardUpdate(UserRewardVO);
	    if (success) {
	        return ResponseEntity.ok("업데이트 성공");
	    } else {	
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
}
