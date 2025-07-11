package org.joonzis.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.joonzis.service.InquiryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
        //log.info("FAQ 목록 조회 요청");
        return ResponseEntity.ok(faqList);
    }

    @Autowired
    private InquiryService inquiryService;

    /** 페이징된 1:1 문의 리스트 조회 */
    @GetMapping("/inquiries")
    public ResponseEntity<Map<String, Object>> getInquiries(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "15") int size) {
        Map<String, Object> data = inquiryService.getInquiries(page, size);
        return ResponseEntity.ok(data);
    }

    /** 1:1 문의 생성 */
    @PostMapping("/inquiry")
    public ResponseEntity<Map<String, String>> createInquiry(
            @RequestBody Map<String, Object> payload) {
        Long   userId  = Long.valueOf(payload.get("userId").toString());
        String subject = (String) payload.get("subject");
        String message = (String) payload.get("message");

        inquiryService.createInquiry(userId, subject, message);

        return ResponseEntity
                .status(HttpStatus.CREATED)
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
