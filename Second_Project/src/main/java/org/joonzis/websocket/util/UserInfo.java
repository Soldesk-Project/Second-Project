package org.joonzis.websocket.util;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo {
	private String userNick;
    private String userNo;
    private String bgName;
    private String blName;
    private String bdName;
    private String titleName;
}
