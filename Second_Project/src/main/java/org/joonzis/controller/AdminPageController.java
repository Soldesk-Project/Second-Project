package org.joonzis.controller;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.sql.Timestamp;

@RestController
@RequestMapping("/admin")
public class AdminPageController {

    @Autowired
    private AdminService adminService;
    
    // 문제 등록
    @PostMapping("/registerQuestion")
    public ResponseEntity<?> registerQuestion(@RequestBody QuestionDTO questionDTO,
                                              @RequestParam("category") String categoryParam) {
        System.out.println("문제 등록 요청 수신: " + questionDTO);
        System.out.println("수신된 카테고리 (테이블 결정용): " + categoryParam);

        try {
            String decodedCategory = URLDecoder.decode(categoryParam, "UTF-8");
            if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
                questionDTO.setImage_data(decodedBytes);
                questionDTO.setImage_data_base64(null);
            } else {
                questionDTO.setImage_data(null);
            }
            
            adminService.registerQuestion(questionDTO, decodedCategory);
            return new ResponseEntity<>("문제 등록 성공!", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return new ResponseEntity<>("잘못된 요청 데이터입니다: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("카테고리 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 등록 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 문제 검색
    @GetMapping(value = "/searchQuestions", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> searchQuestions(
            @RequestParam("category") String categoryParam,
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        try {
            String decodedCategory = URLDecoder.decode(categoryParam, "UTF-8");
            String decodedQuery = URLDecoder.decode(query, "UTF-8");

            Map<String, Object> result = adminService.searchQuestions(decodedCategory, decodedQuery, page, limit);

            return new ResponseEntity<>(result, HttpStatus.OK);

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("카테고리 또는 검색어 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "문제 검색 중 서버 내부 오류 발생.");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 문제 수정
    @PostMapping("/editQuestion")
    public ResponseEntity<?> editQuestion(@RequestBody QuestionDTO questionDTO,
                                          @RequestParam("category") String categoryParam) {
        System.out.println("문제 수정 요청 수신: " + questionDTO);
        System.out.println("수신된 카테고리 (테이블 결정용): " + categoryParam);

        try {
            String decodedCategory = URLDecoder.decode(categoryParam, "UTF-8");
            if (questionDTO.getImage_data_base64() != null && !questionDTO.getImage_data_base64().isEmpty()) {
                byte[] decodedBytes = Base64.getDecoder().decode(questionDTO.getImage_data_base64());
                questionDTO.setImage_data(decodedBytes);
                questionDTO.setImage_data_base64(null);
            } else {
                questionDTO.setImage_data(null);
            }

            adminService.updateQuestion(questionDTO, decodedCategory);
            return new ResponseEntity<>("문제 수정 성공!", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return new ResponseEntity<>("잘못된 요청 데이터입니다: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("카테고리 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("문제 수정 중 오류 발생: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 문제 삭제
    @DeleteMapping("/deleteQuestions")
    public ResponseEntity<?> deleteQuestions(
            @RequestParam("category") String categoryParam,
            @RequestParam("ids") String idsParam) {
        System.out.println("문제 삭제 요청 수신 - 카테고리: " + categoryParam + ", ID 목록: " + idsParam);

        try {
            String decodedCategory = URLDecoder.decode(categoryParam, "UTF-8");
            List<Integer> questionIds = Arrays.stream(idsParam.split(","))
                                              .map(Integer::parseInt)
                                              .collect(Collectors.toList());

            adminService.deleteQuestions(decodedCategory, questionIds);

            return new ResponseEntity<>("선택된 문제가 성공적으로 삭제되었습니다.", HttpStatus.OK);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return new ResponseEntity<>("카테고리 디코딩 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return new ResponseEntity<>("잘못된 문제 ID 형식입니다. 숫자로 구성된 쉼표 구분 문자열이어야 합니다.", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
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
}