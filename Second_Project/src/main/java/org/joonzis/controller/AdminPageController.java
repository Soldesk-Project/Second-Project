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
import org.joonzis.domain.FaqVO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.NoticeVO;
import org.joonzis.domain.QuestRequestVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.service.AdminService;
import org.joonzis.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminPageController {

    @Autowired
    private AdminService adminService;
    
    @Autowired
    private FileUploadService fileUploadService;
    
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
    
    // 유저 조회 (조건 없이)
    @GetMapping("/users/all")
    public ResponseEntity<List<UsersVO>> getAllUsers() {
        List<UsersVO> users = adminService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }
    
    // 유저 검색 (조건 有) - ischatbanned, banned_timestamp 포함하도록 수정 필요
    @GetMapping(value = "/users/search", produces = "application/json; charset=UTF-8")
    public ResponseEntity<List<UsersVO>> searchUsers(@RequestParam(name = "searchType") String searchType, @RequestParam(name = "searchValue", required = false, defaultValue = "") String searchValue) {
        List<UsersVO> users = adminService.searchUsers(searchType, searchValue);
        System.out.println(users);
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
    public ResponseEntity<?> deleteAchievements(@RequestParam("type") String type, @RequestParam("titles") String titles) {
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
        	
        	String savedFileName = fileUploadService.saveFile(itemImage);

            ItemVO itemVO = new ItemVO();
            itemVO.setItem_type(type);
            itemVO.setItem_name(itemName);
            itemVO.setItem_price(itemPrice);
            itemVO.setImageFileName(savedFileName);

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
}