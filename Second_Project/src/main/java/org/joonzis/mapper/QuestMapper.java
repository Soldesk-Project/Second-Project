package org.joonzis.mapper;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.QuestRequestVO;

public interface QuestMapper {

//	void insertQuest(QuestRequestVO questRequestVO);
	void insertQuest(
		    @Param("subject") String subject,
		    @Param("question_text") String questionText,
		    @Param("option_1") String option1,
		    @Param("option_2") String option2,
		    @Param("option_3") String option3,
		    @Param("option_4") String option4,
		    @Param("correct_answer") int correctAnswer,
		    @Param("image_data") byte[] imageData,
		    @Param("user_no") Long userNo
		);

}
