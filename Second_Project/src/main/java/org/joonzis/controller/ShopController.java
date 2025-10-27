package org.joonzis.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletResponse;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.PaymentDTO;
import org.joonzis.service.ShopService;
import org.joonzis.service.UserService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@CrossOrigin(origins = "*")
public class ShopController {
	
	@Autowired
	@Qualifier("kakaoPayService")
	private PayService kakaoPay;

	@Autowired
	private TossPayService tossPayService;
	
	@Autowired
	private ShopService shopservice;
	
	@Autowired
	private UserService userservice;
	
	@GetMapping("/user/point")
	public ResponseEntity<Long> getUserPoint(@RequestParam("user_id") String user_id) {

	    long point = userservice.getUserPoint(user_id);

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
        	userservice.addPoint(userId, amount); // 포인트 적립
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
            tossPayService.confirmPayment(paymentKey, orderId, amount);
            userservice.addPoint(userId, amount);

            response.sendRedirect("http://192.168.0.112:3000/shop");
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "토스 결제 승인 실패");
        }
    }

    @GetMapping("/shop/items/all")
    public List<ItemVO> getItemsByCategories(@RequestParam List<String> category) {
        Map<String, String> categoryMap = Map.of(
            "테두리", "boundary",
            "칭호", "title",
            "글자색", "fontColor",
            "명함", "background",
            "말풍선", "balloon",
            "유니크", "unique",
            "기타", "etc"
        );

        // 클라이언트에서 받은 카테고리 리스트를 매핑
        List<String> mappedCategories = category.stream()
            .map(c -> categoryMap.getOrDefault(c, "unknown"))
            .filter(c -> !c.equals("unknown"))  // unknown 카테고리 제거(옵션)
            .collect(Collectors.toList());

        if (mappedCategories.isEmpty()) {
            return List.of(); // 빈 리스트 반환 또는 예외 처리 가능
        }

        // 서비스에 리스트 넘겨서 한 번에 아이템 조회
        return shopservice.getItemsByCategories(mappedCategories);
    }
    
    // 아이템 구매 - 인벤토리에 추가
    @PostMapping("/shop/buyItemInventory")
	public void postBuyItemInventory(@RequestParam("user_no") int user_no,
										@RequestParam("item_price") int item_price,
										@RequestParam("item_name") String item_name,
										@RequestParam("item_type") String item_type,
										@RequestParam("css_class_name") String css_class_name) {
    	Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("item_price", item_price);
        paramMap.put("user_no", user_no);
    	boolean success = userservice.userPointMinus(paramMap);
    	if(success) {
    		Map<String, Object> paramMap2 = new HashMap<>();
            paramMap2.put("item_name", item_name);
            paramMap2.put("item_type", item_type);
            paramMap2.put("css_class_name", css_class_name);
            paramMap2.put("user_no", user_no);
    		userservice.buyItemInventory(paramMap2);
    	}
	}
}
