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
        CHAT,
        WHISPER,
        JOIN,
        LEAVE;

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

    @JsonProperty("mSender")
    private String mSender; // 발신자 닉네임 (표시용)

    @JsonProperty("mSenderNo") // ✅ 발신자 고유 번호 (실제 식별 및 라우팅용)
    private Long mSenderNo;

    @JsonProperty("mContent")
    private String mContent;

    @JsonProperty("mReceiver")
    private String mReceiver; // 수신자 닉네임 (귓속말 시 표시용)

    @JsonProperty("mReceiverNo") // ✅ 수신자 고유 번호 (귓속말 라우팅용)
    private Long mReceiverNo;

    @JsonProperty("mTimestamp")
    private String mTimestamp;
}