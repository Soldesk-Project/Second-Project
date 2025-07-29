package org.joonzis.controller;

import java.io.IOException;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PathVariable;
import org.joonzis.domain.InquiryVO;
import org.joonzis.service.FaqService;
import org.joonzis.service.InquiryService;
import org.joonzis.service.NoticeService;
import org.joonzis.service.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.log4j.Log4j;

@Log4j
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/customer")
public class CustomerController {
	
    @Autowired
    private NoticeService noticeService;

    @Autowired
    private FaqService faqService;

    @Autowired
    private ProblemService problemService;
	
    @Autowired
    private InquiryService inquiryService;

    
    // 1) 공지사항
    @GetMapping("/notices")
    public ResponseEntity<Map<String, Object>> getNotices(
            @RequestParam(value="page", defaultValue="1") int page,
            @RequestParam(value="size", defaultValue="15") int size) {
        Map<String, Object> data = noticeService.getNotices(page, size);
        return ResponseEntity.ok(data);
    }

    // 2) FAQ
    @GetMapping("/faqs")
    public ResponseEntity<Map<String,Object>> getFaqs(
            @RequestParam(value="page", defaultValue="1") int page,
            @RequestParam(value="size", defaultValue="15") int size) {
        Map<String,Object> data = faqService.getFaqs(page, size);
        return ResponseEntity.ok(data);
    }
    
    // 3) 문제 제출
    @GetMapping("/problems")
    public ResponseEntity<Map<String,Object>> getProblems(
    		@RequestParam(value="page", defaultValue="1") int page,
    		@RequestParam(value="size", defaultValue="15") int size) {
    	Map<String,Object> data = problemService.getProblems(page, size);
    	return ResponseEntity.ok(data);
    }
    
    // 4)1:1 문의
    @GetMapping("/inquiries")
    public ResponseEntity<Map<String, Object>> getInquiries(
    		@RequestParam(value = "page", defaultValue = "1") int page,
    		@RequestParam(value = "size", defaultValue = "10") int size) {
    	Map<String, Object> data = inquiryService.getInquiries(page, size);
    	return ResponseEntity.ok(data);
    }
    
    // 4-1) 1:1 문의 상세 페이지
    @GetMapping("/inquiries/{id}")
    public ResponseEntity<InquiryVO> getInquiryDetail(@PathVariable Long id) {
    	InquiryVO vo = inquiryService.findById(id);
    	if (vo == null) {
    		return ResponseEntity.notFound().build();
    	}
    	return ResponseEntity.ok(vo);
    }

    // 4-2) 1:1문의 게시글 등록 페이지
    @PostMapping(
      path = "/inquiry",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String,String>> createInquiry(
            @RequestParam("userNick") String UserNick,  // <-- wrong name/case
            @RequestParam("subject") String subject,
            @RequestParam("message") String message,
            @RequestParam("postPassword") int    postPassword,
            @RequestParam("email") String email,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {
        // VO에 담기
        InquiryVO vo = new InquiryVO();
        vo.setUserNick(UserNick);
        vo.setSubject(subject);
        vo.setMessage(message);
        vo.setPostPassword(postPassword);
        vo.setEmail(email);

        // Service 호출 (파일 처리까지)
        inquiryService.createInquiry(vo, files);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("message", "문의가 정상적으로 접수되었습니다."));
    }
}
