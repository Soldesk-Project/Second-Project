package org.joonzis.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service("tossPayService")
public class TossPayService {

    @Value("${toss.secret-key}")
    private String secretKey;

    private static final String CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

    public void confirmPayment(String paymentKey, String orderId, int amount) throws Exception {
        RestTemplate restTemplate = new RestTemplate();

        // 🔍 디버깅 로그
        System.out.println("🔽 [Toss 결제 승인 요청]");
        System.out.println("📦 paymentKey: " + paymentKey);
        System.out.println("📦 orderId: " + orderId);
        System.out.println("📦 amount: " + amount);

        String encodedKey = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + encodedKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentKey", paymentKey);
        payload.put("orderId", orderId);
        payload.put("amount", amount);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(CONFIRM_URL, request, Map.class);

            if (response.getStatusCode() != HttpStatus.OK) {
                System.out.println("❌ Toss 결제 승인 실패 - 상태 코드: " + response.getStatusCode());
                throw new IllegalStateException("Toss 결제 승인 실패");
            }

            System.out.println("✅ Toss 결제 승인 성공: " + response.getBody());

        } catch (HttpClientErrorException e) {
            System.out.println("❗[TOSS 결제 승인 오류]");
            System.out.println("📛 상태 코드: " + e.getStatusCode());
            System.out.println("📄 응답 바디: " + e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            System.out.println("❗기타 예외 발생: " + e.getMessage());
            throw e;
        }
    }

}
