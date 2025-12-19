package org.joonzis.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.FaqVO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.NoticeVO;
import org.joonzis.domain.QuestRequestVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.service.AdminService;
import org.joonzis.service.FileUploadService;
import org.joonzis.service.UserService;
import org.joonzis.websocket.UserBanWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminPageController {

    @Autowired
    private AdminService adminService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private FileUploadService fileUploadService;
    
    @Autowired
    private UserBanWebSocketHandler userBanWebSocketHandler;
    
    // 토큰 재활용, 생성
    private volatile String cachedImdsToken;
    private volatile long imdsTokenExpireAt; 
    
    
    // 문제 등록
    @PostMapping("/registerQuestion")
    public ResponseEntity<?> registerQuestion(@RequestBody QuestionDTO questionDTO) {
        try {
            // 이미지 데이터 처리
            if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
                questionDTO.setImage_data(decodedBytes);
                questionDTO.setImage_data_base64(null);
            } else {
                questionDTO.setImage_data(null);
            }
            
            adminService.registerQuestion(questionDTO); 
            
            return new ResponseEntity<>("문제 등록 성공!", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return new ResponseEntity<>("잘못된 요청 데이터입니다: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 등록 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 문제 검색
    @GetMapping(value = "/searchQuestions", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> searchQuestions(
    		@RequestParam("subject") String subjectCode,
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        try {
            Map<String, Object> result = adminService.searchQuestions(subjectCode, query, page, limit);

            return new ResponseEntity<>(result, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "문제 검색 중 서버 내부 오류 발생.");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 문제 수정
    @PostMapping("/editQuestion")
    public ResponseEntity<?> editQuestion(@RequestBody QuestionDTO questionDTO) {
        System.out.println("데이터 확인 : " + questionDTO);
        try {
            // 디코딩은 ServiceImpl에서 일괄 처리
            adminService.updateQuestion(questionDTO);
            return new ResponseEntity<>("문제 수정 성공!", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return new ResponseEntity<>("잘못된 요청 데이터입니다: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 수정 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
//    @PostMapping("/editQuestion")
//    public ResponseEntity<?> editQuestion(@RequestBody QuestionDTO questionDTO) {
//    	System.out.println("데이터 확인 : " + questionDTO);
//        try {
//            if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
//            	System.out.println("Base64 길이: " + questionDTO.getImage_data_base64().length());
//                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
//                System.out.println("디코딩된 바이트 길이: " + decodedBytes.length);
//                System.out.println("수정 전 image_data is null? : " + (questionDTO.getImage_data() == null));
//                questionDTO.setImage_data(decodedBytes);
//                System.out.println("수정 후 image_data is null? : " + (questionDTO.getImage_data() == null));
//                questionDTO.setImage_data_base64(null);
//            } else {
//                questionDTO.setImage_data(null);
//            }
//
//            adminService.updateQuestion(questionDTO);
//            return new ResponseEntity<>("문제 수정 성공!", HttpStatus.OK);
//        } catch (IllegalArgumentException e) {
//            e.printStackTrace();
//            return new ResponseEntity<>("잘못된 요청 데이터입니다: " + e.getMessage(), HttpStatus.BAD_REQUEST);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return new ResponseEntity<>("문제 수정 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//        }
//    }
    
    // 문제 삭제
    @DeleteMapping("/deleteQuestions")
    public ResponseEntity<?> deleteQuestions(@RequestParam("subject") String subjectCode, @RequestParam("ids") String idsParam) {
        try {
            List<Integer> questionIds = Arrays.stream(idsParam.split(","))
                                              .map(Integer::parseInt)
                                              .collect(Collectors.toList());

            adminService.deleteQuestions(questionIds, subjectCode);

            return new ResponseEntity<>("선택된 문제가 성공적으로 삭제되었습니다.", HttpStatus.OK);
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return new ResponseEntity<>("잘못된 문제 ID 형식입니다. 숫자로 구성된 쉼표 구분 문자열이어야 합니다.", HttpStatus.BAD_REQUEST);
        } catch(IllegalArgumentException e) {
            e.printStackTrace();
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 삭제 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
 // --- 문제 등록 요청 관리 API ---

    // 1. 문제 등록 요청 목록 조회 (페이징, 검색, 필터링 포함)
    @GetMapping(value = "/questRequests", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> getQuestRequests(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit, // 프론트엔드에서 'limit'으로 보냄
            @RequestParam(value = "searchTerm", required = false, defaultValue = "") String searchTerm,
            @RequestParam(value = "filterStatus", required = false, defaultValue = "") String filterStatus) {
        try {
            // URL 디코딩 (선택 사항: 스프링이 자동으로 디코딩해주지만, 명시적으로 처리할 경우)
            String decodedSearchTerm = URLDecoder.decode(searchTerm, "UTF-8");
            String decodedFilterStatus = URLDecoder.decode(filterStatus, "UTF-8");

            Map<String, Object> result = adminService.getQuestRequests(page, limit, decodedSearchTerm, decodedFilterStatus);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("검색어 또는 상태 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 등록 요청 목록 로드 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 2. 단일 문제 등록 요청 상세 조회
    @GetMapping(value = "/questRequests/{id}", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> getQuestRequestById(@PathVariable("id") int id) {
        try {
            QuestRequestVO questRequest = adminService.getQuestRequestById(id);
            System.out.println("문제 등록 요청 데이터 -> " + questRequest);
            if (questRequest != null) {
                return new ResponseEntity<>(questRequest, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("해당 ID의 문제 등록 요청을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 등록 요청 상세 정보 로드 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // 테스트
    @GetMapping(value = "/questRequests/{id}/info", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> getQuestRequestInfoById(@PathVariable("id") int id) {
        try {
            QuestRequestVO questRequest = adminService.getQuestRequestInfoById(id); // 이미지 제외
            if (questRequest != null) {
                return new ResponseEntity<>(questRequest, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("해당 ID의 문제 등록 요청을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 등록 요청 상세 정보 로드 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping(value = "/questRequests/{id}/image", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> getQuestRequestImageById(@PathVariable("id") int id) {
        try {
            byte[] imageData = adminService.getQuestRequestImageById(id);
            if (imageData != null && imageData.length > 0) {
                String base64Image = Base64.getEncoder().encodeToString(imageData);
                Map<String, String> result = new HashMap<>();
                result.put("image_data_base64", base64Image);
                return new ResponseEntity<>(result, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("이미지가 존재하지 않습니다.", HttpStatus.NO_CONTENT);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("이미지 로드 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 3. 문제 등록 요청 수정 (상태 변경 및 내용 수정)
    @PutMapping(value = "/questRequests/{id}", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> updateQuestRequest(@PathVariable("id") int id, @RequestBody QuestRequestVO questRequestVO) {
        try {
            // PathVariable의 ID와 RequestBody의 ID가 다를 경우를 대비한 검증 (선택 사항)
            if (id != questRequestVO.getId()) {
                return new ResponseEntity<>("요청 ID와 본문 ID가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
            }

            adminService.updateQuestRequest(questRequestVO);
            return new ResponseEntity<>("문제 등록 요청이 성공적으로 업데이트되었습니다.", HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 등록 요청 업데이트 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // 4. 문제 실제 등록
    @PostMapping("/questions")
    public ResponseEntity<?> registerQuestion(@RequestBody QuestRequestVO vo) {
        try {
            // base64 이미지 디코딩
            if (vo.getImage_data_base64() != null && !vo.getImage_data_base64().isEmpty()) {
                byte[] imageBytes = Base64.getDecoder().decode(vo.getImage_data_base64());
                vo.setImage_data(imageBytes); // DB 컬럼용 필드
            }

            // 문제 등록
            adminService.insertQuestion2(vo);
            
            // 유저 이메일 조회
            UserInfoDTO user = userService.getUserById(vo.getUser_id());
            if (user != null && user.getUser_email() != null) {
                userService.sendQuestRequestStatusMail(user.getUser_email(), "등록하신 문제가 정상적으로 접수되었습니다.");
            }

            return ResponseEntity.ok().body("등록 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류 발생");
        }
    }
    
    @PutMapping("/questRequests/{id}/reject")
    public ResponseEntity<?> rejectQuestRequest(@PathVariable int id, @RequestBody QuestRequestVO vo) {
        try {
            adminService.updateQuestRequest(vo); // 상태 업데이트 (반려)
            
            // 유저 이메일 발송
            UserInfoDTO user = userService.getUserById(vo.getUser_id());
            if (user != null && user.getUser_email() != null) {
                userService.sendQuestRequestStatusMail(user.getUser_email(), "등록하신 문제가 반려되었습니다. 다시 확인해주세요.");
            }

            return ResponseEntity.ok("반려 처리 완료");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류 발생");
        }
    }
    
    // 유저 조회 (조건 없이)
    @GetMapping("/users/all")
    public ResponseEntity<List<UsersVO>> getAllUsers() {
        List<UsersVO> users = adminService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }
    
    // 유저 검색 (조건 有) - ischatbanned, banned_timestamp 포함하도록 수정 필요
    @GetMapping(value = "/users/search", produces = "application/json; charset=UTF-8")
    public ResponseEntity<Map<String, Object>> searchUsers(@RequestParam(name = "searchType") String searchType, 
    												 @RequestParam(name = "searchValue", required = false, defaultValue = "") String searchValue,
    												 @RequestParam(defaultValue = "1") int page,
    												 @RequestParam(defaultValue = "8") int size) {
    	int offset = (page - 1) * size;
        List<UsersVO> users = adminService.searchUsers(searchType, searchValue, offset, size);
        int totalCount = adminService.getAllUsers().size(); // 전체 개수 조회

	    Map<String, Object> response = new HashMap<>();
	    response.put("items", users);
	    response.put("totalCount", totalCount);

	    return ResponseEntity.ok(response);
    }

    // 채팅 금지 적용 API
    @PostMapping(value = "/users/ban-chat", produces = "application/json; charset=UTF-8")
    public ResponseEntity<Map<String, String>> banChatUsers(@RequestBody Map<String, List<Integer>> requestBody) {
        List<Integer> userNos = requestBody.get("userNos");
        Map<String, String> response = new HashMap<>();

        if (userNos == null || userNos.isEmpty()) {
            response.put("message", "채팅 금지를 적용할 사용자 번호가 제공되지 않았습니다.");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        try {
            int updatedCount = adminService.banChatusers(userNos);
            response.put("message", updatedCount + "명의 사용자에게 채팅 금지가 성공적으로 적용되었습니다.");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("message", "채팅 금지 적용 중 오류가 발생했습니다: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 접속 금지 적용 API
    @PostMapping(value = "/users/ban-login", produces = "application/json; charset=UTF-8")
    public ResponseEntity<Map<String, String>> banLoginUsers(@RequestBody Map<String, List<Integer>> requestBody) {
    	List<Integer> userNos = requestBody.get("userNos");
    	Map<String, String> response = new HashMap<>();
    	
    	if (userNos == null || userNos.isEmpty()) {
    		response.put("message", "접속 금지를 적용할 사용자 번호가 제공되지 않았습니다.");
    		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    	}
    	
    	try {
    		int updatedCount = adminService.banLoginUsers(userNos);
    		for (Integer userNo : userNos) {
                userBanWebSocketHandler.handleUserBan(userNo); // 메시지 전송 메서드 호출
            }
    		response.put("message", updatedCount + "명의 사용자에게 접속 금지가 성공적으로 적용되었습니다.");
    		return new ResponseEntity<>(response, HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		response.put("message", "접속 금지 적용 중 오류가 발생했습니다: " + e.getMessage());
    		return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }
    
    // 업적 등록
    @PostMapping("/registerAchievement")
    public ResponseEntity<?> registerAchievement(@RequestBody AchievementDTO achievementDTO) {
        // 필수 입력 필드 검증
        if (achievementDTO.getAch_title() == null || achievementDTO.getAch_title().trim().isEmpty()) {
            return new ResponseEntity<>("업적 제목을 입력해주세요.", HttpStatus.BAD_REQUEST);
        }
        if (achievementDTO.getAch_content() == 0) {
            return new ResponseEntity<>("업적 내용(숫자)을 입력해주세요.", HttpStatus.BAD_REQUEST);
        }
        if (achievementDTO.getAch_reward() == 0) {
        	return new ResponseEntity<>("업적 보상(숫자)을 입력해주세요.", HttpStatus.BAD_REQUEST);
        }
        
        try {
            adminService.registerAchievement(achievementDTO);
            return new ResponseEntity<>("업적 등록 성공!", HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("업적 등록 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 업적 검색
    @GetMapping(value = "/searchAchievements", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> searchAchievements(
            @RequestParam("type") String type,
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        try {
            // type 값을 URL 디코딩 (프론트에서 encodeURIComponent로 보냈을 수 있으므로)
            String decodedType = URLDecoder.decode(type, "UTF-8");
            String decodedQuery = URLDecoder.decode(query, "UTF-8");

            // 서비스 계층으로 'decodedType'을 넘겨서 ach_type 컬럼을 필터링
            Map<String, Object> result = adminService.searchAchievement(decodedType, decodedQuery, page, limit);
            
            if (result == null || !result.containsKey("achievements") || !result.containsKey("totalPages")) {
                return new ResponseEntity<>("검색 결과 형식이 올바르지 않습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            
            return new ResponseEntity<>(result, HttpStatus.OK);

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("타입 또는 검색어 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "업적 검색 중 서버 내부 오류 발생.");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 업적 삭제
    @DeleteMapping("/deleteAchievements")
    public ResponseEntity<?> deleteAchievement(@RequestParam("type") String type, @RequestParam("title") String title) {
        try {
            String decodedType = URLDecoder.decode(type, "UTF-8");
            String decodedTitle = URLDecoder.decode(title, "UTF-8");
            boolean success = adminService.deleteAchievementByTitle(decodedType, decodedTitle);

            if (success) {
                return new ResponseEntity<>("선택된 업적이 성공적으로 삭제되었습니다.", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("업적 삭제에 실패했습니다. 업적이 존재하지 않거나 오류가 발생했습니다.", HttpStatus.BAD_REQUEST);
            }
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("타입 또는 제목 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "업적 삭제 중 서버 내부 오류가 발생했습니다.");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 업적 수정
    @PutMapping("/updateAchievement")
    public ResponseEntity<?> updateAchievement(@RequestBody AchievementDTO dto) {
        try {
            boolean updated = adminService.updateAchievement(dto);
            if (updated) {
                return new ResponseEntity<>("업적이 성공적으로 수정되었습니다.", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("업적 수정 실패. 존재하지 않거나 잘못된 입력.", HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("서버 내부 오류 발생", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 아이템 등록
    @PostMapping(value = "/registerItem", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> registerItem(@RequestParam("type") String type,
    		@RequestParam("item_name") String itemName,
            @RequestParam("item_price") int itemPrice,
            @RequestPart(value = "item_image") MultipartFile itemImage
    ) {
        // 1. 필수 입력 필드 검증 (아이템 타입, 이름, 가격, 이미지)
        if (type == null || type.trim().isEmpty()) {
            return new ResponseEntity<>("아이템 타입이 누락되었습니다.", HttpStatus.BAD_REQUEST);
        }
        if (itemName == null || itemName.trim().isEmpty()) {
            return new ResponseEntity<>("아이템 이름을 입력해주세요.", HttpStatus.BAD_REQUEST);
        }
        
        // 아이템 가격 검증: 0보다 작은지 체크
        if (itemPrice < 0) { 
            return new ResponseEntity<>("아이템 가격은 0 이상이어야 합니다.", HttpStatus.BAD_REQUEST);
        }
        
        // **이미지 삽입 검증 (필수)**
        if (itemImage == null || itemImage.isEmpty()) {
            return new ResponseEntity<>("아이템 이미지를 업로드해주세요.", HttpStatus.BAD_REQUEST);
        }

        try {
        	
//        	String savedFileName = fileUploadService.saveFile(itemImage);
  
        	
        	
		    // MultipartFile 직접 처리 (원본 파일명 사용)
		    String uploadDir = "/home/ubuntu/coteplay/Second-Project/second-project-react/public/images";
		    String originalFilename = itemImage.getOriginalFilename();
		  
		    // 파일명 안전성 검증 (공백 제거, 특수문자 제한)
		    String safeFileName = originalFilename.trim().replaceAll("[^a-zA-Z0-9.-]", "_");
		    Path filePath = Paths.get(uploadDir + safeFileName);
		  
//		    // 디렉토리 생성 (없을 경우)
//		    Files.createDirectories(filePath.getParent());
		  
		    // 파일 저장
		    itemImage.transferTo(filePath.toFile());


            ItemVO itemVO = new ItemVO();
            itemVO.setItem_type(type);
            itemVO.setItem_name(itemName);
            itemVO.setItem_price(itemPrice);
            itemVO.setImageFileName(safeFileName);

            // 서비스 계층으로 데이터 전달
            adminService.registerItem(itemVO); 
            
            return new ResponseEntity<>("아이템 등록 성공!", HttpStatus.OK);
        } catch (IllegalArgumentException e) { 
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) { 
            e.printStackTrace();
            return new ResponseEntity<>("아이템 등록 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 아이템 검색
    @GetMapping(value = "/searchItems", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> searchItems(
            @RequestParam("type") String typeParam,
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        try {
            String decodedType = URLDecoder.decode(typeParam, "UTF-8");
            String decodedQuery = URLDecoder.decode(query, "UTF-8");

            Map<String, Object> result = adminService.searchItems(decodedType, decodedQuery, page, limit);
            return new ResponseEntity<>(result, HttpStatus.OK);

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("타입 또는 검색어 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "아이템 검색 중 서버 내부 오류 발생.");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 아이템 수정
    @PostMapping("/editItem")
    public ResponseEntity<?> editItem(@RequestParam("item_no") int itemNo,
            @RequestParam("type") String type,
            @RequestParam("item_name") String itemName,
            @RequestParam("item_price") int itemPrice,
            @RequestPart(value = "item_image", required = false) MultipartFile itemImage,
            @RequestParam(value = "original_image_file_name", required = false) String originalImageFileName) {
        try {
        	System.out.println("컨트롤러 : " + itemImage);
        	System.out.println("컨트롤러 : " + originalImageFileName);
            adminService.updateItem(itemNo, type, itemName, itemPrice, itemImage, originalImageFileName);
            return new ResponseEntity<>("아이템 수정 성공!", HttpStatus.OK);
        } catch (NumberFormatException e) {
            return new ResponseEntity<>("가격 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "아이템 수정 중 오류가 발생했습니다: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    //아이템 삭제
    @DeleteMapping("/deleteItems")
    @ResponseBody
    public ResponseEntity<?> deleteItems(@RequestParam("type") String itemType, @RequestParam("itemNo") int itemNo) {
        try {
            // 서비스 계층으로 삭제 요청 전달 시, type 값을 itemType으로 사용
            adminService.deleteItems(itemType, itemNo); // **여기에 itemType 전달**

            return new ResponseEntity<>("아이템이 성공적으로 삭제되었습니다.", HttpStatus.OK);
        } catch (NumberFormatException e) {
            return new ResponseEntity<>("잘못된 아이템 번호 형식입니다.", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("아이템 삭제 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 공지사항 등록
    @PostMapping(value = "/registerNotice", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> registerNotice(@RequestBody NoticeVO notice) {
        try {
            adminService.registerNotice(notice.getSubject(), notice.getMessage());
            return new ResponseEntity<>("공지사항 등록 성공!", HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "공지사항 등록 중 오류가 발생했습니다: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // 공지사항 수정
    @PostMapping(value = "/editNotice", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> editNotice(@RequestBody NoticeVO notice) {
    	try {
    		adminService.editNotice(notice.getId(), notice.getSubject(), notice.getMessage());
    		return new ResponseEntity<>("공지사항 수정 성공!", HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		Map<String, String> errorResponse = new HashMap<>();
    		errorResponse.put("message", "공지사항 수정 중 오류가 발생했습니다: " + e.getMessage());
    		return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }
    // 공지사항 삭제
    @PostMapping(value = "/deleteNotice", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> deleteNotice(@RequestBody NoticeVO notice) {
    	try {
    		adminService.deleteNotice(notice.getId());
    		return new ResponseEntity<>("공지사항 삭제 성공!", HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		Map<String, String> errorResponse = new HashMap<>();
    		errorResponse.put("message", "공지사항 삭제 중 오류가 발생했습니다: " + e.getMessage());
    		return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }

    
    // FAQ 등록
    @PostMapping(value = "/registerFaq", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> registerFaq(@RequestBody FaqVO faq) {
    	try {
    		adminService.registerFaq(faq.getQuestion(), faq.getAnswer(), faq.getCategory());
    		return new ResponseEntity<>("FAQ 등록 성공!", HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		Map<String, String> errorResponse = new HashMap<>();
    		errorResponse.put("message", "FAQ 등록 중 오류가 발생했습니다: " + e.getMessage());
    		return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }
    // FAQ 수정
    @PostMapping(value = "/editFaq", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> editFaq(@RequestBody FaqVO faq) {
    	try {
    		adminService.editFaq(faq.getId(), faq.getQuestion(), faq.getAnswer(), faq.getCategory());
    		return new ResponseEntity<>("FAQ 수정 성공!", HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		Map<String, String> errorResponse = new HashMap<>();
    		errorResponse.put("message", "FAQ 수정 중 오류가 발생했습니다: " + e.getMessage());
    		return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }
    // FAQ 삭제
    @PostMapping(value = "/deleteFaq", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> deleteFaq(@RequestBody FaqVO faq) {
    	try {
    		adminService.deleteFaq(faq.getId());
    		return new ResponseEntity<>("FAQ 삭제 성공!", HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		Map<String, String> errorResponse = new HashMap<>();
    		errorResponse.put("message", "FAQ 삭제 중 오류가 발생했습니다: " + e.getMessage());
    		return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }
    
    
    
    //ec2 server data token
    private String getImdsToken(RestTemplate rest) {
        long now = System.currentTimeMillis();
        // 아직 유효한 토큰이면 재사용
        if (cachedImdsToken != null && now < imdsTokenExpireAt) {
            return cachedImdsToken;
        }

        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.set("X-aws-ec2-metadata-token-ttl-seconds", "21600"); // 6시간
        HttpEntity<String> tokenEntity = new HttpEntity<>(tokenHeaders);

        String token = rest.exchange(
            "http://169.254.169.254/latest/api/token",
            HttpMethod.PUT, tokenEntity, String.class
        ).getBody();

        // 토큰 + 만료 시간 캐싱 (조금 여유 두고 싶으면 -1~2분 빼도 됨)
        cachedImdsToken = token;
        imdsTokenExpireAt = now + 21_600_000L; // 21600초 * 1000
        return token;
    }
    
    
    
    //ec2 server data
    @ResponseBody
    @GetMapping(value = "/ec2-info/meta-data", produces = "application/json; charset=UTF-8")
    public Map<String, String> ec2MetaInfo(HttpServletRequest request) {
        Map<String, String> info = new HashMap<>();
        
        try {
            // 타임아웃 설정
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(10000);
            factory.setReadTimeout(5000);
            RestTemplate rest = new RestTemplate(factory);
            
            String token = getImdsToken(rest);
            
            // 2. 메타데이터들
            HttpHeaders dataHeaders = new HttpHeaders();
            dataHeaders.set("X-aws-ec2-metadata-token", token);
            HttpEntity<String> dataEntity = new HttpEntity<>(dataHeaders);
            
            // ami-id - 인스턴스를 시작하기 위해 사용된 AMI ID
            info.put("ami-id", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/ami-id",
        		HttpMethod.GET, dataEntity, String.class).getBody());

            // instance-id
            info.put("instance-id", rest.exchange(
                "http://169.254.169.254/latest/meta-data/instance-id",
                HttpMethod.GET, dataEntity, String.class).getBody());
            
            // instance-type
            info.put("instance-type", rest.exchange(
                "http://169.254.169.254/latest/meta-data/instance-type",
                HttpMethod.GET, dataEntity, String.class).getBody());
            
            // mac - 인스턴스의 미디어 액세스 제어 주소
            info.put("mac", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/mac",
        		HttpMethod.GET, dataEntity, String.class).getBody());
            
            // local-hostname
            info.put("local-hostname", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/local-hostname",
        		HttpMethod.GET, dataEntity, String.class).getBody());
            
            // local-ipv4 - IPv6 전용 인스턴스인 경우 이 항목이 설정되지 않고 HTTP 404 응답이 발생
            info.put("local-ipv4", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/local-ipv4",
        		HttpMethod.GET, dataEntity, String.class).getBody());

            // public-hostname -  enableDnsHostnames 속성이 true로 설정된 경우에만 반환
            info.put("public-hostname", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/public-hostname",
        		HttpMethod.GET, dataEntity, String.class).getBody());

            // public-ipv4 - 인스턴스와 탄력적 IP 주소가 연결된 경우 반환된 값은 탄력적 IP 주소
            info.put("public-ipv4", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/public-ipv4",
        		HttpMethod.GET, dataEntity, String.class).getBody());

            // placement/availability-zone - 인스턴스가 시작된 가용 영역
            info.put("availability-zone", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/placement/availability-zone",
        		HttpMethod.GET, dataEntity, String.class).getBody());

            // placement/availability-zone-id - 정적 가용 영역 ID
            info.put("availability-zone-id", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/placement/availability-zone-id",
        		HttpMethod.GET, dataEntity, String.class).getBody());

            // placement/region - 인스턴스가 시작된 AWS 리전
            info.put("region", rest.exchange(
        		"http://169.254.169.254/latest/meta-data/placement/region",
        		HttpMethod.GET, dataEntity, String.class).getBody());
            
        } catch (Exception e) {
            info.put("error", "실패: " + e.getMessage());
            e.printStackTrace();
        }
        
        return info;
    }
    
    
    @ResponseBody
    @GetMapping(value = "/ec2-info/dynamic-data", produces = "application/json; charset=UTF-8")
    public Map<String, String> ec2DynamicInfo(HttpServletRequest request) {
    	Map<String, String> info = new HashMap<>();
    	
    	try {
    		// 타임아웃 설정
    		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    		factory.setConnectTimeout(10000);
    		factory.setReadTimeout(5000);
    		RestTemplate rest = new RestTemplate(factory);
    		
    		
//    		// 1. 토큰 발급
    		String token = getImdsToken(rest);
    		
    		// 2. 다이나믹 데이터
    		HttpHeaders dataHeaders = new HttpHeaders();
    		dataHeaders.set("X-aws-ec2-metadata-token", token);
    		HttpEntity<String> dataEntity = new HttpEntity<>(dataHeaders);
    		
    		// instance-identity/document - 인스턴스 ID, 프라이빗 IP 주소 등 인스턴스 속성을 포함하는 JSON
    		info.put("document", rest.exchange(
    				"http://169.254.169.254/latest/dynamic/instance-identity/document",
    				HttpMethod.GET, dataEntity, String.class).getBody());
    		
    		// instance-identity/pkcs7 - 문서의 신뢰성 및 서명 내용을 검증하는 데 사용
    		info.put("pkcs7", rest.exchange(
    				"http://169.254.169.254/latest/dynamic/instance-identity/pkcs7",
    				HttpMethod.GET, dataEntity, String.class).getBody());
    		
    		// instance-identity/signature - 출처 및 신뢰성을 검증하기 위해 다른 사용자가 사용할 수 있는 데이터
    		info.put("signature", rest.exchange(
    				"http://169.254.169.254/latest/dynamic/instance-identity/signature",
    				HttpMethod.GET, dataEntity, String.class).getBody());
    		
    	} catch (Exception e) {
    		info.put("error", "실패: " + e.getMessage());
    		e.printStackTrace();
    	}
    	
    	return info;
    }
    
}