package org.joonzis.domain;

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
public class UserInfoDecoDTO {
	private int user_no;
    private int user_rank;
	private String user_nick;
	
    private String imageFileName;
    private String user_profile_img;
}
