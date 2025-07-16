package org.joonzis.controller;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.service.AdminService; // 인터페이스 임포트
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminPageController {

    @Autowired
    private AdminService adminService;

    @PostMapping("/registerQuestion")
    public ResponseEntity<?> registerQuestion(@RequestBody QuestionDTO questionDTO,
    		@RequestParam("category") String categoryParam) {
        System.out.println("문제 등록 요청 수신: " + questionDTO);
        System.out.println("수신된 카테고리 (테이블 결정용): " + categoryParam);

        try {
        	String decodedCategory = URLDecoder.decode(categoryParam, "UTF-8");
            // 이미지 데이터 처리: Base64 문자열을 byte[]로 변환하여 image_data에 저장
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
    
    @GetMapping(value = "/searchQuestions", produces = "application/json; charset=UTF-8") // ⭐ 이 줄을 수정했습니다!
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
}