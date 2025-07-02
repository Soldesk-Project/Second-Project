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
	
	private String boundary_class_name;
    private String title_class_name;
    private String background_class_name;
    private String balloon_class_name;
}
