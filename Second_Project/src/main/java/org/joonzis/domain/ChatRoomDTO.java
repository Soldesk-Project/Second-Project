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
    private String mTimestamp; // 메시지 전송 시간 (String 대신 Long 타입의 Unix 타임스탬프를 더 권장합니다. Date 객체로 변환 용이)
}