package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.QuestionDTO;

public interface PlayService {
	
	// 카테고리 별 문제 가져오기
	List<QuestionDTO> getQuestionsByCategory(String category);
	
	public void increaseRewardPoints(int point, String userNick);
}
