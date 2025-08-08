package org.joonzis.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.ProfileImageDTO;
import org.joonzis.domain.UserAccuracyDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserRewardVO;
import org.joonzis.service.UserService;
import org.joonzis.websocket.ServerUserWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

	// Top 10 유저 랭킹 목록
	@GetMapping(value = "/ranking", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<UserInfoDTO> getUserRankingList() {
        return service.getUserRankingList();
    }
	
	// 모든 아이템 목록
	@GetMapping(value = "/item", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ItemVO> getItemList() {
        return service.getItemList();
    }
	
	// 유저 장식 업데이트
	@PostMapping(value = "/item/select", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> updateItem(@RequestBody UserDecoUpdateDTO UserDecoUpdateDTO) {
		boolean success = service.updateItem(UserDecoUpdateDTO);
	    if (success) {
	    	try {
                webSocketHandler.notifyUserStyleUpdate(String.valueOf(UserDecoUpdateDTO.getUser_no()));
            } catch (Exception e) {
                e.printStackTrace();
            }
	        return ResponseEntity.ok("업데이트 성공");
	    } else {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
	
	// 인벤토리 아이템 리스트
	@GetMapping("/inventory/category")
	public List<ItemVO> getInventoryCategory(@RequestParam("category") String category, @RequestParam("user_no") int user_no) {
		
        Map<String, String> categoryMap = Map.of(
            "테두리", "boundary",
            "칭호", "title",
            "글자색", "fontColor",
            "명함", "background",
            "말풍선", "balloon",
            "유니크", "unique"
        );

        String mappedCategory = categoryMap.getOrDefault(category, "unknown");
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("category", mappedCategory);
        paramMap.put("user_no", user_no);
        System.out.println(service.getInventoryCategory(paramMap));
        System.out.println(category);
        System.out.println(user_no);
        System.out.println(mappedCategory);
	    return service.getInventoryCategory(paramMap);
	}
	
	// 보유 아이템 목록
	@GetMapping("/getItems")
	public List<ItemVO> getInventory(@RequestParam("user_no") int user_no) {
	    return service.getInventory(user_no);
	}
	
	// 리워드 상태
	@GetMapping("/rewardStatus")
	public UserRewardVO getRewardStatus(@RequestParam("user_no") int user_no) {
	    return service.getRewardStatus(user_no);
	}
	
	// 리워드 보상 획득
	@PostMapping(value = "/reward", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> addReward(@RequestBody UserDecoUpdateDTO UserDecoUpdateDTO) {
		boolean success = service.addReward(UserDecoUpdateDTO);
	    if (success) {
	        return ResponseEntity.ok("업데이트 성공");
	    } else {	
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
	
	// 리워드 상태 업데이트
	@PostMapping(value = "/rewardUpdate", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> rewardUpdate(@RequestBody UserRewardVO UserRewardVO) {
		boolean success = service.rewardUpdate(UserRewardVO);
	    if (success) {
	        return ResponseEntity.ok("업데이트 성공");
	    } else {	
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업데이트 실패");
	    }
	}
	
	// 유저 닉네임 변경
	@PatchMapping("/{user_no}/nickname")
    public ResponseEntity<?> updateNickname(@PathVariable("user_no") Long user_no,
                                            @RequestBody Map<String, String> body) {
        String user_nick = body.get("user_nick");
        String user_id = body.get("user_id");
        System.out.println(user_nick);
        System.out.println(user_id);
        System.out.println(user_no);
        
        if (user_nick == null || user_nick.trim().isEmpty()) {
        	System.out.println("1");
            return ResponseEntity.badRequest().body("닉네임이 비어 있습니다.");
        }
        if ((int) service.getUserPoint(user_id) < 5000) {
        	System.out.println("2");
        	return ResponseEntity.badRequest().body("포인트 부족");
        }
        try {
        	System.out.println("3");
            service.updateNickname(user_no, user_nick);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("닉네임 변경 실패");
        }
	}
	
//	 /** 사용자 통계 조회 */
//    @GetMapping("/{userNo}/stats")
//    public ResponseEntity<UserStatsDTO> getUserStats(@PathVariable int userNo) {
//        UserStatsDTO stats = service.getUserStats(userNo);
//        return ResponseEntity.ok(stats);
//    }
	
	/** 장식 정보까지 포함한 DTO를 내려주는 프로필 조회 */
    @GetMapping(value = "/{userNo}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserInfoDTO> getUser(@PathVariable int userNo) {
        // service.getUserInfoByUserNo()가 USER_DECO join 쿼리를 수행합니다
        UserInfoDTO dto = service.getUserInfoByUserNo(userNo);
        return ResponseEntity.ok(dto);
    }

    /** 프로필 이미지 업데이트는 그대로 유지 */
    @PatchMapping("/{userNo}/profile-image")
    public ResponseEntity<Void> updateProfileImage(
            @PathVariable int userNo,
            @RequestBody ProfileImageDTO req
    ) {
        service.changeProfileImage(userNo, req.getImageUrl());
        return ResponseEntity.ok().build();
    }
    
    /** 정답률 통계 */
    @GetMapping(value = "/accuracy/{user_nick}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<UserAccuracyDTO>> getUserAccuracyList(@PathVariable("user_nick") String user_nick) {
        try {
            List<UserAccuracyDTO> list = service.getUserAccuracyList(user_nick);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            // 내부 예외 로깅
            log.error("정답률 조회 중 오류", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }
    
    @PatchMapping(value = "/{user_no}/clearStyle")
    public void clearUserStyle(@PathVariable("user_no") int user_no) {
    	service.clearUserStyle(user_no);
    }
}
