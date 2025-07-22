package org.joonzis.domain;

import java.util.Date;

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
public class UserInfoDTO {
	private int user_no, user_rank, user_play_count, user_1st_count, is_logged_in;
	private long user_point;
	private String user_nick, user_id, user_pw, user_email;
	private Date user_date;
	private int ischatbanned; // 0: 정상, 1: 채팅 금지
    private Date banned_timestamp;
	
    private Integer boundaryItemNo;
    private Integer titleItemNo;
    private Integer fontcolorItemNo;
    private Integer backgroundItemNo;
    private Integer balloonItemNo;

}
