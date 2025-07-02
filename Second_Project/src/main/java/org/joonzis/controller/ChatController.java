package org.joonzis.controller;

import org.joonzis.domain.ChatRoomDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    // 현재 활성화된 사용자 세션을 user_no를 기반으로 관리하는 맵
    // key: user_no (Long), value: WebSocket Session ID (String)
    // NOTE: 만약 닉네임으로 메시지를 라우팅하고 싶다면, 이 맵은 user_nick을 key로 사용할 수도 있습니다.
    // 하지만 현재 userNo 기반으로 세션 속성에 저장하고 있으므로 userNo를 key로 유지합니다.
    private static final Map<Long, String> activeSessions = new ConcurrentHashMap<>();

    // 일반 채팅 메시지 처리
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatRoomDTO sendMessage(@Payload ChatRoomDTO chatMessage) {
        // DTO 매핑 후 받은 메시지를 로깅 (mSenderNo 포함)
        log.info("Received public message from sender (No: {}), nick {}: {}",
                    new Object[]{chatMessage.getMSenderNo(), chatMessage.getMSender(), chatMessage.getMContent()});
        
        // 메시지 타입이 올바른지 확인 (프론트에서 CHAT으로 보냈을 것이지만, 서버에서 한 번 더 확인)
        if (chatMessage.getMType() == null || chatMessage.getMType() != ChatRoomDTO.MessageType.CHAT) {
            chatMessage.setMType(ChatRoomDTO.MessageType.CHAT);
        }
        // 타임스탬프 설정 (백엔드에서 생성하여 일관성 유지)
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // @SendTo("/topic/public") 어노테이션이 이 DTO를 모든 구독자에게 브로드캐스트합니다.
        return chatMessage;
    }

    // 사용자 입장 메시지 처리
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatRoomDTO addUser(@Payload ChatRoomDTO chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        Long userNo = chatMessage.getMSenderNo(); // 클라이언트에서 mSenderNo를 보낼 것임
        String username = chatMessage.getMSender(); // 닉네임 (표시용)

        // 세션 속성에 사용자 번호와 닉네임 저장
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userNo", userNo);
            headerAccessor.getSessionAttributes().put("username", username); // 닉네임도 저장
        } else {
            log.warn("Session attributes are null for addUser operation. User: {}", username);
        }

        String sessionId = headerAccessor.getSessionId();
        // userNo와 sessionId가 모두 유효한 경우에만 activeSessions 맵에 추가
        if (userNo != null && sessionId != null) {
            activeSessions.put(userNo, sessionId);
            log.info("User joined: {} (No: {}) with session ID: {}", new Object[]{username, userNo, sessionId});
        } else {
            log.warn("Failed to add user session for sender: {}. userNo: {}, sessionId: {}", new Object[]{username, userNo, sessionId});
        }

        // 메시지 타입 및 내용 설정
        chatMessage.setMType(ChatRoomDTO.MessageType.JOIN);
        chatMessage.setMContent(username != null ? username + "님이 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        return chatMessage;
    }

    // 귓속말 메시지 처리
    @MessageMapping("/chat.sendWhisper")
    public void sendWhisper(@Payload ChatRoomDTO chatMessage) {
        String senderNick = chatMessage.getMSender();
        String receiverNick = chatMessage.getMReceiver(); // 클라이언트가 이 값을 보낼 것임
        String content = chatMessage.getMContent();
        Long senderNo = chatMessage.getMSenderNo(); // 클라이언트에서 보낼 것임 (보낸 사람에게 다시 보내기 위해)

        log.info("Received whisper from {}. To {}. Content: {}", new Object[]{senderNick, receiverNick, content});

        chatMessage.setMType(ChatRoomDTO.MessageType.WHISPER);
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        // 귓속말 수신자에게 메시지를 전송합니다.
        // /user/{수신자닉네임}/queue/whisper 경로로 메시지를 보냅니다.
        // 클라이언트에서 `userNick`으로 구독하고 있으므로 `receiverNick`을 사용자 식별자로 사용합니다.
        if (receiverNick != null && !receiverNick.trim().isEmpty()) {
            messagingTemplate.convertAndSendToUser(receiverNick, "/queue/whisper", chatMessage);
            log.info("Whisper sent to receiver nick: {}", receiverNick);
        } else {
            log.warn("Cannot send whisper: receiverNick is null or empty for content: {}", content);
        }

        // 보낸 사람에게도 귓속말 내용을 보여주기 위해 다시 보냅니다. (자신이 보낸 귓속말도 채팅창에 보이도록)
        // 클라이언트에서 `userNick`으로 구독하고 있으므로 `senderNick`을 사용자 식별자로 사용합니다.
        if (senderNick != null && !senderNick.trim().isEmpty()) {
            messagingTemplate.convertAndSendToUser(senderNick, "/queue/whisper", chatMessage);
            log.info("Whisper sent back to sender nick: {}", senderNick);
        }
    }
}