package org.joonzis.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin")
public class AdminPageController {

    @Autowired
    private AdminService adminService;
    
    // 문제 등록
    @PostMapping("/registerQuestion")
    public ResponseEntity<?> registerQuestion(@RequestBody QuestionDTO questionDTO) {
        System.out.println("문제 등록 요청 수신: " + questionDTO);
        System.out.println("수신된 과목 (DB 저장용): " + questionDTO.getSubject());

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
        System.out.println("문제 수정 요청 수신: " + questionDTO);
        System.out.println("수신된 과목: " + questionDTO.getSubject());

        try {
            if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
                questionDTO.setImage_data(decodedBytes);
                questionDTO.setImage_data_base64(null);
            } else {
                questionDTO.setImage_data(null);
            }

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
    
    // 문제 삭제
    @DeleteMapping("/deleteQuestions")
    public ResponseEntity<?> deleteQuestions(
    		@RequestParam("subject") String subjectCode,
            @RequestParam("ids") String idsParam) {
    	System.out.println("문제 삭제 요청 수신 - 과목: " + subjectCode + ", ID 목록: " + idsParam);

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
    
    // 유저 조회 (조건 없이)
    @GetMapping("/users/all")
    public ResponseEntity<List<UsersVO>> getAllUsers() {
        List<UsersVO> users = adminService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }
    
    // 유저 검색 (조건 有) - ischatbanned, banned_timestamp 포함하도록 수정 필요
    @GetMapping(value = "/users/search", produces = "application/json; charset=UTF-8")
    public ResponseEntity<List<UsersVO>> searchUsers(
            @RequestParam(name = "searchType") String searchType,
            @RequestParam(name = "searchValue", required = false, defaultValue = "") String searchValue) {

        List<UsersVO> users = adminService.searchUsers(searchType, searchValue);
        return new ResponseEntity<>(users, HttpStatus.OK);
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
    
    // 업적 등록
    @PostMapping("/registerAchievement")
    public ResponseEntity<?> registerAchievement(@RequestBody AchievementDTO achievementDTO) {
        System.out.println("업적 등록 요청 수신: " + achievementDTO);

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
    public ResponseEntity<?> deleteAchievements(
            @RequestParam("type") String type,
            @RequestParam("titles") String titles) {
        System.out.println("업적 삭제 요청 수신 - 타입: " + type + ", 이름 목록: " + titles);

        try {
            String decodedType = URLDecoder.decode(type, "UTF-8");
        	List<String> achievementTitles = Arrays.stream(titles.split(","))
        					 								.map(String::trim)
        					 								.collect(Collectors.toList());

        	boolean success = adminService.deleteAchievementsByTitles(decodedType, achievementTitles); 

            if (success) {
                return new ResponseEntity<>("선택된 업적이 성공적으로 삭제되었습니다.", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("업적 삭제에 실패했습니다. 일부 업적이 존재하지 않거나 오류가 발생했습니다.", HttpStatus.BAD_REQUEST);
            }

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("타입 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "업적 삭제 중 서버 내부 오류가 발생했습니다.");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 업적 등록
    @PostMapping(value = "/registerItem", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> registerItem(@RequestParam("type") String type,
            @RequestParam("item_name") String itemName,
            @RequestParam("item_price") int itemPrice,
            @RequestPart(value = "item_image") MultipartFile itemImage
    ) {
        System.out.println("아이템 등록 요청 수신: ");
        System.out.println("타입: " + type);
        System.out.println("아이템 이름: " + itemName);
        System.out.println("아이템 가격: " + itemPrice);
        System.out.println("이미지 파일 존재 여부: " + (itemImage != null && !itemImage.isEmpty()));
        

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
            ItemVO itemVO = new ItemVO();
            itemVO.setItem_type(type);
            itemVO.setItem_name(itemName);
            itemVO.setItem_price(itemPrice);

            // 서비스 계층으로 데이터 전달
            adminService.registerItem(itemVO, itemImage); 
            
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
    public ResponseEntity<?> deleteItems(
            @RequestParam("type") String itemType, // 'type'을 'itemType'으로 변경하여 역할 명확화
            @RequestParam("itemNos") String itemNosString) {
        try {
            List<Integer> itemNos = Arrays.stream(itemNosString.split(","))
                                         .map(Integer::parseInt)
                                         .collect(Collectors.toList());

            // 서비스 계층으로 삭제 요청 전달 시, type 값을 itemType으로 사용
            adminService.deleteItems(itemType, itemNos); // **여기에 itemType 전달**

            return new ResponseEntity<>("아이템이 성공적으로 삭제되었습니다.", HttpStatus.OK);
        } catch (NumberFormatException e) {
            return new ResponseEntity<>("잘못된 아이템 번호 형식입니다.", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("아이템 삭제 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}