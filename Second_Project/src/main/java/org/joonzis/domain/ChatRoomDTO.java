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
    private String mSender;

    @JsonProperty("mContent")
    private String mContent;

    @JsonProperty("mReceiver")
    private String mReceiver;

    @JsonProperty("mTimestamp")
    private String mTimestamp;
}