package org.joonzis.service;

import org.joonzis.domain.QuestRequestVO;

public interface QuestService {

//	void registerQuest(QuestRequestVO questRequestVO);
	void registerQuest(
	        String subject,
	        String questionText,
	        String option1,
	        String option2,
	        String option3,
	        String option4,
	        int correctAnswer,
	        byte[] imageData,
	        Long userNo
	    );

}
