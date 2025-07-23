package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;
import org.joonzis.mapper.PlayMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlayServiceImpl implements PlayService {
	
	@Autowired
	PlayMapper playMapper;
	
	// 카테고리 별 문제 가져오기
	private static final List<String> ALLOWED_TABLES = List.of(
		"cpe", "cpei", "cpet", "ict", "icti", "lm1",
		"lm2", "net1", "net2", "sec"
	);

	@Override
	public List<QuestionDTO> getQuestionsByCategory(String category) {
	    if ("random".equalsIgnoreCase(category)) {
	        return playMapper.getRandomQuestions();  // 10개 테이블 통합 랜덤
	    }

	    // ✅ 안전한 카테고리명만 허용
	    if (!ALLOWED_TABLES.contains(category)) {
	        throw new IllegalArgumentException("허용되지 않은 카테고리 이름입니다: " + category);
	    }

	    return playMapper.getQuestionsByCategory(category);
	}
		
	@Override
	public void increaseRewardPoints(int point, String user_nick) {
		playMapper.increaseRewardPoints(point, user_nick);
	}

	@Override
	public void saveUserHistory(List<UserQuestionHistoryDTO> historyList) {
	    for (UserQuestionHistoryDTO dto : historyList) {
	    	playMapper.insertHistory(dto);
	    }
	}

	@Override
	public List<UserQuestionHistoryDTO> getQuestionReviewList(String user_nick) {
		System.out.println("getQuestionReviewList : " +user_nick);
		System.out.println("getQuestionReviewList : " +playMapper.getQuestionReviewList(user_nick).size());
		return playMapper.getQuestionReviewList(user_nick);
	}
	
	@Override
	public List<UserQuestionHistoryDTO> getUserQuestionHistory(String submittedAt) {
		return playMapper.getUserQuestionHistory(submittedAt);
	}
	
}
