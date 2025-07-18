	package org.joonzis.domain;
	
	import java.sql.Timestamp;
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
	public class UsersVO {
		private int user_no, user_rank, user_play_count, user_1st_count;
		private long user_point;
		private String user_nick, user_id, user_pw, user_email;
		private Date user_date;
		private int ischatbanned;
	    private Timestamp banned_timestamp;
	}
