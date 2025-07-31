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
    private String userProfileImg;
    private Integer bgItemNo;
    private Integer blItemNo;
    private Integer bdItemNo;
    private Integer titleItemNo;
    private Integer fontColorItemNo;
    
}
