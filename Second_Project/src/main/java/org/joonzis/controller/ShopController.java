package org.joonzis.controller;

import java.io.IOException;

import javax.servlet.http.HttpServletResponse;

import org.joonzis.domain.PaymentDTO;
import org.joonzis.service.MemberService;
import org.joonzis.service.pay.PayService;
import org.joonzis.service.pay.TossPayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ShopController {
	
	@Autowired
	@Qualifier("kakaoPayService")
	private PayService kakaoPay;

	@Autowired
	private TossPayService tossPayService;
	
	@Autowired
	private MemberService memberservice;
	
	@GetMapping("/user/point")
	public ResponseEntity<Integer> getUserPoint(@RequestParam("user_id") String user_id) {
	    int point = memberservice.getUserPoint(user_id);
	    return ResponseEntity.ok(point);
	}
	
	@PostMapping("/pay/kakao")
    public ResponseEntity<String> kakaoPay(@RequestBody PaymentDTO req) {
        try {
            String url = kakaoPay.ready(req.getUserId(), req.getAmount()); // 결제창 URL
            return ResponseEntity.ok(url);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("결제 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 결제 성공 콜백 → 결제 승인 → 포인트 적립 → shop 페이지로 리다이렉트
     */
    @GetMapping("/pay/kakao/success")
    public ResponseEntity<?> kakaoPaySuccess(@RequestParam String pg_token,
                                             @RequestParam String userId,
                                             @RequestParam int amount) {
        try {
        	kakaoPay.approve(pg_token, userId);
            memberservice.addPoint(userId, amount); // 포인트 적립
            // 결제 완료 후 React로 리다이렉트
            return ResponseEntity.status(302)
                    .header("Location", "http://localhost:3000/shop")
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("결제 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/pay/toss/success")
    public void tossSuccess(@RequestParam String paymentKey,
                            @RequestParam String orderId,
                            @RequestParam int amount,
                            @RequestParam String userId,
                            HttpServletResponse response) throws IOException {
        try {
            // 🔍 디버깅용 로그 출력
            System.out.println("🔽 [Toss 결제 성공 redirect 파라미터]");
            System.out.println("📦 paymentKey: " + paymentKey);
            System.out.println("📦 orderId: " + orderId);
            System.out.println("📦 amount: " + amount);
            System.out.println("📦 userId: " + userId);

            tossPayService.confirmPayment(paymentKey, orderId, amount);
            memberservice.addPoint(userId, amount);

            response.sendRedirect("http://localhost:3000/shop");
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "토스 결제 승인 실패");
        }
    }

}
