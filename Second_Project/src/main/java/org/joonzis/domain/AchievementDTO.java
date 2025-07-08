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
public class AchievementDTO {
	private int ach_content, ach_reward;
	private String ach_title, is_reward, ach_type;
}
