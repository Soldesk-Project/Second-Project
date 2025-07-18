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
public class UserQuestionHistoryDTO {
	private String userNick;
	private	String subject;
	private int historyId;
	private int questionId;
	private int selectedAnswer;
	private int correctAnswer;
	private boolean isCorrect;
	private String submittedAt;
}
