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

    @JsonProperty("mTimestamp")
    private Long mTimestamp; // 메시지 전송 시간 (Long 타입의 Unix 타임스탬프 - milliseconds)
    
    // --- toString() 메서드 오버라이드 ---
    @Override
    public String toString() {
        // null 값 처리 로직을 String.format()에 맞게 변경
        // Long 타입 필드도 null일 경우 "null" 문자열로 변환
        String formattedTimestamp = (mTimestamp != null) ? String.valueOf(mTimestamp) : "null";
        String formattedGameroomNo = (gameroomNo != null) ? String.valueOf(gameroomNo) : "null";
        String formattedMSenderNo = (mSenderNo != null) ? String.valueOf(mSenderNo) : "null";

        // 메시지 내용의 따옴표 이스케이프 및 null 처리
        String escapedMContent = (mContent != null) ? mContent.replace("\"", "\\\"") : "";
        String escapedMSender = (mSender != null) ? mSender.replace("\"", "\\\"") : "null";

        return String.format(
            "{\"mTimestamp\": %s, \"mType\": \"%s\", \"gameroomNo\": %s, \"mSender\": \"%s\", \"mSenderNo\": %s, \"mContent\": \"%s\", \"mReceiver\": \"%s\", \"mReceiverNo\": %s}",
            formattedTimestamp,
            mType != null ? mType.name() : "null", // MessageType도 null 체크
            formattedGameroomNo,
            escapedMSender,
            formattedMSenderNo,
            escapedMContent
        );
    }
}