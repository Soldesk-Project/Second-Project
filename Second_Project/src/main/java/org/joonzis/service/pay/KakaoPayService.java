package org.joonzis.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service("kakaoPayService")
public class KakaoPayService implements PayService {

    @Value("${kakao.admin-key}")
    private String adminKey;

    private static final String CID = "TC0ONETIME"; // 테스트용 CID
    private static final String READY_URL = "https://kapi.kakao.com/v1/payment/ready";
    private static final String APPROVE_URL = "https://kapi.kakao.com/v1/payment/approve";

    // ✅ 사용자별 tid 및 order_id 저장 (동시성 고려)
    private final Map<String, String> tidMap = new ConcurrentHashMap<>();
    private final Map<String, String> orderMap = new ConcurrentHashMap<>();

    @Override
    public String ready(String userId, int amount) throws Exception {
        RestTemplate restTemplate = new RestTemplate();

        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + adminKey);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 고유한 주문번호 생성
        String orderId = "order_" + System.currentTimeMillis();

        // 요청 파라미터
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("cid", CID);
        params.add("partner_order_id", orderId);
        params.add("partner_user_id", userId);
        params.add("item_name", "포인트 충전");
        params.add("quantity", "1");
        params.add("total_amount", String.valueOf(amount));
        params.add("vat_amount", "0");
        params.add("tax_free_amount", "0");

        String base = "http://localhost:9099/api/pay/kakao";
        params.add("approval_url", base + "/success?userId=" + userId + "&amount=" + amount);
        params.add("cancel_url", "http://localhost:3000/pay/cancel");
        params.add("fail_url", "http://localhost:3000/pay/fail");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(READY_URL, request, Map.class);
            Map body = response.getBody();

            if (body != null) {
                String tid = (String) body.get("tid");
                tidMap.put(userId, tid);       // ✅ userId 기준 tid 저장
                orderMap.put(userId, orderId); // ✅ userId 기준 orderId 저장
                return (String) body.get("next_redirect_pc_url");
            }

            throw new IllegalStateException("카카오페이 응답이 null입니다");

        } catch (HttpClientErrorException e) {
            System.err.println("❌ 카카오페이 요청 실패: " + e.getResponseBodyAsString());
            throw e;
        }
    }

    @Override
    public String approve(String... params) throws Exception {
        String pgToken = params[0];
        String userId = params[1];

        String tid = tidMap.get(userId);
        String orderId = orderMap.get(userId);

        if (tid == null || orderId == null) {
            throw new IllegalStateException("❌ 결제 준비 데이터가 누락되었습니다.");
        }

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + adminKey);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> reqParams = new LinkedMultiValueMap<>();
        reqParams.add("cid", CID);
        reqParams.add("tid", tid);
        reqParams.add("partner_order_id", orderId);   // ✅ 일치하는 orderId 사용
        reqParams.add("partner_user_id", userId);
        reqParams.add("pg_token", pgToken);

        // 디버그 출력
        System.out.println("✅ 승인 요청 시작");
        System.out.println("userId = " + userId);
        System.out.println("pg_token = " + pgToken);
        System.out.println("tid = " + tid);
        System.out.println("order_id = " + orderId);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(reqParams, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(APPROVE_URL, request, Map.class);

        Map body = response.getBody();
        if (body != null) {
            // ✅ 승인 성공 후 tid, orderId 제거 (선택)
            tidMap.remove(userId);
            orderMap.remove(userId);
            return "success";
        }

        throw new IllegalStateException("카카오페이 결제 승인 실패");
    }
}
