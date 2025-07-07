package org.joonzis.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatRoomDTO {

    public enum MessageType {
        SERVER_CHAT,   // 서버 전체 채팅 메시지
        GAME_CHAT,     // 게임룸 내 채팅 메시지
        WHISPER_CHAT,  // 귓속말 메시지

        SERVER_JOIN,   // 서버 채팅방 입장
        SERVER_LEAVE,  // 서버 채팅방 퇴장
        GAME_JOIN,     // 게임룸 채팅방 입장
        GAME_LEAVE;    // 게임룸 채팅방 퇴장

        @JsonCreator
        public static MessageType fromString(String name) {
            return MessageType.valueOf(name.toUpperCase());
        }

        @JsonValue
        public String toValue() {
            return this.name();
        }
    }

    @JsonProperty("mType")
    private MessageType mType;

    @JsonProperty("gameroomNo")
    private Long gameroomNo; // 게임룸 채팅 시 사용될 게임룸 고유 번호 (DB의 gameroom_No와 매핑)

    @JsonProperty("mSender")
    private String mSender; // 발신자 닉네임 (표시용)

    @JsonProperty("mSenderNo")
    private Long mSenderNo; // 발신자 고유 번호 (실제 식별 및 라우팅용)

    @JsonProperty("mContent")
    private String mContent; // 메시지 내용

    @JsonProperty("mReceiver")
    private String mReceiver; // 수신자 닉네임 (귓속말 시 표시용)

    @JsonProperty("mReceiverNo")
    private Long mReceiverNo; // 수신자 고유 번호 (귓속말 라우팅용)

    @JsonProperty("mTimestamp")
    private Long mTimestamp; // 메시지 전송 시간 (Long 타입의 Unix 타임스탬프 - milliseconds)
    
    // --- toString() 메서드 오버라이드 ---
    @Override
    public String toString() {
        // 로그 가독성을 높이기 위해 JSON 형식 또는 사용자 정의 텍스트 형식으로 출력
        // 여기서는 JSON 형식으로 예시를 듭니다. (더 유연한 로깅을 위해 ObjectMapper 사용도 고려)
        return String.format(
            "{\"mTimestamp\": %d, \"mType\": \"%s\", \"gameroomNo\": %s, \"mSender\": \"%s\", \"mSenderNo\": %d, \"mContent\": \"%s\", \"mReceiver\": \"%s\", \"mReceiverNo\": %d}",
            mTimestamp,
            mType,
            (gameroomNo != null ? gameroomNo : "null"), // null 값 처리
            mSender,
            mSenderNo,
            mContent != null ? mContent.replace("\"", "\\\"") : "", // 메시지 내용에 따옴표가 있을 경우 이스케이프 처리
            mReceiver != null ? mReceiver : "null", // null 값 처리
            mReceiverNo != null ? mReceiverNo : "null" // null 값 처리
        );
        /*
        // 또는 더 읽기 쉬운 단순 텍스트 형식으로
        return String.format("[%s] type:%s room:%s sender:%s(%d) receiver:%s(%d) content:\"%s\"",
            (mTimestamp != null ? java.time.Instant.ofEpochMilli(mTimestamp).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "N/A"),
            mType,
            (gameroomNo != null ? gameroomNo : "N/A"),
            mSender,
            (mSenderNo != null ? mSenderNo : -1),
            (mReceiver != null ? mReceiver : "N/A"),
            (mReceiverNo != null ? mReceiverNo : -1),
            mContent
        );
        */
    }
}