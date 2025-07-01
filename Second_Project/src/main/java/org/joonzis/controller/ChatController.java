package org.joonzis.controller;

import org.joonzis.domain.ChatRoomDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate; // SimpMessagingTemplate 임포트 확인
import org.springframework.stereotype.Controller;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor; // 이 어노테이션이 있어야 생성자 주입이 작동합니다.
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor // ★★★ 이 어노테이션이 있어야 생성자 주입이 작동합니다 ★★★
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate; // ★★★ 주석 해제 ★★★
    // private final ChatLogService chatLogService; // 필요하면 주석 해제

    // ObjectMapper는 @RequiredArgsConstructor로 주입받거나, 필드에 final을 붙여서 초기화하지 않는다면
    // 클래스 멤버 변수로 선언하고 사용하면 됩니다. 현재는 필드 초기화 방식입니다.
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatRoomDTO sendMessage(
            @Payload ChatRoomDTO chatRoomDTO,
            org.springframework.messaging.Message<?> message
    ) {
        try {
            byte[] payloadBytes = (byte[]) message.getPayload();
            String rawJson = new String(payloadBytes, "UTF-8");
            log.info("Received RAW JSON for sendMessage: {}", rawJson);
        } catch (Exception e) {
            log.error("Error reading raw payload for sendMessage", e);
        }

        log.info("Received message after DTO mapping: {}", chatRoomDTO);
        return chatRoomDTO;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatRoomDTO addUser(
            @Payload ChatRoomDTO chatRoomDTO,
            SimpMessageHeaderAccessor headerAccessor,
            org.springframework.messaging.Message<?> message
    ) {
        try {
            byte[] payloadBytes = (byte[]) message.getPayload();
            String rawJson = new String(payloadBytes, "UTF-8");
            log.info("Received RAW JSON for addUser: {}", rawJson); // 원본 JSON 로깅
        } catch (Exception e) {
            log.error("Error reading raw payload for addUser", e);
        }

        // ★★★ 이 부분에 널 체크 추가 ★★★
        String sender = chatRoomDTO.getMSender(); // 먼저 값을 변수에 저장
        if (sender != null && headerAccessor.getSessionAttributes() != null) { // sender와 sessionAttributes 모두 널이 아닌지 확인
            headerAccessor.getSessionAttributes().put("username", sender);
            log.info("User added (after DTO mapping): {}", sender); // 널 체크 후 로그
        } else {
            log.warn("Attempted to add user with null sender or session attributes: DTO={}, SessionAttributes={}", chatRoomDTO, headerAccessor.getSessionAttributes());
            // 필요하다면 여기서 적절한 예외 처리 또는 기본값 설정
        }

        chatRoomDTO.setMType(ChatRoomDTO.MessageType.JOIN);
        chatRoomDTO.setMContent(sender != null ? sender + " 님이 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        return chatRoomDTO;
    }

    @MessageMapping("/chat.sendWhisper")
    public void sendWhisper(
            @Payload ChatRoomDTO chatRoomDTO,
            org.springframework.messaging.Message<?> message
    ) {
        try {
            byte[] payloadBytes = (byte[]) message.getPayload();
            String rawJson = new String(payloadBytes, "UTF-8");
            log.info("Received RAW JSON for sendWhisper: {}", rawJson);
        } catch (Exception e) {
            log.error("Error reading raw payload for sendWhisper", e);
        }

        log.info("Received whisper (after DTO mapping) from " + chatRoomDTO.getMSender() +
                 " to " + chatRoomDTO.getMReceiver() + ": " + chatRoomDTO.getMContent());
        
        // ★★★ 이제 messagingTemplate이 정상적으로 사용될 것입니다. ★★★
        messagingTemplate.convertAndSendToUser(
           chatRoomDTO.getMReceiver(), "/queue/whisper", chatRoomDTO);
    }
}