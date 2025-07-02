package org.joonzis.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.Data;
import lombok.extern.log4j.Log4j;

@Log4j
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    // 샘플 FAQ 데이터
    private static final List<FAQ> faqList = Arrays.asList(
        new FAQ(1, "주문 취소는 어떻게 하나요?", "마이페이지 > 주문내역에서 취소가 가능합니다.")
    );

    /* FAQ 목록 조회 */
    @GetMapping("/faq")
    public ResponseEntity<List<FAQ>> getFAQ() {
        log.info("FAQ 목록 조회 요청");
        return ResponseEntity.ok(faqList);
    }

    /* 1:1 문의 생성 */
    @PostMapping("/inquiry")
    public ResponseEntity<Map<String, String>> createInquiry(
            @RequestBody InquiryRequest request) {
        log.info(String.format("New inquiry from user %d: [%s] %s", 
            request.getUserId(), request.getSubject(), request.getMessage()));
        // TODO: 실제 DB 저장 로직 추가
        return ResponseEntity.status(HttpStatus.CREATED)
                             .body(Map.of("message", "문의가 정상적으로 접수되었습니다."));
    }

    /* FAQ 데이터 DTO */
    @Data
    static class FAQ {
        private final int id;
        private final String question;
        private final String answer;
    }

    /* 문의 요청 DTO */
    @Data
    static class InquiryRequest {
        private Long userId;
        private String subject;
        private String message;
    }
}
