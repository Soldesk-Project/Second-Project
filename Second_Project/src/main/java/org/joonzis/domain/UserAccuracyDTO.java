package org.joonzis.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UserAccuracyDTO {

	private String userNick;
	private int totalCount;
	private int correctCount;
	private double accuracyPct;
}
