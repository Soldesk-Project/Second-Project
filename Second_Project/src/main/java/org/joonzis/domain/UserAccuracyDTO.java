package org.joonzis.domain;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

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
